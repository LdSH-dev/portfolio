import { anonymousId, recordVisit } from "@/lib/analytics";

// Crawlers and audit tools (including the site's own PageSpeed test) aren't visitors.
const BOT = /bot|crawl|spider|slurp|lighthouse|pagespeed|headless|preview|monitor/i;
const ID = /^[a-f0-9-]{36}$/;

const header = (request: Request, name: string) => {
  const value = request.headers.get(name);
  return value ? decodeURIComponent(value) : "";
};

const device = (ua: string) => (/mobile|iphone|android/i.test(ua) ? "mobile" : /ipad|tablet/i.test(ua) ? "tablet" : "desktop");

// Network owner for the IP (e.g. "Google LLC" when someone browses from the
// office). Optional: needs a free ipinfo.io token.
async function networkOrg(ip: string) {
  const tokenValue = process.env.IPINFO_TOKEN;
  if (!tokenValue || !ip || ip === "local") return "";
  try {
    const res = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/org?token=${tokenValue}`, {
      signal: AbortSignal.timeout(1500),
    });
    // "AS15169 Google LLC" -> "Google LLC"
    return res.ok ? (await res.text()).trim().replace(/^AS\d+\s+/, "") : "";
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });
  // Local dev shares the production store: keep my own test visits out of it.
  if (process.env.NODE_ENV !== "production" && process.env.TRACK_IN_DEV !== "1") {
    return new Response(null, { status: 204 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const str = (key: string, max: number) => (typeof body?.[key] === "string" ? (body[key] as string).slice(0, max) : "");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const country = header(request, "x-vercel-ip-country") || (ip === "local" || ip === "::1" ? "BR" : "");
  const visitorId = str("visitorId", 36);
  const consented = body?.consent === true && ID.test(visitorId);

  try {
    await recordVisit({
      anonId: anonymousId(ip, ua),
      country,
      consented: consented
        ? {
            visitorId,
            path: str("path", 120) || "/",
            referrer: str("referrer", 200),
            city: header(request, "x-vercel-ip-city") || (ip === "local" || ip === "::1" ? "Localhost" : ""),
            region: header(request, "x-vercel-ip-country-region"),
            org: await networkOrg(ip),
            device: device(ua),
          }
        : undefined,
    });
  } catch (error) {
    console.error("track:", error);
  }
  return new Response(null, { status: 204 });
}
