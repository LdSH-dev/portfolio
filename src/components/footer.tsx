import Link from "next/link";
import { BookCall } from "@/components/book-call";
import { Magnetic, Reveal } from "@/components/motion-primitives";
import { CoffeePlate, Signature } from "@/components/sketch";
import { profile } from "@/content/profile";

export function Footer() {
  return (
    <footer id="contact" className="scroll-mt-24 border-t border-line">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-[1fr_340px]">
        <div>
          <Reveal>
            <p className="font-mono text-xs tracking-[0.18em] text-fg-faint uppercase">06 — Contact</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-balance md:text-6xl">
              Hiring for React or Node?{" "}
              <span className="font-serif font-normal italic tracking-normal text-amber-gradient">Let&apos;s talk.</span>
            </h2>
            <p className="mt-4 max-w-lg text-fg-muted">
              Grab 30 minutes on my calendar. I&apos;m in Brazil and work US hours.
            </p>
          </Reveal>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Magnetic>
              <BookCall className="block rounded-full bg-gradient-to-r from-amber-soft via-amber to-amber-deep px-6 py-3 text-sm font-semibold text-ink">
                Book a 30-min call
              </BookCall>
            </Magnetic>
            <a
              href={`mailto:${profile.email}`}
              className="rounded-full border border-line-strong px-6 py-3 text-sm font-medium transition-colors hover:bg-white/5"
            >
              {profile.email}
            </a>
            <a
              href={profile.links.linkedin}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line-strong px-6 py-3 text-sm font-medium transition-colors hover:bg-white/5"
            >
              LinkedIn ↗
            </a>
            <a
              href={profile.links.github}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line-strong px-6 py-3 text-sm font-medium transition-colors hover:bg-white/5"
            >
              GitHub ↗
            </a>
          </div>
          <div className="mt-16 flex items-end gap-4">
            <p className="max-w-xs font-hand text-2xl leading-tight text-fg-muted">
              Thanks for scrolling all the way down. Talk soon,
            </p>
            <Signature className="h-16 w-52 shrink-0" />
          </div>
          <p className="mt-10 font-mono text-[11px] text-fg-faint">
            {profile.name} · Built with Next.js, deployed on Vercel ·{" "}
            <Link href="/privacy" className="hover:text-fg">
              Privacy
            </Link>
          </p>
        </div>
        <CoffeePlate className="mx-auto w-full max-w-[340px]" />
      </div>
    </footer>
  );
}
