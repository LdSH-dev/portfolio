"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Reveal } from "@/components/motion-primitives";
import { Scribble } from "@/components/sketch";
import type { PageSpeedResult, Strategy } from "@/lib/pagespeed";

const ease = [0.22, 1, 0.36, 1] as const;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

// Lighthouse's own thresholds: 90+ good, 50–89 needs work, below 50 poor.
const tone = (score: number) =>
  score >= 90
    ? { stroke: "#34d399", text: "text-emerald-400" }
    : score >= 50
      ? { stroke: "#f0b45c", text: "text-amber" }
      : { stroke: "#f87171", text: "text-red-400" };

type Run = { status: "running" } | { status: "error" } | { status: "done"; result: PageSpeedResult };

const runningSteps = [
  "Asking Google to load this page from its own servers…",
  "Emulating a mid-range phone on a throttled 4G connection…",
  "Measuring how fast the main content paints…",
  "Checking interactivity and layout stability…",
  "Auditing accessibility, best practices and SEO…",
];

function Gauge({ value, label, delay }: { value: number; label: string; delay: number }) {
  const reduced = useReducedMotion();
  const progress = useMotionValue(reduced ? value : 0);
  const shown = useTransform(progress, (v) => Math.round(v));
  const R = 42;
  const C = 2 * Math.PI * R;
  const dash = useTransform(progress, (v) => `${(v / 100) * C} ${C}`);
  const t = tone(value);

  useEffect(() => {
    if (reduced) return;
    const controls = animate(progress, value, { duration: 1.6, ease, delay });
    return () => controls.stop();
  }, [progress, value, delay, reduced]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative size-28">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgb(148 163 184 / 0.12)" strokeWidth="6" />
          <motion.circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={t.stroke}
            strokeWidth="6"
            strokeLinecap="round"
            style={{ strokeDasharray: dash, filter: `drop-shadow(0 0 6px ${t.stroke}66)` }}
          />
        </svg>
        <motion.span className={`absolute inset-0 grid place-items-center text-3xl font-semibold tabular-nums ${t.text}`}>
          {shown}
        </motion.span>
      </div>
      <p className="mt-3 text-sm text-fg-muted">{label}</p>
    </div>
  );
}

