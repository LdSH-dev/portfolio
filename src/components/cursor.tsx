"use client";

import { useEffect, useRef } from "react";

// The pointer itself is a native CSS cursor (see globals.css), so it never
// lags. This component only adds a small blueprint tag beside it, saying what
// a click will do: data-cursor="word" on any element, plus a few defaults.
const implicitLabel = (el: Element): string | null => {
  const labelled = el.closest<HTMLElement>("[data-cursor]");
  if (labelled) return labelled.dataset.cursor ?? null;
  const link = el.closest("a");
  if (link?.hasAttribute("download")) return "↓ pdf";
  if (link?.getAttribute("href")?.startsWith("mailto:")) return "email";
  if (link?.target === "_blank") return "open ↗";
  const toggle = el.closest("button[aria-expanded]");
  if (toggle) return toggle.getAttribute("aria-expanded") === "true" ? "close" : "expand";
  return null;
};

export function Cursor() {
  const tagRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const tag = tagRef.current!;
    const label = labelRef.current!;
    document.documentElement.classList.add("has-custom-cursor");

    const show = (el: Element | null) => {
      const text = el && !el.closest("input, textarea, [disabled]") ? implicitLabel(el) : null;
      if (!text) {
        tag.style.opacity = "0";
        return;
      }
      label.textContent = text;
      tag.dataset.kind = text;
      tag.style.opacity = "1";
    };

    const onMove = (e: PointerEvent) => {
      tag.style.transform = `translate3d(${e.clientX + 18}px, ${e.clientY + 20}px, 0)`;
      show(e.target as Element);
    };
    const onLeave = () => (tag.style.opacity = "0");
    // Labels like expand/close flip on click.
    const onUp = (e: PointerEvent) => requestAnimationFrame(() => show(e.target as Element));

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={tagRef}
      aria-hidden
      className="group pointer-events-none fixed top-0 left-0 z-[70] flex items-center gap-1.5 rounded-[3px] border border-amber/40 bg-ink-raised/90 px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-fg opacity-0 shadow-[0_6px_20px_rgb(0_0_0/0.25)] backdrop-blur-sm transition-opacity duration-150"
    >
      {/* Arrows only make sense for draggable things. */}
      <span className="hidden text-amber group-data-[kind=drag]:inline">←</span>
      <span ref={labelRef} />
      <span className="hidden text-amber group-data-[kind=drag]:inline">→</span>
    </div>
  );
}
