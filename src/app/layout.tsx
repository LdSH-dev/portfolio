import type { Metadata } from "next";
import { Caveat, Great_Vibes, Inter_Tight, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import { profile } from "@/content/profile";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: "400",
  // Small labels only; the fallback mono is fine for the first frame.
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  // The serif only ever appears in italic: one file instead of two.
  style: "italic",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  // Decorative and below the fold: don't compete with the hero for bandwidth.
  preload: false,
  weight: ["500"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  preload: false,
  weight: "400",
});

export const metadata: Metadata = {
  title: `${profile.name} · ${profile.role}`,
  description:
    "Senior full-stack engineer building fast, reliable React and Node.js products for US teams. Ask my digital twin why I'm the right hire.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${caveat.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
