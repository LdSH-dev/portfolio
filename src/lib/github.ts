import { cacheLife } from "next/cache";
import { profile } from "@/content/profile";

const USER = profile.links.github.split("/").pop()!;

// Repos worth showing, in this order. Everything else (forks, old study
// projects) stays off the page.
const FEATURED = ["chatflow", "financeflow", "api-plans-stripe", "ledisa-quiz-funnel"];

export type ContributionDay = { date: string; level: 0 | 1 | 2 | 3 | 4 };
export type Repo = {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
  pushedAt: string;
};

export type GitHubSnapshot = {
  weeks: ContributionDay[][];
  total: number;
  activeDays: number;
  repos: Repo[];
};

// GitHub has no public JSON for the contribution calendar, so we read the same
// HTML fragment the profile page loads and pull the cells out of it.
async function getContributions() {
  const res = await fetch(`https://github.com/users/${USER}/contributions`, {
    headers: { "User-Agent": "leonardo-hemming-portfolio" },
  });
  if (!res.ok) throw new Error(`contributions: ${res.status}`);
  const html = await res.text();

  const cells = [...html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"[^>]*?id="([^"]+)"[^>]*?data-level="(\d)"/g)];
  const counts = new Map<string, number>();
  // Tooltips look like: <tool-tip for="contribution-day-component-0-0">3 contributions on …</tool-tip>
  for (const [, id, text] of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = /^(\d+)/.exec(text);
    counts.set(id, n ? Number(n[1]) : 0);
  }

  const days = cells
    .map(([, date, id, level]) => ({ date, level: Number(level) as ContributionDay["level"], count: counts.get(id) ?? 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group into Sunday-first weeks, like GitHub's own grid.
  const weeks: ContributionDay[][] = [];
  for (const day of days) {
    const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
    if (weekday === 0 || weeks.length === 0) weeks.push([]);
    weeks[weeks.length - 1].push({ date: day.date, level: day.level });
  }

  return {
    weeks,
    total: days.reduce((sum, d) => sum + d.count, 0),
    activeDays: days.filter((d) => d.level > 0).length,
  };
}

async function getRepos(): Promise<Repo[]> {
  const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100`, {
    headers: { "User-Agent": "leonardo-hemming-portfolio", Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`repos: ${res.status}`);
  const all = (await res.json()) as {
    name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    html_url: string;
    pushed_at: string;
    fork: boolean;
  }[];

  return FEATURED.flatMap((name) => {
    const r = all.find((repo) => repo.name === name && !repo.fork);
    return r
      ? [
          {
            name: r.name,
            description: r.description,
            language: r.language,
            stars: r.stargazers_count,
            url: r.html_url,
            pushedAt: r.pushed_at,
          },
        ]
      : [];
  });
}

// Cached for an hour so the page stays static-fast and we stay far below
// GitHub's unauthenticated rate limit. Returns null if GitHub is unreachable,
// and the section simply hides itself.
export async function getGitHubSnapshot(): Promise<GitHubSnapshot | null> {
  "use cache";
  cacheLife("hours");
  try {
    const [contributions, repos] = await Promise.all([getContributions(), getRepos()]);
    return { ...contributions, repos };
  } catch {
    return null;
  }
}
