import { Reveal, Spotlight } from "@/components/motion-primitives";
import { profile } from "@/content/profile";
import { getGitHubSnapshot } from "@/lib/github";

const levelClass = [
  "bg-white/[0.05]",
  "bg-amber/25",
  "bg-amber/45",
  "bg-amber/70",
  "bg-amber",
] as const;

const languageColor: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572a5",
  Vue: "#41b883",
};

const monthYear = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

// On small screens only the most recent half-year fits.
const MOBILE_WEEKS = 26;

export async function GitHubActivity() {
  const data = await getGitHubSnapshot();
  if (!data) return null;

  const { weeks, total, activeDays, repos } = data;

  return (
    <section id="github" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-fg-faint uppercase">04 — Code</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
              Still writing code{" "}
              <span className="font-serif font-normal italic tracking-normal text-amber-gradient">for fun.</span>
            </h2>
          </div>
          <a
            href={profile.links.github}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
          >
            github.com/{profile.links.github.split("/").pop()} ↗
          </a>
        </Reveal>

        <Reveal delay={0.1} className="mt-12 rounded-2xl border border-line-strong bg-ink-raised/40 p-6 md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4 font-mono text-xs text-fg-faint">
            <p>
              <span className="text-2xl font-semibold tracking-[-0.02em] text-fg tabular-nums">{total}</span>{" "}
              contributions in the last year ·{" "}
              <span className="text-fg-muted tabular-nums">{activeDays}</span> active days
            </p>
            <p className="flex items-center gap-1.5" aria-hidden>
              less
              {levelClass.map((c) => (
                <span key={c} className={`size-2.5 rounded-[2px] ${c}`} />
              ))}
              more
            </p>
          </div>

          <div
            role="img"
            aria-label={`GitHub contribution calendar: ${total} contributions across ${activeDays} active days in the last year`}
            className="mt-6 flex justify-end gap-[3px]"
          >
            {weeks.map((week, w) => (
              <div
                key={week[0]?.date ?? w}
                className={`flex flex-1 flex-col gap-[3px] ${w < weeks.length - MOBILE_WEEKS ? "max-md:hidden" : ""}`}
              >
                {week.map((day) => (
                  <span
                    key={day.date}
                    title={day.date}
                    className={`aspect-square w-full max-w-3.5 rounded-[2px] ${levelClass[day.level]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </Reveal>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {repos.map((repo, i) => (
            <li key={repo.name}>
              <Reveal delay={0.15 + i * 0.06} className="h-full">
                <Spotlight className="h-full rounded-2xl border border-line bg-ink transition-colors hover:border-line-strong">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative flex h-full flex-col p-5"
                  >
                    <span className="font-mono text-sm text-fg">
                      <span className="text-fg-faint">{profile.links.github.split("/").pop()}/</span>
                      {repo.name}
                    </span>
                    <span className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-fg-muted">
                      {repo.description ?? "No description yet."}
                    </span>
                    <span className="mt-4 flex items-center gap-3 font-mono text-[11px] text-fg-faint">
                      {repo.language && (
                        <span className="flex items-center gap-1.5">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: languageColor[repo.language] ?? "#8b94a3" }}
                          />
                          {repo.language}
                        </span>
                      )}
                      <span>★ {repo.stars}</span>
                      <span className="ml-auto">{monthYear.format(new Date(repo.pushedAt))}</span>
                    </span>
                  </a>
                </Spotlight>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
