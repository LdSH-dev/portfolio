"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Reveal } from "@/components/motion-primitives";
import { Scribble } from "@/components/sketch";
import { RoleDetails } from "@/components/role-details";
import { experience, type Role } from "@/content/profile";

const ease = [0.22, 1, 0.36, 1] as const;

// Newest first, the way a CV reads. Only roles with a written story get a row.
const rows = experience.filter((r) => r.story && r.metric);
const shortName = (company: string) => company.split(" · ")[0];
const yearRange = (role: Role) => {
  const from = role.start.slice(0, 4);
  const to = role.end ? role.end.slice(0, 4) : "now";
  return from === to ? from : `${from} → ${to}`;
};

function Row({ role, open, onToggle, index }: { role: Role; open: boolean; onToggle: () => void; index: number }) {
  const [showAll, setShowAll] = useState(false);
  const reduced = useReducedMotion();
  const lines = role.story!;
  const metric = role.metric!;
  const panelId = `role-${index}`;

  return (
    <motion.li
      layout={!reduced}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease, delay: index * 0.06, layout: { duration: 0.5, ease } }}
      className="border-b border-line"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="group relative grid w-full grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 overflow-hidden py-7 pl-4 text-left md:grid-cols-[9rem_1fr_auto_auto] md:pl-0"
      >
        {/* A soft light that sweeps in from the left on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-amber/[0.07] via-amber/[0.03] to-transparent transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
        />
        {/* Amber edge marks the open row */}
        <motion.span
          aria-hidden
          className="absolute top-0 bottom-0 left-0 w-[2px] origin-top bg-amber"
          initial={false}
          animate={{ scaleY: open ? 1 : 0 }}
          transition={{ duration: 0.5, ease }}
        />

        <span className="relative col-span-2 font-mono text-xs text-fg-faint md:col-span-1 md:pl-5">
          {yearRange(role)}
        </span>

        <span className="relative transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5">
          <span className="block text-2xl font-semibold tracking-[-0.03em] md:text-3xl">{shortName(role.company)}</span>
          <span className="mt-1 block text-sm text-fg-muted">
            {role.role}
            {role.current ? " · ongoing" : ""}
          </span>
        </span>

        <span
          className={`relative hidden text-right transition-all duration-500 md:block ${
            open ? "translate-x-2 opacity-0" : "opacity-100"
          }`}
        >
          <span className="block font-serif text-3xl leading-none text-fg-muted italic transition-colors duration-500 group-hover:text-fg">
            {metric.value}
          </span>
          <span className="mt-1 block max-w-[12rem] text-xs text-fg-faint">{metric.label}</span>
        </span>

        <motion.span
          aria-hidden
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.4, ease }}
          className={`relative col-start-2 row-start-2 grid size-9 place-items-center self-center justify-self-end rounded-full border transition-colors md:col-start-auto md:row-start-auto ${
            open ? "border-amber bg-amber text-ink" : "border-line-strong text-fg-muted group-hover:border-amber/60 group-hover:text-amber"
          }`}
        >
          +
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.55, ease }, opacity: { duration: 0.3 } }}
            className="overflow-hidden"
          >
            <div className="grid gap-10 pb-10 md:grid-cols-[9rem_1fr_16rem] md:gap-x-6">
              <span className="hidden md:block" />

              {/* The story: context, challenge, what I did, what changed */}
              <div className="max-w-2xl space-y-4">
                {lines.map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.6, ease, delay: 0.12 + i * 0.09 }}
                    className={
                      i === 3
                        ? "font-serif text-2xl leading-snug text-fg italic"
                        : "text-lg leading-relaxed text-fg-muted"
                    }
                  >
                    {i === 3 ? <span className="text-amber-gradient">{line}</span> : line}
                  </motion.p>
                ))}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="pt-3"
                >
                  <button
                    type="button"
                    aria-expanded={showAll}
                    onClick={() => setShowAll((v) => !v)}
                    className="inline-flex items-center gap-2 font-mono text-[11px] text-fg-muted transition-colors hover:text-fg"
                  >
                    <span className="text-amber">{showAll ? "−" : "+"}</span>
                    {showAll ? "Show less" : `Everything I did at ${shortName(role.company)}`}
                  </button>
                  <AnimatePresence initial={false}>
                    {showAll && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease }}
                        className="overflow-hidden"
                      >
                        <div className="pt-6">
                          <RoleDetails role={role} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* The headline number, given room to breathe */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.8, ease, delay: 0.25 }}
                className="order-first md:order-none md:text-right"
              >
                <p className="font-serif text-6xl leading-none text-amber-gradient italic drop-shadow-[0_0_24px_rgb(240_180_92/0.25)] md:text-7xl">
                  {metric.value}
                </p>
                <p className="mt-2 text-sm text-fg-muted">{metric.label}</p>
                <p className="mt-4 font-mono text-[11px] text-fg-faint">{role.place}</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export function ExperienceList({ id = "experience" }: { id?: string }) {
  const [open, setOpen] = useState<string | null>(rows[0].company);

  return (
    <section id={id} className="scroll-mt-24 py-24">
      <div className="relative mx-auto max-w-6xl px-6">
        <Scribble arrow="down-left" delay={0.3} tilt={-3} className="absolute top-20 right-10 max-lg:hidden" arrowClassName="-ml-6">
          open any row for the full story
        </Scribble>
        <Reveal>
          <p className="font-mono text-xs tracking-[0.18em] text-fg-faint uppercase">03 · Experience</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
            Where I&apos;ve{" "}
            <span className="font-serif font-normal italic tracking-normal text-amber-gradient">made a difference.</span>
          </h2>
        </Reveal>

        <ol className="mt-12 border-t border-line">
          {rows.map((role, i) => (
            <Row
              key={role.company}
              role={role}
              index={i}
              open={open === role.company}
              onToggle={() => setOpen((c) => (c === role.company ? null : role.company))}
            />
          ))}
        </ol>

        <p className="mt-8 font-mono text-xs text-fg-faint">
          Where it started: <span className="text-fg-muted">Univates</span>, 2021, my first job as a junior developer.
        </p>
      </div>
    </section>
  );
}
