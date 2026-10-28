// Visitor analytics on a tiny key-value store.
//
// Two tiers:
// - Everyone, anonymously: a daily hashed id (IP + browser + a salt that
//   rotates every day, never stored raw) counts unique visitors and countries.
//   This is the cookieless model Plausible and Vercel Analytics use.
// - Visitors who opt in: city, region, network organisation (often the
//   company), page and referrer. If they later book a call, the name they
//   typed is attached to their visits.
//
// Storage is Upstash Redis over REST in production (free via the Vercel
// Marketplace), or an in-memory stand-in during local development.

import { createHash } from "node:crypto";

type Cmd = (string | number)[];

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const storeConfigured = Boolean(url && token);

async function upstash(cmds: Cmd[]): Promise<unknown[]> {
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  return ((await res.json()) as { result: unknown }[]).map((r) => r.result);
}

// Just enough Redis for local development. Kept on globalThis so route
// handlers and pages share it in the dev server.
type Mem = {
  sets: Map<string, Set<string>>;
  zsets: Map<string, Map<string, number>>;
  hashes: Map<string, Map<string, string>>;
  lists: Map<string, string[]>;
  strings?: Map<string, string>;
};
const g = globalThis as typeof globalThis & { __leoAnalytics?: Mem };
const mem: Mem = (g.__leoAnalytics ??= { sets: new Map(), zsets: new Map(), hashes: new Map(), lists: new Map() });
function memory(cmds: Cmd[]): unknown[] {
  return cmds.map(([op, key, ...args]) => {
    const k = String(key);
    switch (op) {
      case "PFADD": {
        const set = mem.sets.get(k) ?? new Set();
        const before = set.size;
        args.forEach((a) => set.add(String(a)));
        mem.sets.set(k, set);
        return set.size > before ? 1 : 0;
      }
      case "PFCOUNT":
        return mem.sets.get(k)?.size ?? 0;
      case "ZINCRBY": {
        const z = mem.zsets.get(k) ?? new Map();
        z.set(String(args[1]), (z.get(String(args[1])) ?? 0) + Number(args[0]));
        mem.zsets.set(k, z);
        return null;
      }
      case "ZRANGE": {
        // Always newest/highest first, like the REV queries this file makes.
        const entries = [...(mem.zsets.get(k) ?? new Map()).entries()].sort((a, b) => b[1] - a[1]);
        const slice = entries.slice(0, Number(args[1]) + 1);
        return args.includes("WITHSCORES") ? slice.flatMap(([m, s]) => [m, String(s)]) : slice.map(([m]) => m);
      }
      case "HINCRBY": {
        const h = mem.hashes.get(k) ?? new Map();
        h.set(String(args[0]), String(Number(h.get(String(args[0])) ?? 0) + Number(args[1])));
        mem.hashes.set(k, h);
        return null;
      }
      case "HSET": {
        const h = mem.hashes.get(k) ?? new Map();
        for (let i = 0; i < args.length; i += 2) h.set(String(args[i]), String(args[i + 1]));
        mem.hashes.set(k, h);
        return null;
      }
      case "HGETALL":
        return [...(mem.hashes.get(k) ?? new Map()).entries()].flat();
      case "LPUSH": {
        const l = mem.lists.get(k) ?? [];
        l.unshift(...args.map(String));
        mem.lists.set(k, l);
        return l.length;
      }
      case "LTRIM": {
        mem.lists.set(k, (mem.lists.get(k) ?? []).slice(Number(args[0]), Number(args[1]) + 1));
        return "OK";
      }
      case "LRANGE":
        return (mem.lists.get(k) ?? []).slice(Number(args[0]), Number(args[1]) + 1);
      case "EXPIRE":
        return 1;
      case "ZADD": {
        const z = mem.zsets.get(k) ?? new Map();
        z.set(String(args[1]), Number(args[0]));
        mem.zsets.set(k, z);
        return 1;
      }
      case "ZREMRANGEBYRANK": {
        // Only used to drop the oldest entries, keeping the newest N.
        const z = mem.zsets.get(k) ?? new Map();
        const keep = -Number(args[1]) - 1;
        const sorted = [...z.entries()].sort((a, b) => b[1] - a[1]).slice(0, keep);
        mem.zsets.set(k, new Map(sorted));
        return 0;
      }
      case "SET": {
        (mem.strings ??= new Map()).set(k, String(args[0]));
        return "OK";
      }
      case "GET":
        return mem.strings?.get(k) ?? null;
      case "MGET":
        return [k, ...args].map((key) => mem.strings?.get(String(key)) ?? null);
      default:
        throw new Error(`memory store: ${op} not supported`);
    }
  });
}

const run = (cmds: Cmd[]) => (storeConfigured ? upstash(cmds) : Promise.resolve(memory(cmds)));

const day = (d = new Date()) => d.toISOString().slice(0, 10);

// Rotates daily, so yesterday's ids can't be linked to today's.
export function anonymousId(ip: string, userAgent: string) {
  const salt = `${process.env.ANALYTICS_SALT ?? "leo-portfolio"}:${day()}`;
  return createHash("sha256").update(`${salt}|${ip}|${userAgent}`).digest("hex").slice(0, 24);
}

export type Visit = {
  ts: number;
  visitorId: string;
  path: string;
  referrer: string;
  city: string;
  region: string;
  country: string;
  org: string;
  device: string;
};

