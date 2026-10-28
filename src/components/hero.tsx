import { BookCall } from "@/components/book-call";
import { Globe } from "@/components/globe";
import { Magnetic, Reveal, SplitReveal } from "@/components/motion-primitives";
import { Scribble, Seal } from "@/components/sketch";
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
          <p className="font-mono text-xs tracking-[0.18em] text-fg-faint uppercase">
            {profile.name} — {profile.role}
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
          <Reveal delay={0.55}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-fg-muted text-pretty">
              {profile.yearsOfExperience} years shipping payments, AI and high-traffic products for teams in the US
              and Europe. Don&apos;t take my word for it — ask my digital twin.
            </p>
          </Reveal>
          <Reveal delay={0.7} className="mt-9 flex flex-wrap items-center gap-3">
            <Magnetic>
              <a
                href="#ask"
                className="block rounded-full bg-gradient-to-r from-amber-soft via-amber to-amber-deep px-6 py-3 text-sm font-semibold text-ink"
              >
                Ask my digital twin
              </a>
            </Magnetic>
            <BookCall className="rounded-full border border-line-strong px-6 py-3 text-sm font-medium text-fg transition-colors hover:bg-white/5">
              Book a call
            </BookCall>
          </Reveal>
        </div>

        <div data-cursor="drag" className="relative aspect-square w-full">
          <Globe />
          <Seal className="absolute top-[2%] right-[2%] size-24 md:size-28" />
          <Scribble arrow="right" row delay={1.4} className="absolute bottom-[19%] left-[4%] max-md:hidden" arrowClassName="mt-3 w-24">
            home base, on US hours
          </Scribble>
          {/* Draftsman annotations, in the spirit of a blueprint. */}
          <dl className="pointer-events-none absolute top-[6%] left-0 space-y-1 font-mono text-[10px] leading-tight text-fg-faint">
            <div>
              <dt className="inline">lat </dt>
              <dd className="inline text-fg-muted">{profile.coordinates.lat.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="inline">lng </dt>
              <dd className="inline text-fg-muted">{profile.coordinates.lng.toFixed(2)}</dd>
            </div>
          </dl>
          <p className="pointer-events-none absolute right-0 bottom-[6%] text-right font-mono text-[10px] leading-relaxed text-fg-faint">
            origin: porto alegre, br
            <br />
            routes: poa → mia · nyc · sfo
            <br />
            build: <span className="text-fg-muted">{build}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
