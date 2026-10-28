import { Reveal, Spotlight } from "@/components/motion-primitives";
import { recommendationsUrl, testimonials } from "@/content/profile";

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");

export function Testimonials() {
  return (
    <section id="testimonials" className="scroll-mt-24 border-y border-line bg-ink-raised/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="font-mono text-xs tracking-[0.18em] text-fg-faint uppercase">03 — In their words</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
            Don&apos;t take{" "}
            <span className="font-serif font-normal italic tracking-normal text-amber-gradient">my word</span> for
            it.
          </h2>
        </Reveal>

        <ul className="mt-14 grid gap-5 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <li key={t.name}>
              <Reveal delay={i * 0.1} className="h-full">
                <Spotlight className="flex h-full flex-col overflow-hidden rounded-2xl border border-line-strong bg-ink p-8">
                  <span aria-hidden className="relative font-serif text-6xl leading-none text-amber/40">
                    &ldquo;
                  </span>
                  <blockquote className="relative mt-2 flex-1">
                    <p className="font-serif text-2xl leading-snug text-fg italic text-balance">{t.highlight}</p>
                    <p className="mt-5 text-sm leading-relaxed text-fg-muted">{t.quote}</p>
                  </blockquote>
                  <div className="relative mt-8 flex items-center gap-3 border-t border-line pt-6">
                    <span
                      aria-hidden
                      className="grid size-10 place-items-center rounded-full border border-amber/30 bg-amber/10 font-mono text-xs text-amber"
                    >
                      {initials(t.name)}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{t.name}</span>
                      <span className="block font-mono text-[11px] text-fg-faint">
                        {t.title} · {t.relation}
                      </span>
                    </span>
                  </div>
                </Spotlight>
              </Reveal>
            </li>
          ))}
        </ul>

        <p className="mt-8 font-mono text-[11px] text-fg-faint">
          Verbatim from{" "}
          <a
            href={recommendationsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-fg-muted underline decoration-line-strong underline-offset-4 hover:text-fg"
          >
            my LinkedIn recommendations ↗
          </a>
        </p>
      </div>
    </section>
  );
}
