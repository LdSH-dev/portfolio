"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

// `short` keeps the links on one line on small phones; `wide` links only
// show from the sm breakpoint up.
const links = [
  { href: "#about", label: "About", short: "About" },
  { href: "#ask", label: "Ask Leo", short: "Ask" },
  { href: "#experience", label: "Experience", short: "Career" },
  { href: "#testimonials", label: "Reviews", short: "Reviews" },
  { href: "#github", label: "Code", short: "Code", wide: true },
  { href: "#performance", label: "Performance", short: "Speed", wide: true },
  { href: "#contact", label: "Contact", short: "Contact" },
];

export function Nav() {
  const [active, setActive] = useState<string | null>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  // Highlight whichever section crosses the middle of the viewport.
  useEffect(() => {
    const sections = links
      .map((l) => document.querySelector(l.href))
      .filter((el): el is Element => el !== null);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    // Sections without a nav entry clear the highlight.
    const unlisted = ["#top"].map((sel) => document.querySelector(sel));
    const topIo = new IntersectionObserver(([e]) => e.isIntersecting && setActive(null), {
      rootMargin: "-45% 0px -50% 0px",
    });
    unlisted.forEach((el) => el && topIo.observe(el));
    return () => {
      io.disconnect();
      topIo.disconnect();
    };
  }, []);

  // Scroll readout, written straight to the DOM to avoid re-rendering on scroll.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max > 0 ? window.scrollY / max : 0;
      if (progressRef.current) progressRef.current.textContent = value.toFixed(2);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-5 z-50 flex justify-center px-3">
      <nav
        aria-label="Primary"
        className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-line-strong bg-ink-raised/70 p-1.5 shadow-[0_8px_30px_rgb(0_0_0/0.35)] backdrop-blur-md [scrollbar-width:none] sm:gap-1"
      >
        <a
          href="#top"
          aria-label="Leonardo Hemming, home"
          className="mr-1 hidden size-8 place-items-center rounded-full font-serif text-lg italic text-amber-gradient sm:grid"
        >
          LH
        </a>
        <span aria-hidden className="mr-1 hidden h-5 w-px bg-line-strong sm:block" />
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            aria-current={active === link.href ? "true" : undefined}
            className={`relative shrink-0 rounded-full px-2.5 py-1.5 text-sm font-medium whitespace-nowrap text-fg-muted transition-colors hover:text-fg aria-[current]:text-fg sm:px-3.5 ${"wide" in link ? "max-sm:hidden" : ""}`}
          >
            {active === link.href && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-full bg-white/[0.07]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative sm:hidden">{link.short}</span>
            <span className="relative max-sm:hidden">{link.label}</span>
          </a>
        ))}
        <span aria-hidden className="mx-1 hidden h-5 w-px bg-line-strong sm:block" />
        <span aria-hidden className="hidden pr-3 pl-1 font-mono text-[11px] text-fg-faint tabular-nums sm:block">
          <span ref={progressRef}>0.00</span>
        </span>
      </nav>
    </header>
  );
}
