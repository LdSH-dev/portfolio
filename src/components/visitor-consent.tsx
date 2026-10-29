"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";

const CONSENT = "leo:consent";
const VISITOR = "leo:visitor";
const SENT = "leo:tracked";

const read = (store: () => Storage, key: string) => {
  try {
    return store().getItem(key);
  } catch {
    return null;
  }
};
const write = (store: () => Storage, key: string, value: string) => {
  try {
    store().setItem(key, value);
  } catch {
    // Private mode or blocked storage: the site works the same without it.
  }
};

// The id the booking form attaches a name to, only for visitors who said yes.
export function consentedVisitorId() {
  return read(() => localStorage, CONSENT) === "yes" ? read(() => localStorage, VISITOR) : null;
}

function track(consent: boolean) {
  const visitorId = consent ? read(() => localStorage, VISITOR) : null;
  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      consent,
      visitorId,
      path: location.pathname,
      referrer: document.referrer ? new URL(document.referrer).host : "",
    }),
  }).catch(() => {});
}

// Counts the visit once per session: anonymously for everyone, with city and
// network for visitors who opt in through the little card.
export function VisitorConsent() {
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    const choice = read(() => localStorage, CONSENT);
    const timer = window.setTimeout(() => {
      if (!read(() => sessionStorage, SENT)) {
        write(() => sessionStorage, SENT, "1");
        track(choice === "yes");
      }
      if (!choice) setAsk(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const answer = (yes: boolean) => {
    write(() => localStorage, CONSENT, yes ? "yes" : "no");
    if (yes) {
      write(() => localStorage, VISITOR, crypto.randomUUID());
      track(true);
    }
    setAsk(false);
  };

  return (
    <AnimatePresence>
      {ask && (
        <motion.aside
          aria-label="Visitor analytics"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed inset-x-3 bottom-16 z-50 rounded-2xl border border-line-strong bg-ink-raised/95 p-4 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] backdrop-blur-md md:inset-x-auto md:bottom-6 md:left-6 md:max-w-sm"
        >
          <p className="font-hand text-2xl leading-none text-amber">mind if I say hi back?</p>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            I&apos;d love to know where my visitors come from: your city, country and network (often your company).
            No ads, no cookies, nothing sold.{" "}
            <Link href="/privacy" className="text-fg underline underline-offset-4">
              Details
            </Link>
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => answer(true)}
              className="rounded-full bg-gradient-to-r from-amber-soft via-amber to-amber-deep px-4 py-2 text-sm font-semibold text-on-amber"
            >
              Sure, count me in
            </button>
            <button
              type="button"
              onClick={() => answer(false)}
              className="rounded-full border border-line-strong px-4 py-2 text-sm text-fg-muted hover:text-fg"
            >
              Rather not
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
