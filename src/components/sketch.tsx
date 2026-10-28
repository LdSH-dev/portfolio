"use client";

import { useId, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

// Hand-drawn layer: margin notes, a seal, a signature and a blueprint plate.
// It's what makes the page feel like Leo's own drawing board.

const ease = [0.22, 1, 0.36, 1] as const;

// Each arrow is a wobbly shaft plus a head, in a 100×70 box.
const arrows = {
  "down-left": ["M90 8 C 70 10, 40 22, 22 54", "M12 42 L21 56 L36 50"],
  "down-right": ["M10 8 C 30 10, 60 22, 78 54", "M64 50 L79 56 L88 42"],
  down: ["M48 4 C 62 22, 36 40, 50 62", "M40 52 L50 64 L60 52"],
  left: ["M96 34 C 70 20, 40 48, 8 34", "M20 24 L8 34 L20 45"],
  right: ["M4 22 C 30 44, 62 46, 92 36", "M79 27 L92 36 L80 46"],
} as const;

export function Scribble({
  children,
  arrow,
  className = "",
  arrowClassName = "",
  delay = 0,
  tilt = -3,
  row = false,
}: {
  children: ReactNode;
  arrow: keyof typeof arrows;
  className?: string;
  arrowClassName?: string;
  delay?: number;
  tilt?: number;
  row?: boolean;
}) {
  const reduced = useReducedMotion();
  const [shaft, head] = arrows[arrow];
  const draw = (d: number) => ({
    initial: { pathLength: reduced ? 1 : 0 },
    whileInView: { pathLength: 1 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.7, ease, delay: delay + d },
  });

  return (
    <div aria-hidden className={`pointer-events-none select-none ${row ? "flex items-start gap-1" : ""} ${className}`}>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, delay }}
        style={{ rotate: tilt }}
        className="font-hand text-2xl leading-none whitespace-nowrap text-amber"
      >
        {children}
      </motion.p>
      <svg viewBox="0 0 100 70" className={`h-14 w-20 shrink-0 text-amber ${arrowClassName}`} fill="none">
        <motion.path d={shaft} stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...draw(0.3)} />
        <motion.path d={head} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...draw(0.85)} />
      </svg>
    </div>
  );
}

// Rotating seal with the monogram, stamped on the hero.
export function Seal({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <div aria-hidden className={`pointer-events-none ${className}`}>
      <svg viewBox="0 0 120 120" className="size-full">
        <defs>
          <path id={id} d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" />
        </defs>
        <circle cx="60" cy="60" r="58" fill="rgb(7 9 13 / 0.7)" stroke="rgb(240 180 92 / 0.35)" strokeDasharray="2 3" />
        <circle cx="60" cy="60" r="34" fill="none" stroke="rgb(240 180 92 / 0.25)" />
        <g className="origin-center animate-[spin_28s_linear_infinite] motion-reduce:animate-none">
          <text className="fill-fg-muted font-mono text-[8px] uppercase">
            <textPath href={`#${id}`} textLength="292" lengthAdjust="spacing">
              Software engineer · React · Node · POA → USA ·
            </textPath>
          </text>
        </g>
        <text x="60" y="68" textAnchor="middle" className="fill-amber font-serif text-[26px] italic">
          LH
        </text>
      </svg>
    </div>
  );
}

// Leo's name in cursive, inked as an outline first and then filled in.
export function Signature({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <svg viewBox="0 0 300 90" className={className} aria-label="Leonardo">
      <motion.text
        x="8"
        y="62"
        className="font-script text-[64px]"
        fill="var(--amber)"
        stroke="var(--amber)"
        strokeWidth="0.8"
        strokeDasharray="900"
        initial={{ strokeDashoffset: reduced ? 0 : 900, fillOpacity: reduced ? 1 : 0 }}
        whileInView={{ strokeDashoffset: 0, fillOpacity: 1 }}
        viewport={{ once: true }}
        transition={{
          strokeDashoffset: { duration: 2.6, ease: "easeInOut" },
          fillOpacity: { duration: 1, delay: 1.8 },
        }}
      >
        Leonardo
      </motion.text>
    </svg>
  );
}

const steam = [
  { d: "M128 104 C 116 88, 140 78, 128 60 C 118 46, 136 36, 128 22", delay: 0 },
  { d: "M154 100 C 144 84, 166 72, 154 54 C 146 42, 160 32, 154 18", delay: 1.1 },
  { d: "M180 104 C 170 90, 192 80, 180 62 C 172 50, 186 40, 180 28", delay: 2.2 },
];

