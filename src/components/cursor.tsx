"use client";

import { useEffect, useRef } from "react";

// A dot that tracks the pointer exactly, plus a ring that eases after it.
// Elements can opt into a label with data-cursor="drag" (any short word).
// Only enabled for mouse users who haven't asked for reduced motion.
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const enabled = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!enabled.matches) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const tag = tagRef.current!;
    const label = labelRef.current!;
    document.documentElement.classList.add("has-custom-cursor");

    const target = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let scale = 1;
    let targetScale = 1;
    let visible = false;
    let frame = 0;

    const setState = (el: Element | null) => {
      const labelled = el?.closest<HTMLElement>("[data-cursor]");
      const interactive = el?.closest("a, button, [role='button']");
      const textField = el?.closest("input, textarea");

      if (textField) {
        // Let the native I-beam do its job over text fields.
        dot.style.opacity = "0";
        ring.style.opacity = "0";
        tag.style.opacity = "0";
        return;
      }
      dot.style.opacity = visible ? "1" : "0";
      ring.style.opacity = visible ? "1" : "0";

      if (labelled) {
        // A small blueprint tag beside the ring, styled like the globe's city labels.
        label.textContent = labelled.dataset.cursor ?? "";
        tag.dataset.kind = labelled.dataset.cursor;
        tag.style.opacity = visible ? "1" : "0";
        targetScale = 1.35;
        ring.dataset.mode = "label";
      } else {
        tag.style.opacity = "0";
        targetScale = interactive ? 1.8 : 1;
        ring.dataset.mode = interactive ? "hover" : "idle";
      }
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!visible) {
        visible = true;
        ringPos.x = target.x;
        ringPos.y = target.y;
      }
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
      setState(e.target as Element);
    };
    const onLeave = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
      tag.style.opacity = "0";
    };
    const onDown = () => (targetScale *= 0.8);
    const onUp = (e: PointerEvent) => setState(e.target as Element);

    const tick = () => {
      ringPos.x += (target.x - ringPos.x) * 0.18;
      ringPos.y += (target.y - ringPos.y) * 0.18;
      scale += (targetScale - scale) * 0.2;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      tag.style.transform = `translate3d(${ringPos.x + 22}px, ${ringPos.y + 14}px, 0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
      <div
        ref={ringRef}
        data-mode="idle"
        className="absolute top-0 left-0 size-8 rounded-full border border-amber/60 opacity-0 transition-[opacity,background-color,border-color] duration-200 data-[mode=hover]:border-amber data-[mode=hover]:bg-amber/10 data-[mode=label]:border-amber/90 data-[mode=label]:border-dashed"
      />
      <div
        ref={tagRef}
        className="group absolute top-0 left-0 flex items-center gap-1.5 rounded-[3px] border border-amber/35 bg-ink-raised/85 px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-fg opacity-0 backdrop-blur-sm transition-opacity duration-200"
      >
        {/* Arrows only make sense for draggable things. */}
        <span className="hidden text-amber group-data-[kind=drag]:inline">←</span>
        <span ref={labelRef} />
        <span className="hidden text-amber group-data-[kind=drag]:inline">→</span>
      </div>
      <div
        ref={dotRef}
        className="absolute top-0 left-0 size-1.5 rounded-full bg-amber-soft opacity-0 transition-opacity duration-200"
      />
    </div>
  );
}
