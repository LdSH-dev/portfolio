import Anthropic from "@anthropic-ai/sdk";
import { twinSystemPrompt } from "@/lib/twin-prompt";

const client = new Anthropic();

// Keep a public endpoint cheap and hard to abuse.
const MAX_TURNS = 12;
const MAX_CHARS = 600;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 15;

// Best-effort per-IP limit. It lives per serverless instance, which is enough
// to stop casual abuse; the Anthropic spend limit is the hard ceiling.
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_REQUESTS;
}

function parseMessages(body: unknown): Anthropic.MessageParam[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_TURNS * 2) return null;
  const messages: Anthropic.MessageParam[] = [];
  for (const m of raw) {
    const role = (m as { role?: unknown })?.role;
    const content = (m as { content?: unknown })?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    if (role === "user" && content.length > MAX_CHARS) return null;
    messages.push({ role, content: content.slice(0, 4000) });
  }
  if (messages[0].role !== "user" || messages.at(-1)!.role !== "user") return null;
  return messages;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "not-configured" }, { status: 503 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) return Response.json({ error: "rate-limited" }, { status: 429 });

  const messages = parseMessages(await request.json().catch(() => null));
  if (!messages) return Response.json({ error: "bad-request" }, { status: 400 });

  const stream = client.messages.stream(
    {
      model: "claude-haiku-4-5",
      max_tokens: 600,
      system: twinSystemPrompt,
      messages,
    },
    { signal: request.signal },
  );

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (error) {
        if (error instanceof Anthropic.APIError) console.error(`twin: API ${error.status}`, error.message);
        else console.error("twin:", error);
        controller.error(error);
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