// Blueprint plate of a coffee cup, with steam that never stops rising.
export function CoffeePlate({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();
  const stroke = (i: number, extra: object = {}) => ({
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    initial: { pathLength: reduced ? 1 : 0, opacity: reduced ? 1 : 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 1.1, ease, delay: 0.15 * i },
    ...extra,
  });
  const label = (i: number) => ({
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { duration: 0.5, delay: 1 + 0.15 * i },
  });
  const leader = { stroke: "currentColor", strokeWidth: 0.6, strokeDasharray: "2 3", opacity: 0.6 };

  return (
    <figure className={className}>
      <svg viewBox="0 0 352 290" className="w-full text-fg-muted" role="img" aria-label="Blueprint drawing of a steaming coffee cup">
        <g className="text-amber/80">
          {steam.map((s) => (
            <motion.path
              key={s.d}
              d={s.d}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              initial={{ opacity: reduced ? 0.6 : 0, y: 8 }}
              animate={reduced ? undefined : { opacity: [0, 0.9, 0], y: [8, -12], pathLength: [0.4, 1, 1] }}
              transition={{ duration: 3.3, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
            />
          ))}
        </g>

        {/* cup */}
        <motion.path d="M90 120 L102 222 C 104 238, 116 246, 132 246 L176 246 C 192 246, 204 238, 206 222 L218 120" {...stroke(0)} />
        <motion.ellipse cx="154" cy="120" rx="64" ry="10" {...stroke(1)} />
        <motion.ellipse cx="154" cy="123" rx="55" ry="6.5" {...stroke(2, { className: "text-amber-deep" })} />
        <motion.path d="M213 146 C 252 138, 258 198, 205 204" {...stroke(2)} />
        <motion.path d="M211 160 C 236 156, 240 188, 207 190" {...stroke(3)} />
        <motion.path d="M100 168 L208 168" {...stroke(3, { strokeDasharray: "3 4" })} />
        {/* saucer */}
        <motion.ellipse cx="154" cy="252" rx="96" ry="12" {...stroke(4)} />
        <motion.path d="M96 262 C 120 274, 188 274, 212 262" {...stroke(5)} />

        {/* height dimension */}
        <motion.g {...label(0)}>
          <path d="M50 110 L50 246 M44 110 L56 110 M44 246 L56 246" stroke="currentColor" strokeWidth="0.8" />
          <path d="M60 110 L88 110 M60 246 L100 246" {...leader} />
          <text x="40" y="178" transform="rotate(-90 40 178)" textAnchor="middle" className="fill-fg-faint font-mono text-[9px]">
            h ≈ 9 cm
          </text>
        </motion.g>

        {/* callouts */}
        <motion.g {...label(1)}>
          <path d="M186 40 L250 40" {...leader} />
          <text x="254" y="43" className="fill-fg-faint font-mono text-[9px]">steam · always</text>
        </motion.g>
        <motion.g {...label(2)}>
          <path d="M200 122 L250 104" {...leader} />
          <text x="254" y="102" className="fill-amber/80 font-mono text-[9px]">brazilian roast</text>
          <text x="254" y="114" className="fill-fg-faint font-mono text-[9px]">no sugar</text>
        </motion.g>
        <motion.g {...label(3)}>
          <path d="M246 176 L250 180" {...leader} />
          <text x="254" y="180" className="fill-fg-faint font-mono text-[9px]">handle · built</text>
          <text x="254" y="192" className="fill-fg-faint font-mono text-[9px]">for long debugs</text>
        </motion.g>
        <motion.g {...label(4)}>
          <path d="M208 168 L250 226" {...leader} />
          <text x="254" y="230" className="fill-fg-faint font-mono text-[9px]">refill line</text>
        </motion.g>
        <motion.g {...label(5)}>
          <path d="M244 258 L250 262" {...leader} />
          <text x="254" y="266" className="fill-fg-faint font-mono text-[9px]">refills · ∞</text>
        </motion.g>
      </svg>
      <figcaption className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-3 font-mono text-[10px] text-fg-faint">
        <span>fig. 07 — cup of coffee</span>
        <span className="font-hand text-lg text-amber">fuel for every commit</span>
      </figcaption>
    </figure>
  );
}