export async function recordVisit({
  anonId,
  country,
  consented,
}: {
  anonId: string;
  country: string;
  consented?: Omit<Visit, "ts" | "country">;
}) {
  const today = day();
  const [, newToday] = await run([
    ["PFADD", "uv:all", anonId],
    ["PFADD", `uv:${today}`, anonId],
  ]);
  const cmds: Cmd[] = [["EXPIRE", `uv:${today}`, 60 * 60 * 24 * 40]];
  if (newToday === 1) {
    cmds.push(["HINCRBY", "uv:daily", today, 1], ["ZINCRBY", "geo:country", 1, country || "??"]);
    if (consented) cmds.push(["ZINCRBY", "geo:city", 1, `${consented.city || "Unknown"}, ${country || "??"}`]);
  }
  if (consented) {
    const visit: Visit = { ts: Date.now(), country, ...consented };
    cmds.push(["LPUSH", "visits", JSON.stringify(visit)], ["LTRIM", "visits", 0, 499]);
  }
  await run(cmds);
}

export async function linkIdentity(visitorId: string, who: { name: string; email: string; company?: string }) {
  await run([["HSET", `who:${visitorId}`, "name", who.name, "email", who.email, "company", who.company ?? ""]]);
}

const pairs = (flat: unknown) => {
  const list = (flat as string[]) ?? [];
  const out: [string, number][] = [];
  for (let i = 0; i < list.length; i += 2) out.push([list[i], Number(list[i + 1])]);
  return out;
};

export async function getStats() {
  const today = day();
  const [total, todayCount, daily, countries, cities, rawVisits] = await run([
    ["PFCOUNT", "uv:all"],
    ["PFCOUNT", `uv:${today}`],
    ["HGETALL", "uv:daily"],
    ["ZRANGE", "geo:country", 0, 9, "REV", "WITHSCORES"],
    ["ZRANGE", "geo:city", 0, 9, "REV", "WITHSCORES"],
    ["LRANGE", "visits", 0, 99],
  ]);
  const visits = ((rawVisits as string[]) ?? []).map((v) => JSON.parse(v) as Visit);
  const ids = [...new Set(visits.map((v) => v.visitorId))];
  const whoRaw = ids.length ? await run(ids.map((id) => ["HGETALL", `who:${id}`])) : [];
  const who = new Map(
    ids.map((id, i) => {
      const flat = (whoRaw[i] as string[]) ?? [];
      const h: Record<string, string> = {};
      for (let j = 0; j < flat.length; j += 2) h[flat[j]] = flat[j + 1];
      return [id, h.name ? h : null] as const;
    }),
  );

  const dailyMap = new Map(pairs(daily));
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = day(new Date(Date.now() - (13 - i) * 86400_000));
    return { day: d, visitors: dailyMap.get(d) ?? 0 };
  });

  return {
    total: Number(total ?? 0),
    today: Number(todayCount ?? 0),
    last14,
    countries: pairs(countries),
    cities: pairs(cities),
    visits: visits.map((v) => ({ ...v, who: who.get(v.visitorId) ?? null })),
    persistent: storeConfigured,
  };
}

// ── Chat transcripts ─────────────────────────────────────────────────────────
// Every conversation with the twin, so Leo can see what people ask and tune it.

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type ChatLog = {
  id: string;
  startedAt: number;
  updatedAt: number;
  visitorId: string | null;
  country: string;
  city: string;
  turns: ChatTurn[];
  failed?: boolean;
  // The visitor closed the page or navigated away mid-reply.
  aborted?: boolean;
};

const KEEP_CHATS = 500;
const CHAT_TTL = 60 * 60 * 24 * 180;

export async function saveChat(chat: Omit<ChatLog, "startedAt" | "updatedAt">) {
  const [existing] = await run([["GET", `chat:${chat.id}`]]);
  const startedAt = existing ? (JSON.parse(existing as string) as ChatLog).startedAt : Date.now();
  const log: ChatLog = { ...chat, startedAt, updatedAt: Date.now() };
  await run([
    ["SET", `chat:${chat.id}`, JSON.stringify(log), "EX", CHAT_TTL],
    ["ZADD", "chats", log.updatedAt, chat.id],
    ["ZREMRANGEBYRANK", "chats", 0, -(KEEP_CHATS + 1)],
  ]);
}

export async function getChats(limit = 100) {
  const [ids] = await run([["ZRANGE", "chats", 0, limit - 1, "REV"]]);
  const list = (ids as string[]) ?? [];
  if (!list.length) return [];
  const [raw] = await run([["MGET", ...list.map((id) => `chat:${id}`)]]);
  const chats = ((raw as (string | null)[]) ?? [])
    .filter((c): c is string => Boolean(c))
    .map((c) => JSON.parse(c) as ChatLog);

  const ids2 = [...new Set(chats.map((c) => c.visitorId).filter((v): v is string => Boolean(v)))];
  const whoRaw = ids2.length ? await run(ids2.map((id) => ["HGETALL", `who:${id}`])) : [];
  const who = new Map(
    ids2.map((id, i) => {
      const flat = (whoRaw[i] as string[]) ?? [];
      const h: Record<string, string> = {};
      for (let j = 0; j < flat.length; j += 2) h[flat[j]] = flat[j + 1];
      return [id, h.name ? { name: h.name, company: h.company ?? "" } : null] as const;
    }),
  );
  return chats.map((c) => ({ ...c, who: (c.visitorId && who.get(c.visitorId)) || null }));
}
