"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { consentedVisitorId } from "@/components/visitor-consent";
import { profile } from "@/content/profile";

const ease = [0.22, 1, 0.36, 1] as const;
const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;
// Google's appointment page, used only when the Calendar API isn't set up.
const embedUrl = bookingUrl ? `${bookingUrl}${bookingUrl.includes("?") ? "&" : "?"}gv=true` : null;

type Step =
  | { name: "loading" }
  | { name: "pick" }
  | { name: "details" }
  | { name: "sending" }
  | { name: "done"; meetUrl: string | null }
  | { name: "error"; message: string }
  | { name: "embed" };

const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA");
const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString("en-US", opts);

// Leo's own booking flow: real availability from his Google Calendar, shown in
// the visitor's time zone, booked with a Meet link and a calendar invite.
// The modal is portalled to <body> so transformed ancestors (Magnetic, Reveal)
// can't trap its fixed positioning.
export function BookCall({ className, children }: { className?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>({ name: "loading" });
  const [slots, setSlots] = useState<string[]>([]);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  const zone = useMemo(() => (open ? Intl.DateTimeFormat().resolvedOptions().timeZone : ""), [open]);

  const days = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of slots) map.set(dayKey(s), [...(map.get(dayKey(s)) ?? []), s]);
    return [...map.entries()];
  }, [slots]);
  const daySlots = days.find(([key]) => key === day)?.[1] ?? [];

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const load = async () => {
    setStep({ name: "loading" });
    setSlot(null);
    try {
      const res = await fetch("/api/booking");
      if (res.status === 503) return setStep(embedUrl ? { name: "embed" } : { name: "error", message: "" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { slots: string[] };
      setSlots(data.slots);
      setDay(data.slots[0] ? dayKey(data.slots[0]) : null);
      setStep({ name: "pick" });
    } catch {
      setStep({ name: "error", message: "I couldn't load my calendar just now." });
    }
  };

  const openModal = () => {
    setOpen(true);
    load();
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setEmail(String(form.get("email")));
    setStep({ name: "sending" });
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(form), start: slot, visitorId: consentedVisitorId() }),
      });
      if (res.status === 409) {
        await load();
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { meetUrl: string | null };
      setStep({ name: "done", meetUrl: data.meetUrl });
    } catch {
      setStep({ name: "error", message: "Something went wrong while booking." });
    }
  };

  const label = children ?? "Book a call";

  return (
    <>
      <button type="button" onClick={openModal} className={className}>
        {label}
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="booking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[64] grid place-items-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && setOpen(false)}
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Book a call with Leo"
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  transition={{ duration: 0.4, ease }}
                  className={`relative flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-line-strong bg-ink-raised shadow-[0_40px_120px_-20px_rgb(0_0_0/0.8)] ${step.name === "embed" ? "h-[90vh]" : "max-h-[92vh]"}`}
                >
                  <div aria-hidden className="blueprint pointer-events-none absolute inset-0 opacity-40" />
                  <header className="relative flex items-center justify-between border-b border-line px-6 py-4">
                    <div>
                      <p className="font-mono text-[11px] text-amber">booking · 30 min · google meet</p>
                      <p className="mt-0.5 text-lg font-semibold tracking-[-0.02em]">
                        {step.name === "done" ? "See you there." : "Pick a time that works for you"}
                      </p>
                    </div>
                    <button
                      ref={closeRef}
                      type="button"
                      aria-label="Close"
                      onClick={() => setOpen(false)}
                      className="grid size-9 place-items-center rounded-full border border-line-strong text-fg-muted hover:text-fg"
                    >
                      ✕
                    </button>
                  </header>

                  {step.name === "embed" ? (
                    <iframe src={embedUrl!} title="Book a call with Leo" className="relative flex-1 border-0 bg-white" />
                  ) : (
                    <div className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] overflow-y-auto md:grid-cols-[230px_minmax(0,1fr)]">
                      <aside className="border-b border-line p-6 md:border-r md:border-b-0">
                        <span className="grid size-12 place-items-center rounded-full border border-amber/40 bg-amber/10 font-serif text-xl text-amber italic">
                          LH
                        </span>
                        <p className="mt-4 font-semibold">Intro call with Leo</p>
                        <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                          30 minutes to talk about your team, the role and how I can help.
                        </p>
                        <dl className="mt-5 space-y-2 font-mono text-[11px] text-fg-faint">
                          <div>
                            <dt className="inline">where </dt>
                            <dd className="inline text-fg-muted">Google Meet</dd>
                          </div>
                          <div>
                            <dt className="inline">your tz </dt>
                            <dd className="inline text-fg-muted">{zone.replace(/_/g, " ")}</dd>
                          </div>
                          {slot && step.name !== "pick" && (
                            <div>
                              <dt className="inline">when </dt>
                              <dd className="inline text-amber">
                                {fmt(slot, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </aside>

                      <div className="min-h-[380px] p-6">
                        <AnimatePresence mode="wait">
                          {step.name === "loading" && (
                            <motion.div key="loading" exit={{ opacity: 0 }} className="space-y-5" aria-label="Loading available times">
                              <div className="flex gap-2">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <span key={i} className="h-16 w-14 animate-pulse rounded-xl bg-white/[0.04]" />
                                ))}
                              </div>
                              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                {Array.from({ length: 12 }, (_, i) => (
                                  <span key={i} className="h-10 animate-pulse rounded-full bg-white/[0.04]" />
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {step.name === "pick" && (
                            <motion.div key="pick" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                              {days.length === 0 ? (
                                <p className="text-fg-muted">
                                  My calendar is full for the next two weeks. Email me at{" "}
                                  <a className="text-fg underline underline-offset-4" href={`mailto:${profile.email}`}>
                                    {profile.email}
                                  </a>{" "}
                                  and we&apos;ll find a time.
                                </p>
                              ) : (
                                <>
                                  <p className="font-mono text-[11px] text-fg-faint">01 · pick a day</p>
                                  <div className="mt-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
                                    {days.map(([key, list]) => (
                                      <button
                                        key={key}
                                        type="button"
                                        aria-pressed={day === key}
                                        onClick={() => {
                                          setDay(key);
                                          setSlot(null);
                                        }}
                                        className="relative w-14 shrink-0 rounded-xl border border-line-strong py-2 text-center transition-colors hover:border-amber/50 aria-pressed:border-transparent aria-pressed:text-ink"
                                      >
                                        {day === key && (
                                          <motion.span layoutId="book-day" className="absolute inset-0 rounded-xl bg-amber" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
                                        )}
                                        <span className="relative block font-mono text-[10px] uppercase opacity-70">
                                          {fmt(list[0], { weekday: "short" })}
                                        </span>
                                        <span className="relative block text-xl font-semibold tabular-nums">
                                          {fmt(list[0], { day: "numeric" })}
                                        </span>
                                        <span className="relative block font-mono text-[10px] opacity-70">
                                          {fmt(list[0], { month: "short" })}
                                        </span>
                                      </button>
                                    ))}
                                  </div>

                                  <p className="mt-6 font-mono text-[11px] text-fg-faint">02 · pick a time</p>
                                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                                    {daySlots.map((s, i) => (
                                      <motion.button
                                        key={s}
                                        type="button"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.02 }}
                                        aria-pressed={slot === s}
                                        onClick={() => setSlot(s)}
                                        className="rounded-full border border-line-strong py-2 text-sm tabular-nums transition-colors hover:border-amber/50 aria-pressed:border-amber aria-pressed:bg-amber/10 aria-pressed:text-amber"
                                      >
                                        {fmt(s, { hour: "numeric", minute: "2-digit" })}
                                      </motion.button>
                                    ))}
                                  </div>
                                  <div className="mt-6 flex justify-end">
                                    <button
                                      type="button"
                                      disabled={!slot}
                                      onClick={() => setStep({ name: "details" })}
                                      className="rounded-full bg-gradient-to-r from-amber-soft via-amber to-amber-deep px-6 py-2.5 text-sm font-semibold text-ink transition-opacity disabled:opacity-30"
                                    >
                                      Continue →
                                    </button>
                                  </div>
                                </>
                              )}
                            </motion.div>
                          )}

                          {(step.name === "details" || step.name === "sending") && (
                            <motion.form
                              key="details"
                              onSubmit={submit}
                              initial={{ opacity: 0, x: 12 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -12 }}
                              className="space-y-4"
                            >
                              <button
                                type="button"
                                onClick={() => setStep({ name: "pick" })}
                                className="font-mono text-[11px] text-fg-faint hover:text-fg"
                              >
                                ← change time
                              </button>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <Field name="name" label="Your name" required autoComplete="name" />
                                <Field name="email" label="Work email" type="email" required autoComplete="email" />
                              </div>
                              <Field name="company" label="Company (optional)" autoComplete="organization" />
                              <label className="block">
                                <span className="font-mono text-[11px] text-fg-faint">Anything I should prepare? (optional)</span>
                                <textarea
                                  name="note"
                                  rows={3}
                                  maxLength={800}
                                  className="mt-1.5 w-full resize-none rounded-xl border border-line-strong bg-ink px-4 py-3 text-sm text-fg placeholder:text-fg-faint focus:border-amber/60 focus:outline-none"
                                  placeholder="The role, the stack, a link to the job post…"
                                />
                              </label>
                              <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
                              <div className="flex justify-end">
                                <button
                                  type="submit"
                                  disabled={step.name === "sending"}
                                  className="rounded-full bg-gradient-to-r from-amber-soft via-amber to-amber-deep px-6 py-2.5 text-sm font-semibold text-ink transition-opacity disabled:opacity-50"
                                >
                                  {step.name === "sending" ? "Booking…" : "Confirm booking"}
                                </button>
                              </div>
                            </motion.form>
                          )}

                          {step.name === "done" && (
                            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid place-items-center py-10 text-center">
                              <svg viewBox="0 0 52 52" className="size-16 text-amber" aria-hidden>
                                <motion.circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease }} />
                                <motion.path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.5, ease }} />
                              </svg>
                              <p className="mt-6 text-2xl font-semibold tracking-[-0.02em]">You&apos;re booked.</p>
                              <p className="mt-2 max-w-sm text-fg-muted">
                                {slot && fmt(slot, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}. The
                                invite with the Meet link is on its way to <span className="text-fg">{email}</span>.
                              </p>
                              {step.meetUrl && (
                                <a href={step.meetUrl} target="_blank" rel="noreferrer" className="mt-5 font-mono text-xs text-amber hover:underline">
                                  {step.meetUrl.replace("https://", "")} ↗
                                </a>
                              )}
                            </motion.div>
                          )}

                          {step.name === "error" && (
                            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-fg-muted">
                              <p>
                                {step.message} You can{" "}
                                {bookingUrl && (
                                  <>
                                    <a className="text-fg underline underline-offset-4" href={bookingUrl} target="_blank" rel="noreferrer">
                                      use my Google booking page
                                    </a>{" "}
                                    or{" "}
                                  </>
                                )}
                                email me at{" "}
                                <a className="text-fg underline underline-offset-4" href={`mailto:${profile.email}`}>
                                  {profile.email}
                                </a>
                                .
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] text-fg-faint">{label}</span>
      <input
        {...props}
        maxLength={120}
        className="mt-1.5 w-full rounded-xl border border-line-strong bg-ink px-4 py-2.5 text-sm text-fg focus:border-amber/60 focus:outline-none"
      />
    </label>
  );
}
