"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { profile } from "@/content/profile";

const ease = [0.22, 1, 0.36, 1] as const;
const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;

// Google's appointment pages render a compact, embeddable view with ?gv=true.
const embedUrl = bookingUrl ? `${bookingUrl}${bookingUrl.includes("?") ? "&" : "?"}gv=true` : null;

// Opens Leo's Google Calendar booking page in a modal. The iframe is only
// created on click, so the page doesn't pay for Google's widget up front.
// Without a booking URL configured it degrades to a plain email link.
export function BookCall({ className, children }: { className?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

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

  const label = children ?? "Book a call";

  if (!embedUrl) {
    return (
      <a href={`mailto:${profile.email}?subject=Let's%20talk`} className={className}>
        {label}
      </a>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[64] bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              key="dialog"
              role="dialog"
              aria-modal="true"
              aria-label="Book a call with Leo"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.4, ease }}
              className="fixed inset-x-3 top-[5vh] bottom-[5vh] z-[65] mx-auto flex max-w-4xl flex-col overflow-hidden rounded-3xl border border-line-strong bg-ink-raised shadow-[0_40px_120px_-20px_rgb(0_0_0/0.8)]"
            >
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <div>
                  <p className="font-mono text-[11px] text-amber">Google Calendar</p>
                  <p className="mt-0.5 text-lg font-semibold tracking-[-0.02em]">Pick a time that works for you</p>
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
              </div>
              <div className="relative flex-1 bg-white">
                {!loaded && (
                  <div className="absolute inset-0 grid place-items-center bg-ink-raised">
                    <span className="font-mono text-xs text-fg-muted">Loading available times…</span>
                  </div>
                )}
                <iframe
                  src={embedUrl}
                  title="Book a call with Leo"
                  onLoad={() => setLoaded(true)}
                  className="size-full border-0"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
