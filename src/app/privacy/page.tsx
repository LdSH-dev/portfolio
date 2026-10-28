import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: `Privacy · ${profile.name}`,
  description: "What this portfolio does with the information you share.",
};

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <Link href="/" className="font-mono text-xs text-fg-faint hover:text-fg">
        ← back
      </Link>
      <p className="mt-10 font-mono text-xs tracking-[0.18em] text-fg-faint uppercase">Privacy</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em]">
        Short and <span className="font-serif font-normal italic tracking-normal text-amber-gradient">plain.</span>
      </h1>
      <div className="mt-10 space-y-6 leading-relaxed text-fg-muted">
        <p>
          <strong className="text-fg">Booking a call.</strong> When you book a call, your name, email, company and note
          are used to create an event on my Google Calendar and send you the invite with a Google Meet link. The site
          reads my calendar&apos;s free/busy times only to show open slots. Nothing is stored anywhere else.
        </p>
        <p>
          <strong className="text-fg">The digital twin chat.</strong> Your messages are sent to Anthropic&apos;s Claude API
          to generate replies. They aren&apos;t saved by this site, so please don&apos;t share anything sensitive.
        </p>
        <p>
          <strong className="text-fg">Speed test.</strong> The PageSpeed test only audits this site through Google&apos;s
          PageSpeed Insights API. No personal data is involved.
        </p>
        <p>
          <strong className="text-fg">Visitor counts.</strong> Every visit is counted anonymously: a daily id made by
          hashing your IP and browser with a salt that changes every day, plus your country. Your IP itself is never
          stored, and yesterday&apos;s id can&apos;t be linked to today&apos;s.
        </p>
        <p>
          <strong className="text-fg">If you say yes to the little card.</strong> I also keep your city, region, the
          organisation that owns your network (often your company), the page you opened, where you came from and your
          device type, tied to a random id saved in your browser. If you then book a call, the name you type is attached
          to those visits. Clearing your browser storage resets it. No cookies, no ads, nothing sold or shared.
        </p>
        <p>
          Questions, or want your booking details removed? Email{" "}
          <a href={`mailto:${profile.email}`} className="text-fg underline underline-offset-4">
            {profile.email}
          </a>
          .
        </p>
      </div>
    </main>
  );
}
