import { cacheLife } from "next/cache";

export type Strategy = "mobile" | "desktop";

export type PageSpeedResult = {
  strategy: Strategy;
  url: string;
  fetchedAt: string;
  reportUrl: string;
  scores: { id: string; label: string; value: number }[];
  metrics: { id: string; label: string; display: string; score: number }[];
};

const CATEGORIES = [
  { id: "performance", label: "Performance" },
  { id: "accessibility", label: "Accessibility" },
  { id: "best-practices", label: "Best practices" },
  { id: "seo", label: "SEO" },
] as const;

const METRICS = [
  { id: "first-contentful-paint", label: "First Contentful Paint" },
  { id: "largest-contentful-paint", label: "Largest Contentful Paint" },
  { id: "total-blocking-time", label: "Total Blocking Time" },
  { id: "cumulative-layout-shift", label: "Cumulative Layout Shift" },
  { id: "speed-index", label: "Speed Index" },
] as const;

type LighthouseResponse = {
  lighthouseResult: {
    fetchTime: string;
    categories: Record<string, { score: number | null }>;
    audits: Record<string, { displayValue?: string; score: number | null }>;
  };
};

// Runs Google's PageSpeed Insights (Lighthouse in Google's cloud) against the
// given URL. Cached for a minute or so: a visitor gets a genuinely fresh run,
// but a burst of clicks can't burn through the API quota.
export async function runPageSpeed(url: string, strategy: Strategy): Promise<PageSpeedResult> {
  "use cache";
  cacheLife("minutes");

  const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  api.searchParams.set("url", url);
  api.searchParams.set("strategy", strategy);
  for (const c of CATEGORIES) api.searchParams.append("category", c.id);
  if (process.env.PSI_API_KEY) api.searchParams.set("key", process.env.PSI_API_KEY);

  const res = await fetch(api, { signal: AbortSignal.timeout(90_000) });
  if (!res.ok) throw new Error(`PageSpeed Insights responded ${res.status}`);
  const { lighthouseResult: lh } = (await res.json()) as LighthouseResponse;

  return {
    strategy,
    url,
    fetchedAt: lh.fetchTime,
    reportUrl: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(url)}&form_factor=${strategy}`,
    scores: CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      value: Math.round((lh.categories[c.id]?.score ?? 0) * 100),
    })),
    metrics: METRICS.map((m) => ({
      id: m.id,
      label: m.label,
      display: lh.audits[m.id]?.displayValue ?? "—",
      score: lh.audits[m.id]?.score ?? 0,
    })),
  };
}
