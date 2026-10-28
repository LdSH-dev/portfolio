import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { getChats, getStats, storeConfigured } from "@/lib/analytics";
import { Chats } from "./chats";
import { flag, when } from "./format";

export const metadata: Metadata = {
  title: "Stats",
  robots: { index: false, follow: false },
};

// Private dashboard: /stats?key=<STATS_KEY>. The proxy 404s anything else.
export default function StatsPage({ searchParams }: PageProps<"/stats">) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <Suspense fallback={<p className="font-mono text-xs text-fg-faint">loading…</p>}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/stats">["searchParams"] }) {
  // The key itself is checked in src/proxy.ts; reading searchParams keeps this
  // render per request.
  const { key, tab, chat } = await searchParams;
  await connection();
  const onChats = tab === "chats";
  const href = (params: Record<string, string>) => `/stats?${new URLSearchParams({ key: String(key), ...params })}`;

  return (
    <>
      <p className="font-mono text-xs tracking-[0.18em] text-fg-faint uppercase">Private · visitors</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">
        {onChats ? "What they're " : "Who's been "}
        <span className="font-serif font-normal italic tracking-normal text-amber-gradient">
          {onChats ? "asking." : "looking."}
        </span>
      </h1>
      {!storeConfigured && (
        <p className="mt-3 font-mono text-[11px] text-amber">
          in-memory store: data resets on restart. Connect Upstash Redis to keep it.
        </p>
      )}
      <nav className="mt-8 flex w-fit gap-1 rounded-full border border-line-strong p-1 text-sm">
        {[
          ["Overview", href({}), !onChats],
          ["Chats", href({ tab: "chats" }), onChats],
        ].map(([label, to, active]) => (
          <Link
            key={label as string}
            href={to as string}
            className={`rounded-full px-4 py-1.5 transition-colors ${active ? "bg-fg text-ink" : "text-fg-muted hover:text-fg"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {onChats ? (
        <Chats chats={await getChats()} selected={typeof chat === "string" ? chat : undefined} href={href} />
      ) : (
        <Overview stats={await getStats()} />
      )}
    </>
  );
}

function Overview({ stats }: { stats: Awaited<ReturnType<typeof getStats>> }) {
  const peak = Math.max(1, ...stats.last14.map((d) => d.visitors));

  return (
    <>
      <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        {[
          ["unique visitors", stats.total],
          ["today", stats.today],
          ["named visitors", stats.visits.filter((v) => v.who).length],
        ].map(([label, value]) => (
          <div key={label} className="bg-ink-raised p-6">
            <dt className="font-mono text-[11px] text-fg-faint">{label}</dt>
            <dd className="mt-2 text-4xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-8 rounded-2xl border border-line bg-ink-raised/40 p-6">
        <p className="font-mono text-[11px] text-fg-faint">unique visitors · last 14 days</p>
        <div className="mt-4 flex h-32 items-end gap-1.5">
          {stats.last14.map((d) => (
            <div key={d.day} className="group relative flex flex-1 flex-col items-center justify-end">
              <span className="mb-1 font-mono text-[10px] text-fg-muted opacity-0 group-hover:opacity-100">{d.visitors}</span>
              <span
                className="w-full rounded-t bg-gradient-to-t from-amber-deep to-amber-soft"
                style={{ height: `${Math.max(2, (d.visitors / peak) * 100)}%`, opacity: d.visitors ? 1 : 0.2 }}
              />
              <span className="mt-1 font-mono text-[9px] text-fg-faint">{d.day.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {[
          ["countries", stats.countries, (k: string) => `${flag(k)}  ${k}`],
          ["cities (opted in)", stats.cities, (k: string) => k],
        ].map(([title, rows, fmt]) => (
          <section key={title as string} className="rounded-2xl border border-line bg-ink-raised/40 p-6">
            <p className="font-mono text-[11px] text-fg-faint">{title as string}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {(rows as [string, number][]).length === 0 && <li className="text-fg-faint">nothing yet</li>}
              {(rows as [string, number][]).map(([k, n]) => (
                <li key={k} className="flex justify-between gap-4">
                  <span>{(fmt as (k: string) => string)(k)}</span>
                  <span className="font-mono text-fg-muted tabular-nums">{n}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-8 overflow-x-auto rounded-2xl border border-line bg-ink-raised/40 p-6">
        <p className="font-mono text-[11px] text-fg-faint">recent visits (opted in) · times in Brasília</p>
        <table className="mt-4 w-full min-w-[720px] text-left text-sm">
          <thead className="font-mono text-[11px] text-fg-faint">
            <tr>
              {["when", "who", "where", "network", "device", "from"].map((h) => (
                <th key={h} className="pb-2 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {stats.visits.length === 0 && (
              <tr>
                <td colSpan={6} className="py-3 text-fg-faint">
                  nobody has opted in yet
                </td>
              </tr>
            )}
            {stats.visits.map((v) => (
              <tr key={`${v.visitorId}-${v.ts}`}>
                <td className="py-2.5 pr-4 font-mono text-xs whitespace-nowrap text-fg-muted">{when(v.ts)}</td>
                <td className="py-2.5 pr-4">
                  {v.who ? (
                    <span className="text-amber">
                      {v.who.name}
                      {v.who.company ? <span className="text-fg-muted"> · {v.who.company}</span> : null}
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-fg-faint">{v.visitorId.slice(0, 8)}</span>
                  )}
                </td>
                <td className="py-2.5 pr-4 whitespace-nowrap">
                  {flag(v.country)} {[v.city, v.region].filter(Boolean).join(", ") || "unknown"}
                </td>
                <td className="py-2.5 pr-4 text-fg-muted">{v.org || "·"}</td>
                <td className="py-2.5 pr-4 font-mono text-xs text-fg-muted">{v.device}</td>
                <td className="py-2.5 font-mono text-xs text-fg-muted">{v.referrer || "direct"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
