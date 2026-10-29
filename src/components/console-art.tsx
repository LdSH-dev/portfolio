"use client";

import { useEffect } from "react";
import { profile } from "@/content/profile";

// For whoever opens DevTools: you're probably an engineer, so hi.
const art = String.raw`
   _______________________________________
  /                                       \
 |   HEY. YOU'RE NOT SUPPOSED TO BE HERE.  |
  \_______________________________________/
          \
           \    .--.
               |o_o |
               |:_/ |      *nervous engineer noises*
              //   \ \
             (|     | )
            /'\_   _/'\
            \___)=(___/
`;

let greeted = false;

export function ConsoleArt() {
  useEffect(() => {
    if (greeted) return;
    greeted = true;
    console.log(`%c${art}`, "color:#f0b45c;font-family:monospace;font-size:12px;line-height:1.2");
    console.log(
      "%cBut since you're already poking around the source...%c\n" +
        "You're clearly the curious type. I like that.\n" +
        "This site is Next.js 16, React 19, a hand-rolled canvas globe and a Claude-powered twin.\n" +
        `Want to talk shop? ${profile.email} · ${profile.links.github}`,
      "color:#e9ebef;font-size:14px;font-weight:600",
      "color:#8b94a3;font-size:12px;line-height:1.6",
    );
    // The first thing a careful engineer checks on an AI site.
    console.log(
      "%cLooking for the API key?%c\n" +
        "Good instinct. It isn't here: the twin is called only from the server, and the key never reaches your browser.\n" +
        "The endpoint is rate-limited per IP, input is length-checked, the provider account has a hard spend cap,\n" +
        "and I read the transcripts. Check the Network tab: /api/chat streams plain text, nothing else.",
      "color:#f0b45c;font-size:13px;font-weight:600",
      "color:#8b94a3;font-size:12px;line-height:1.6",
    );
  }, []);
  return null;
}
