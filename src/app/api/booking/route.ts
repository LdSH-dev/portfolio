import { connection } from "next/server";
import { availableSlots, bookingConfigured, createBooking } from "@/lib/booking";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// A handful of bookings per visitor is plenty; this blocks scripted spam.
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 5;
}

export async function GET() {
  await connection();
  if (!bookingConfigured) return Response.json({ error: "not-configured" }, { status: 503 });
  try {
    return Response.json({ slots: await availableSlots() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("booking:", error);
    return Response.json({ error: "unavailable" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!bookingConfigured) return Response.json({ error: "not-configured" }, { status: 503 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) return Response.json({ error: "rate-limited" }, { status: 429 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const str = (key: string, max: number) => {
    const value = body?.[key];
    return typeof value === "string" ? value.trim().slice(0, max) : "";
  };
  // `website` is a honeypot field humans never see.
  if (str("website", 100)) return Response.json({ ok: true, meetUrl: null });

  const req = {
    start: str("start", 40),
    name: str("name", 80),
    email: str("email", 120),
    company: str("company", 80) || undefined,
    note: str("note", 800) || undefined,
  };
  if (!req.start || !req.name || !EMAIL.test(req.email)) return Response.json({ error: "bad-request" }, { status: 400 });

  try {
    const result = await createBooking(req);
    if (!result.ok) return Response.json({ error: result.reason }, { status: 409 });
    return Response.json(result);
  } catch (error) {
    console.error("booking:", error);
    return Response.json({ error: "unavailable" }, { status: 502 });
  }
}
