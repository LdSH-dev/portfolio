"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// A light mode switch that refuses to switch. Every attempt flashes the
// screen, drops a pair of shades in and gets a slightly more tired reply.
const replies = [
  ["Whoa. Light mode?", "Request denied, for the sake of your retinas."],
  ["Still no.", "I asked the designer. He said no too. (It's me. I'm the designer.)"],
  ["Okay, you're persistent.", "I respect that. It's what I look for in a teammate. Still no."],
  ["Fine. Here's a compromise:", "close your eyes and imagine it's white. Beautiful, right?"],
  ["Error 418: I'm a teapot.", "Teapots don't do light mode either."],
  ["You've clicked this a lot.", "Imagine what we could build with that energy. Book a call?"],
];

export function ThemeToggle() {
  const reduced = useReducedMotion();
  const [attempt, setAttempt] = useState(0);
  const [showing, setShowing] = useState(false);
  const [lit, setLit] = useState(false);
  const hideTimer = useRef(0);

  const tryLight = () => {
    clearTimeout(hideTimer.current);
    setAttempt((a) => a + 1);
    setLit(true);
    setShowing(true);
    // The knob gets to the sun for a beat, then springs back to the moon.
    setTimeout(() => setLit(false), 650);
    hideTimer.current = window.setTimeout(() => setShowing(false), 4200);
  };

  const [title, body] = replies[Math.max(0, attempt - 1) % replies.length];

  return (
    <>
      <div className="fixed right-4 bottom-4 z-50 md:top-6 md:right-6 md:bottom-auto">
        <button
          type="button"
          onClick={tryLight}
          aria-label="Switch to light mode"
          aria-pressed={false}
          className="relative flex h-9 w-[4.25rem] items-center rounded-full border border-line-strong bg-ink-raised/80 px-1 shadow-[0_8px_30px_rgb(0_0_0/0.35)] backdrop-blur-md"
        >
          <span aria-hidden className="absolute left-2.5 text-[13px] text-fg-faint">☀</span>
          <span aria-hidden className="absolute right-2.5 text-[12px] text-fg-faint">☾</span>
          <motion.span
            aria-hidden
            className="relative z-10 grid size-7 place-items-center rounded-full bg-gradient-to-br from-amber-soft to-amber-deep text-[13px] text-ink"
            animate={{ x: lit ? 0 : 30, rotate: lit ? -180 : 0 }}
            transition={{ type: "spring", stiffness: 420, damping: lit ? 30 : 11 }}
          >
            {lit ? "☀" : "☾"}
          </motion.span>
        </button>
      </div>

      <AnimatePresence>
        {showing && !reduced && (
          <motion.div
            key={`flash-${attempt}`}
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[70] bg-[#fffaf0]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.92, 0] }}
            transition={{ duration: 0.75, times: [0, 0.18, 1], ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showing && (
          <motion.div
            key={`toast-${attempt}`}
            role="status"
            className="fixed inset-x-4 top-20 z-[71] mx-auto max-w-sm md:top-20 md:right-6 md:left-auto md:mx-0"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 26, delay: reduced ? 0 : 0.25 }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-line-strong bg-ink-raised/95 p-4 pl-20 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] backdrop-blur-md">
              {/* Shades drop in and settle with a wobble. */}
              <motion.svg
                viewBox="0 0 64 28"
                aria-hidden
                className="absolute top-1/2 left-3 w-14 -translate-y-1/2 text-fg"
                initial={reduced ? false : { y: -60, rotate: -25 }}
                animate={{ y: 0, rotate: [0, 8, -5, 2, 0] }}
                transition={{ y: { type: "spring", stiffness: 300, damping: 14, delay: 0.35 }, rotate: { duration: 0.9, delay: 0.5 } }}
              >
                <path d="M2 6 H62" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M4 6 C4 20, 10 24, 18 24 C26 24, 29 18, 29 6 Z" fill="currentColor" />
                <path d="M35 6 C35 18, 38 24, 46 24 C54 24, 60 20, 60 6 Z" fill="currentColor" />
                <path d="M29 9 C31 7, 33 7, 35 9" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M9 10 L15 10" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                <path d="M40 10 L46 10" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
              </motion.svg>
              <p className="font-semibold tracking-[-0.01em] text-fg">{title}</p>
              <p className="mt-1 text-sm leading-snug text-fg-muted">{body}</p>
              <p className="mt-2 font-mono text-[10px] text-fg-faint">attempt #{attempt} · dark mode is a lifestyle</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
