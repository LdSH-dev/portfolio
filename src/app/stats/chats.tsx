import Link from "next/link";
import type { getChats } from "@/lib/analytics";
import { suggestions } from "@/content/profile";
import { flag, when } from "./format";

type Chat = Awaited<ReturnType<typeof getChats>>[number];

const normalize = (q: string) => q.trim().toLowerCase().replace(/[?!.]+$/, "");
const chips = new Set(suggestions.map(normalize));

const duration = (chat: Chat) => {
  const minutes = Math.round((chat.updatedAt - chat.startedAt) / 60000);
  return minutes < 1 ? "under a minute" : `${minutes} min`;
};

// Every conversation with the twin, rebuilt as it happened.
export function Chats({
  chats,
  selected,
  href,
}: {
  chats: Chat[];
  selected?: string;
  href: (params: Record<string, string>) => string;
}) {
  if (chats.length === 0) {
    return <p className="mt-10 text-fg-muted">No conversations yet. They&apos;ll show up here as soon as someone asks the twin something.</p>;
  }

  const questions = chats.flatMap((c) => c.turns.filter((t) => t.role === "user").map((t) => t.content));
  const fromChips = chats.filter((c) => chips.has(normalize(c.turns[0]?.content ?? ""))).length;
  const named = chats.filter((c) => c.who).length;

  // Questions people typed themselves are the best signal for what's missing.
  const typed = new Map<string, number>();
  for (const q of questions) if (!chips.has(normalize(q))) typed.set(q.trim(), (typed.get(q.trim()) ?? 0) + 1);
  const chipCounts = suggestions.map((s) => [s, questions.filter((q) => normalize(q) === normalize(s)).length] as const);

  const current = chats.find((c) => c.id === selected) ?? chats[0];

  return (
    <>
      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
        {[
          ["conversations", chats.length],
          ["questions asked", questions.length],
          ["started from a chip", `${Math.round((fromChips / chats.length) * 100)}%`],
          ["by named visitors", named],
        ].map(([label, value]) => (
          <div key={label} className="bg-ink-raised p-6">
            <dt className="font-mono text-[11px] text-fg-faint">{label}</dt>
            <dd className="mt-2 text-3xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-ink-raised/40 p-6">
          <p className="font-mono text-[11px] text-fg-faint">suggested questions · times asked</p>
          <ul className="mt-4 space-y-2 text-sm">
            {chipCounts.map(([q, n]) => (
              <li key={q} className="flex justify-between gap-4">
                <span className="text-fg-muted">{q}</span>
                <span className="font-mono tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-line bg-ink-raised/40 p-6">
          <p className="font-mono text-[11px] text-fg-faint">typed by visitors · newest first</p>
          <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-2 text-sm">
            {typed.size === 0 && <li className="text-fg-faint">only chip questions so far</li>}
            {[...typed.entries()].slice(0, 30).map(([q, n]) => (
              <li key={q} className="flex justify-between gap-4">
                <span className="text-fg">&ldquo;{q}&rdquo;</span>
                {n > 1 && <span className="font-mono text-amber tabular-nums">×{n}</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid overflow-hidden rounded-2xl border border-line md:grid-cols-[320px_minmax(0,1fr)]">
        <ol className="max-h-[640px] divide-y divide-line overflow-y-auto border-b border-line bg-ink-raised/40 md:border-r md:border-b-0">
          {chats.map((c) => {
            const active = c.id === current.id;
            const userTurns = c.turns.filter((t) => t.role === "user").length;
            return (
              <li key={c.id}>
                <Link
                  href={href({ tab: "chats", chat: c.id })}
                  scroll={false}
                  className={`block px-4 py-3 transition-colors ${active ? "bg-amber/10" : "hover:bg-white/[0.03]"}`}
                >
                  <span className="flex items-center justify-between gap-2 font-mono text-[10px] text-fg-faint">
                    <span>
                      {flag(c.country)} {when(c.updatedAt)}
                    </span>
                    <span>
                      {userTurns} {userTurns === 1 ? "question" : "questions"}
                    </span>
                  </span>
                  <span className={`mt-1 line-clamp-2 block text-sm ${active ? "text-fg" : "text-fg-muted"}`}>
                    {c.turns[0]?.content}
                  </span>
                  {(c.who || c.failed || c.aborted) && (
                    <span className="mt-1.5 flex gap-1.5 font-mono text-[10px]">
                      {c.who && <span className="rounded bg-amber/15 px-1.5 py-0.5 text-amber">{c.who.name}</span>}
                      {c.failed && <span className="rounded bg-red-400/15 px-1.5 py-0.5 text-red-300">error</span>}
                      {c.aborted && <span className="rounded bg-white/5 px-1.5 py-0.5 text-fg-faint">left mid-reply</span>}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>

        <section className="flex max-h-[640px] flex-col bg-ink-raised">
          <header className="border-b border-line px-6 py-4 font-mono text-[11px] text-fg-faint">
            <span className="text-fg">
              {current.who ? `${current.who.name}${current.who.company ? ` · ${current.who.company}` : ""}` : "anonymous visitor"}
            </span>
            {" · "}
            {flag(current.country)} {[current.city, current.country].filter(Boolean).join(", ") || "unknown"}
            {" · "}started {when(current.startedAt)} · {duration(current)}
          </header>
          <ol className="flex flex-1 flex-col gap-3 overflow-y-auto p-6">
            {current.turns.map((t, i) => (
              <li key={i} className={t.role === "user" ? "self-end" : "self-start"}>
                <p
                  className={
                    t.role === "user"
                      ? "max-w-md rounded-2xl rounded-br-md bg-amber/90 px-4 py-2.5 text-sm text-ink"
                      : "max-w-md rounded-2xl rounded-bl-md border border-line bg-ink-overlay px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-fg"
                  }
                >
                  {t.content}
                </p>
              </li>
            ))}
            {current.failed && (
              <li className="self-center font-mono text-[11px] text-red-300">the reply failed here (visitor saw the fallback)</li>
            )}
            {current.aborted && (
              <li className="self-center font-mono text-[11px] text-fg-faint">visitor left before the reply finished</li>
            )}
          </ol>
        </section>
      </div>
    </>
  );
}
