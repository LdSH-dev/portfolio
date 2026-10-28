"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { Reveal } from "@/components/motion-primitives";
import { Scribble } from "@/components/sketch";
import { profile } from "@/content/profile";

type Message = { id: number; role: "twin" | "visitor"; text: string };

// What recruiters actually ask on a first screen.
const suggestions = [
  "Give me your 30-second pitch",
  "How strong are you with React and Node?",
  "Can you work US hours?",
  "What's your biggest win so far?",
  "What role are you looking for next?",
];

const greeting: Message = {
  id: 0,
  role: "twin",
  text: "Hey, I'm Leo. Well, the AI version of me, trained only on my real work. Ask me anything you'd ask in a first interview and I'll give you straight answers with real numbers.",
};

const fallback = `I lost my connection to the real Leo for a second. Try again, or reach him directly at ${profile.email}.`;
const slowDown = "You're asking faster than I can think! Give me a few minutes, or book a call with the real Leo.";

// Only the latest turns go to the model, starting on a visitor message.
function toHistory(messages: Message[]) {
  const recent = messages.slice(-20);
  const first = recent.findIndex((m) => m.role === "visitor");
  return recent.slice(first).map((m) => ({ role: m.role === "visitor" ? "user" : "assistant", content: m.text }));
}

export function AskLeo() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [greeted, setGreeted] = useState(false);
  const [replyPending, setReplyPending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [draft, setDraft] = useState("");
  const nextId = useRef(1);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const inView = useInView(panelRef, { once: true, margin: "-120px" });

  // The twin "types" its greeting the first time the panel is seen.
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setGreeted(true), 900);
    return () => clearTimeout(t);
  }, [inView]);

  const messages = useMemo(() => (greeted ? [greeting, ...conversation] : conversation), [greeted, conversation]);
  const typing = (inView && !greeted) || replyPending;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing || streaming) return;
    const visitor: Message = { id: nextId.current++, role: "visitor", text: trimmed };
    const history = toHistory([...conversation, visitor]);
    setConversation((prev) => [...prev, visitor]);
    setDraft("");
    setReplyPending(true);

    const replyId = nextId.current++;
    const write = (reply: string) =>
      setConversation((prev) =>
        prev.some((m) => m.id === replyId)
          ? prev.map((m) => (m.id === replyId ? { ...m, text: reply } : m))
          : [...prev, { id: replyId, role: "twin", text: reply }],
      );

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) throw new Error(res.status === 429 ? slowDown : fallback);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      setStreaming(true);
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setReplyPending(false);
        write(reply);
      }
      if (!reply) throw new Error(fallback);
    } catch (error) {
      write(error instanceof Error && error.message === slowDown ? slowDown : fallback);
    } finally {
      setReplyPending(false);
      setStreaming(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  return (
    <section id="ask" className="relative scroll-mt-24 py-24">
      <div className="relative mx-auto max-w-3xl px-6">
        <Scribble arrow="down-left" delay={0.4} tilt={4} className="absolute top-20 right-[-8rem] max-lg:hidden" arrowClassName="-ml-2 mt-1">
          real AI. go on, grill it
        </Scribble>
        <Reveal>
          <p className="font-mono text-xs tracking-[0.18em] text-fg-faint uppercase">02 · Interview me</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
            Ask my{" "}
            <span className="font-serif font-normal italic tracking-normal text-amber-gradient">digital twin.</span>
          </h2>
          <p className="mt-4 max-w-xl text-fg-muted text-pretty">
            An AI version of me that only knows my real work. It won&apos;t make things up. When it doesn&apos;t
            know something, it hands you over to the real Leo.
          </p>
        </Reveal>

        <div ref={panelRef} className="mt-10 overflow-hidden rounded-2xl border border-line-strong bg-ink-raised shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)]">
          <div className="flex items-center justify-between border-b border-line px-5 py-3 font-mono text-[11px] text-fg-faint">
            <span className="flex items-center gap-2">
              <span className="relative">
                <Image src="/leo-avatar.jpg" alt="" width={56} height={56} className="size-7 rounded-full object-cover" />
                <span className="absolute -right-0.5 -bottom-0.5 flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
                  <span className="relative inline-flex size-2.5 rounded-full border-2 border-ink-raised bg-emerald-400" />
                </span>
              </span>
              <span>
                <span className="block text-fg">Leo&apos;s twin</span>
                online, replies in seconds
              </span>
            </span>
            <span>AI · grounded in my CV</span>
          </div>

          <ol
            ref={listRef}
            aria-live="polite"
            className="flex max-h-[420px] min-h-[150px] flex-col gap-4 overflow-y-auto p-5"
          >
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={m.role === "visitor" ? "self-end" : "flex items-end gap-2 self-start"}
                >
                  {m.role === "twin" && <TwinAvatar />}
                  <p
                    className={
                      m.role === "visitor"
                        ? "max-w-md rounded-2xl rounded-br-md bg-amber/90 px-4 py-2.5 text-sm text-ink"
                        : "max-w-md rounded-2xl rounded-bl-md border border-line bg-ink-overlay px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-fg"
                    }
                  >
                    {m.text}
                  </p>
                </motion.li>
              ))}
              {typing && (
                <motion.li
                  key="typing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-end gap-2 self-start"
                  aria-label="Leo's twin is typing"
                >
                  <TwinAvatar />
                  <span className="flex gap-1 rounded-2xl rounded-bl-md border border-line bg-ink-overlay px-4 py-3.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="size-1.5 rounded-full bg-fg-muted"
                        animate={{ opacity: [0.25, 1, 0.25] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </span>
                </motion.li>
              )}
            </AnimatePresence>
          </ol>

          <div className="flex flex-wrap gap-2 px-5 pb-4">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                data-cursor="ask"
                disabled={typing || streaming}
                onClick={() => send(s)}
                className="rounded-full border border-line-strong px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-amber/50 hover:text-fg disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line p-3">
            <label htmlFor="ask-input" className="sr-only">
              Ask Leo&apos;s digital twin a question
            </label>
            <input
              id="ask-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask anything a hiring manager would…"
              autoComplete="off"
              maxLength={600}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim() || typing || streaming}
              className="rounded-full bg-fg px-4 py-2 text-sm font-semibold text-ink transition-opacity disabled:opacity-30"
            >
              Ask
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function TwinAvatar() {
  return <Image src="/leo-avatar.jpg" alt="" width={56} height={56} className="size-7 shrink-0 rounded-full object-cover" />;
}
