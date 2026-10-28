"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

// Fades and lifts its children the first time they scroll into view.
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

// Each word slides up from behind a mask, staggered.
export function SplitReveal({ words, className }: { words: { text: string; className?: string }[]; className?: string }) {
  return (
    <span className={className}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span
              className={`inline-block ${word.className ?? ""}`}
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, ease, delay: 0.1 + i * 0.06 }}
            >
              {word.text}
            </motion.span>
          </span>
          {/* A real space between masks so the heading can still wrap. */}
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}

// Counts from `from` to `to` when it scrolls into view. Server HTML holds the
// final value, so crawlers and no-JS visitors still see the real number.
export function CountUp({ from, to, prefix = "", suffix = "" }: { from: number; to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(to);
  const armed = useRef(false);

  useEffect(() => {
    if (reduced || from === to) return;
    if (!armed.current) {
      armed.current = true;
      setValue(from);
    }
    if (!inView) return;
    const start = performance.now();
    const duration = 1400;
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(Math.round(from + (to - from) * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, from, to, reduced]);

  return (
    <span ref={ref}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

// A soft amber light that follows the pointer inside the element.
export function Spotlight({ children, className }: { children: ReactNode; className?: string }) {
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };
  return (
    <div onPointerMove={onMove} className={`group/spot relative ${className ?? ""}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background: "radial-gradient(420px circle at var(--x) var(--y), rgb(240 180 92 / 0.08), transparent 60%)",
        }}
      />
      {children}
    </div>
  );
}

// Pulls the element slightly toward the pointer while hovered.
export function Magnetic({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setOffset({
      x: (e.clientX - (rect.left + rect.width / 2)) * strength,
      y: (e.clientY - (rect.top + rect.height / 2)) * strength,
    });
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => setOffset({ x: 0, y: 0 })}
      animate={offset}
      transition={{ type: "spring", stiffness: 220, damping: 16, mass: 0.4 }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}
