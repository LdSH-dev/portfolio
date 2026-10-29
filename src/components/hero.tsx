import { BookCall } from "@/components/book-call";
import { Globe } from "@/components/globe";
import { Magnetic, SplitReveal } from "@/components/motion-primitives";
import { Scribble } from "@/components/sketch";
import { profile } from "@/content/profile";

const build = (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7);

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-16 md:pt-36">
      <div aria-hidden className="blueprint pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 right-[-10%] size-[640px] rounded-full bg-[radial-gradient(circle,rgb(240_180_92/0.10),transparent_65%)]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] whitespace-nowrap text-fg-muted uppercase">
            <span className="text-fg">{profile.name}</span>
            <span className="max-sm:hidden"> · {profile.role}</span> · {profile.languages}
          </p>
          <h1 className="mt-6 text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.035em] md:text-6xl">
            <SplitReveal
              words={[
                { text: "React" },
                { text: "&" },
                { text: "Node" },
                { text: "products" },
                { text: "that" },
                { text: "hold up", className: "font-serif font-normal italic tracking-[-0.01em] text-amber-gradient pr-1" },
                { text: "in" },
                { text: "production." },
              ]}
            />
          </h1>
          <div className="rise-soft" style={{ animationDelay: "0.3s" }}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-fg-muted text-pretty">
              {profile.yearsOfExperience} years shipping payments, AI and high-traffic products for teams in the US
              and Europe. Don&apos;t take my word for it, ask my digital twin.
            </p>
          </div>
          <div className="rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "0.45s" }}>
            <Magnetic>
              <a
                href="#ask"
                className="block rounded-full bg-gradient-to-r from-amber-soft via-amber to-amber-deep px-6 py-3 text-sm font-semibold text-on-amber"
              >
                Ask my digital twin
              </a>
            </Magnetic>
            <BookCall className="rounded-full border border-line-strong px-6 py-3 text-sm font-medium text-fg transition-colors hover:bg-white/5">
              Book a call
            </BookCall>
            <a
              href={profile.cv}
              download
              className="px-2 py-3 text-sm font-medium text-fg-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
            >
              Download CV ↓
            </a>
          </div>
        </div>

        <div data-cursor="drag" className="relative aspect-square w-full">
          <Globe />
          <Scribble arrow="right" row delay={1.4} className="absolute bottom-[26%] left-[6%] max-md:hidden" arrowClassName="mt-3 w-24">
            home base, on US hours
          </Scribble>
          {/* Draftsman annotations, in the spirit of a blueprint. */}
          <dl className="pointer-events-none absolute top-[6%] left-0 space-y-1 font-mono text-[10px] leading-tight text-fg-faint">
            <div>
              <dt className="inline">based </dt>
              <dd className="inline text-fg-muted">brazil</dd>
            </div>
            <div>
              <dt className="inline">hours </dt>
              <dd className="inline text-fg-muted">us, live</dd>
            </div>
          </dl>
          <p className="pointer-events-none absolute right-0 bottom-[6%] text-right font-mono text-[10px] leading-relaxed text-fg-faint">
            origin: brazil
            <br />
            routes: br → mia · nyc · sfo
            <br />
            build: <span className="text-fg-muted">{build}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