export function SpeedTest() {
  const [strategy, setStrategy] = useState<Strategy>("mobile");
  // One result per device, kept for the visit so switching tabs never shows
  // the other device's scores. Nothing runs until the visitor asks.
  const [runs, setRuns] = useState<Partial<Record<Strategy, Run>>>({});
  const [step, setStep] = useState(0);
  const current = runs[strategy];
  const status = current?.status ?? "idle";
  const result = current?.status === "done" ? current.result : null;
  const anyRunning = Object.values(runs).some((r) => r?.status === "running");

  // Cycle the narration while Google runs the audit.
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, runningSteps.length - 1)), 4500);
    return () => clearInterval(id);
  }, [status]);

  const run = async () => {
    const target = strategy;
    const save = (r: Run) => setRuns((prev) => ({ ...prev, [target]: r }));
    save({ status: "running" });
    setStep(0);
    try {
      const res = await fetch(`/api/pagespeed?strategy=${target}`);
      if (!res.ok) throw new Error();
      save({ status: "done", result: (await res.json()) as PageSpeedResult });
    } catch {
      save({ status: "error" });
    }
  };

  return (
    <section id="performance" className="scroll-mt-24 border-y border-line bg-ink-raised/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="font-mono text-xs tracking-[0.18em] text-fg-faint uppercase">06 · Performance</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
            A 3D globe, a custom cursor, a dozen animations.{" "}
            <span className="font-serif font-normal italic tracking-normal text-amber-gradient">Still fast.</span>
          </h2>
          <p className="mt-4 max-w-xl text-fg-muted">
            Don&apos;t trust a screenshot. Run Google&apos;s own PageSpeed audit on this page, live, right now.
          </p>
        </Reveal>

        <Scribble arrow="down-right" delay={0.3} tilt={3} className="-mb-6 mt-4 flex flex-col items-end pr-28 max-md:hidden" arrowClassName="mr-[-4.5rem]">
          go on, press it
        </Scribble>
        <Reveal delay={0.1} className="mt-10 overflow-hidden rounded-3xl border border-line-strong bg-ink">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4 md:px-8">
            <div role="group" aria-label="Device" className="flex rounded-full border border-line-strong p-1">
              {(["mobile", "desktop"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={strategy === s}
                  disabled={anyRunning}
                  onClick={() => setStrategy(s)}
                  className="relative rounded-full px-4 py-1.5 text-sm capitalize transition-colors disabled:opacity-50 aria-pressed:text-ink"
                >
                  {strategy === s && (
                    <motion.span
                      layoutId="psi-strategy"
                      className="absolute inset-0 rounded-full bg-fg"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <span className="relative">{s}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={run}
              disabled={!siteUrl || anyRunning}
              className="rounded-full bg-gradient-to-r from-amber-soft via-amber to-amber-deep px-6 py-2.5 text-sm font-semibold text-ink transition-opacity disabled:opacity-40"
            >
              {status === "running" ? "Running…" : status === "done" ? "Run again" : "Run live test"}
            </button>
          </div>

          <div className="relative min-h-[300px] px-6 py-10 md:px-8">
            <AnimatePresence mode="wait">
              {status === "idle" && (
                <motion.div key={`idle-${strategy}`} exit={{ opacity: 0 }} className="grid place-items-center py-10 text-center">
                  <p className="max-w-md text-fg-muted">
                    {siteUrl ? (
                      <>
                        Google will load <span className="font-mono text-fg">{siteUrl.replace(/^https?:\/\//, "")}</span>{" "}
                        on its own servers and score it. Takes about 20 seconds.
                      </>
                    ) : (
                      "The live test runs against the published site, so it switches on once this page is deployed."
                    )}
                  </p>
                </motion.div>
              )}

              {status === "running" && (
                <motion.div
                  key="running"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid place-items-center py-10 text-center"
                  aria-live="polite"
                >
                  {/* A sweep across a faint grid, like a scanner pass */}
                  <div className="relative h-1 w-full max-w-md overflow-hidden rounded-full bg-line-strong">
                    <motion.span
                      className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-amber to-transparent"
                      animate={{ x: ["-100%", "300%"] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={step}
                      initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                      transition={{ duration: 0.4 }}
                      className="mt-6 font-mono text-xs text-fg-muted"
                    >
                      {runningSteps[step]}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div key={`error-${strategy}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid place-items-center py-10 text-center">
                  <p className="max-w-md text-fg-muted">
                    Google&apos;s PageSpeed service didn&apos;t answer this time (it rate-limits busy periods). Try again in
                    a minute, or{" "}
                    {siteUrl && (
                      <a
                        className="text-fg underline underline-offset-4"
                        href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(siteUrl)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        run it on pagespeed.web.dev ↗
                      </a>
                    )}
                  </p>
                </motion.div>
              )}

              {status === "done" && result && (
                <motion.div key={`done-${strategy}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                  <div className="grid grid-cols-2 gap-y-8 md:grid-cols-4">
                    {result.scores.map((s, i) => (
                      <Gauge key={s.id} value={s.value} label={s.label} delay={0.1 + i * 0.12} />
                    ))}
                  </div>

                  <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
                    {result.metrics.map((m, i) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.07, ease }}
                        className="bg-ink-raised p-4"
                      >
                        <dt className="flex items-center gap-2 text-xs text-fg-faint">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: tone(Math.round(m.score * 100)).stroke }}
                          />
                          {m.label}
                        </dt>
                        <dd className="mt-2 font-mono text-lg text-fg">{m.display}</dd>
                      </motion.div>
                    ))}
                  </dl>

                  <p className="mt-6 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-fg-faint">
                    <span>
                      {result.strategy} · tested {new Date(result.fetchedAt).toLocaleTimeString()} via Google PageSpeed
                      Insights
                    </span>
                    <a href={result.reportUrl} target="_blank" rel="noreferrer" className="text-fg-muted hover:text-fg">
                      Full report ↗
                    </a>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
