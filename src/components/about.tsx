import Image from "next/image";
import { Reveal } from "@/components/motion-primitives";
import { NearView, Scribble } from "@/components/sketch";
import { profile } from "@/content/profile";

const specs = [
  ["name", profile.name],
  ["age", String(profile.age)],
  ["based", "Brazil"],
  ["hours", "US working hours"],
  ["stack", "React · Node · TypeScript"],
  ["off", "travel · football (Grêmio)"],
  ["fuel", "coffee, black"],
];

export function About() {
  return (
    <section id="about" className="scroll-mt-24 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 md:grid-cols-[1fr_340px]">
        <div>
          <Reveal>
            <p className="font-mono text-xs tracking-[0.18em] text-fg-faint uppercase">01 · About</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
              {profile.age} years old. Seven of them{" "}
              <span className="font-serif font-normal italic tracking-normal text-amber-gradient">in production.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 max-w-xl space-y-5 text-lg leading-relaxed text-fg-muted text-pretty">
            <p>
              I&apos;m Leo, a software engineer from Brazil. I shipped my first
              production code as a teenager and never really stopped.
            </p>
            <p>
              Freelancing taught me what no course does: clients on the other side of the world, deadlines that
              don&apos;t move, and nobody to hide behind when something breaks. So I learned to{" "}
              <span className="text-fg">own the whole thing</span>, from the first call to launch day and every day
              after.
            </p>
            <p>
              Since then I&apos;ve built a payment gateway that can&apos;t go down, AI that books medical appointments in
              three languages and a storefront that serves a million sessions a month. Different industries, one
              standard: <span className="font-serif text-xl text-amber italic">if it ships, it holds up.</span>
            </p>
            <p>
              Off the clock I&apos;m usually planning the next trip, or watching Grêmio, my football team. Ninety
              minutes of that has taught me more about staying calm under pressure than any on-call rotation.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <dl className="mt-10 grid max-w-xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line font-mono text-xs sm:grid-cols-2">
              {specs.map(([key, value]) => (
                <div key={key} className="flex items-baseline gap-3 bg-ink px-4 py-3">
                  <dt className="w-12 shrink-0 text-fg-faint">{key}</dt>
                  <dd className="text-fg">{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="relative mx-auto w-full max-w-[300px]">
          {/* A polaroid taped to the drawing board. */}
          <figure className="relative rotate-[3deg] rounded-sm bg-[#f3efe6] p-3 pb-14 shadow-[0_30px_60px_-15px_rgb(0_0_0/0.7)] transition-transform duration-500 hover:rotate-0">
            <span
              aria-hidden
              className="absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 -rotate-3 bg-amber-soft/50 backdrop-blur-[1px]"
            />
            <NearView className="aspect-square w-full bg-ink/10">
              <Image
                src="/leo.jpg"
                alt="Leonardo Hemming at a marina at night"
                width={640}
                height={641}
                sizes="300px"
                className="aspect-square w-full object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-3 text-center font-hand text-2xl text-ink/80">
                me, somewhere new
              </figcaption>
            </NearView>
          </figure>
          <Scribble arrow="up" tilt={-4} delay={0.5} className="mt-2 flex flex-col-reverse items-center">
            the human behind the twin
          </Scribble>
        </Reveal>
      </div>
    </section>
  );
}
