"use client";

import { useEffect, useRef } from "react";

type LatLng = { lat: number; lng: number };
type Vec3 = [number, number, number];

const ORIGIN = { code: "BR", lat: -15.8, lng: -47.9 };
const DESTINATIONS = [
  { code: "MIA", lat: 25.76, lng: -80.19 },
  { code: "NYC", lat: 40.71, lng: -74.0 },
  { code: "SFO", lat: 37.77, lng: -122.42 },
];

const DEG = Math.PI / 180;
const BASE_LNG = -78; // keeps the Americas facing the viewer
const BASE_LAT = 8;

function toVec({ lat, lng }: LatLng): Vec3 {
  const phi = lat * DEG;
  const lambda = lng * DEG;
  return [Math.cos(phi) * Math.cos(lambda), Math.cos(phi) * Math.sin(lambda), Math.sin(phi)];
}

// Spherical interpolation between two unit vectors.
function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const dot = Math.min(Math.max(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1), 1);
  const omega = Math.acos(dot);
  const s = Math.sin(omega);
  const wa = Math.sin((1 - t) * omega) / s;
  const wb = Math.sin(t * omega) / s;
  return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
}

// Land dots are fetched, not bundled: ~37 KB that the first paint doesn't need.
let landVecs: Vec3[] = [];
async function loadLand() {
  if (landVecs.length) return;
  const dots = (await (await fetch("/land-dots.json")).json()) as [number, number][];
  landVecs = dots.map(([lat, lng]) => toVec({ lat, lng }));
}

export function Globe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Canvas can't resolve CSS variables, so read the actual next/font family name.
    const monoFamily =
      getComputedStyle(document.documentElement).getPropertyValue("--font-jetbrains-mono").trim() ||
      "ui-monospace, monospace";
    const origin = toVec(ORIGIN);
    // Each route's arc is fixed in 3D, so it's computed once, not every frame.
    const ARC_STEPS = 32;
    const routes = DESTINATIONS.map((d) => {
      const vec = toVec(d);
      const arc: Vec3[] = [];
      const alphas: string[] = [];
      for (let s = 0; s <= ARC_STEPS; s++) {
        const t = s / ARC_STEPS;
        const base = slerp(origin, vec, t);
        const lift = 1 + Math.sin(Math.PI * t) * 0.22;
        arc.push([base[0] * lift, base[1] * lift, base[2] * lift]);
        alphas.push(`rgba(240,180,92,${(0.15 + 0.45 * Math.sin(Math.PI * t)).toFixed(3)})`);
      }
      return { ...d, vec, arc, alphas };
    });
    const BANDS = 8;
    const bands: number[][] = Array.from({ length: BANDS }, () => []);

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let running = false;
    let dragLng = 0;
    let dragging = false;
    let lastX = 0;
    let start = performance.now();

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    };

    const draw = (now: number) => {
      const elapsed = (now - start) / 1000;
      const sway = reducedMotion ? 0 : Math.sin(elapsed * 0.12) * 14;
      const lambda0 = (BASE_LNG + sway + dragLng) * DEG;
      const phi0 = BASE_LAT * DEG;
      const cosL = Math.cos(lambda0);
      const sinL = Math.sin(lambda0);
      const cosP = Math.cos(phi0);
      const sinP = Math.sin(phi0);

      // Entrance: ease the globe in over the first ~1.6s.
      const introT = reducedMotion ? 1 : Math.min(elapsed / 1.6, 1);
      const intro = 1 - Math.pow(1 - introT, 3);
      const radius = Math.min(width, height) * 0.44 * (0.9 + 0.1 * intro);
      const cx = width / 2;
      const cy = height / 2;

      // Rotate a world vector into screen space. z > 0 faces the viewer.
      const project = (v: Vec3) => {
        const x = v[0] * cosL + v[1] * sinL;
        const y = -v[0] * sinL + v[1] * cosL;
        const z = v[2];
        return {
          sx: cx + radius * y,
          sy: cy - radius * (cosP * z - sinP * x),
          depth: sinP * z + cosP * x,
          onDisk: y * y + (cosP * z - sinP * x) ** 2 <= 1,
        };
      };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = intro;

      // Silhouette ring, like a draftsman's construction circle.
      ctx.strokeStyle = "rgba(148,163,184,0.16)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Land dots, fading toward the limb for depth.
      // Dots are batched into a few depth bands: one fill per band instead of
      // thousands of fillStyle changes, which keeps each frame cheap on phones.
      for (const band of bands) band.length = 0;
      for (const v of landVecs) {
        const p = project(v);
        // Skip dots right at the limb, where they'd bunch into stripes.
        if (p.depth <= 0.12) continue;
        bands[Math.min(BANDS - 1, Math.floor(p.depth * BANDS))].push(p.sx, p.sy);
      }
      bands.forEach((band, b) => {
        if (!band.length) return;
        ctx.fillStyle = `rgba(178,190,210,${0.08 + ((b + 0.5) / BANDS) * 0.6})`;
        ctx.beginPath();
        for (let k = 0; k < band.length; k += 2) ctx.rect(band[k] - 0.8, band[k + 1] - 0.8, 1.6, 1.6);
        ctx.fill();
      });

      // Routes from Brazil, lifted off the surface.
      ctx.lineWidth = 1.2;
      routes.forEach((route, i) => {
        let prev: ReturnType<typeof project> | null = null;
        route.arc.forEach((point, s) => {
          const p = project(point);
          const visible = p.depth > 0 || !p.onDisk;
          if (prev && visible) {
            ctx.strokeStyle = route.alphas[s];
            ctx.beginPath();
            ctx.moveTo(prev.sx, prev.sy);
            ctx.lineTo(p.sx, p.sy);
            ctx.stroke();
          }
          prev = visible ? p : null;
        });

        // A packet travelling along each route, staggered.
        const t = reducedMotion ? 0.5 : ((elapsed * 0.22 + i / routes.length) % 1);
        const base = slerp(origin, route.vec, t);
        const lift = 1 + Math.sin(Math.PI * t) * 0.22;
        const p = project([base[0] * lift, base[1] * lift, base[2] * lift]);
        if (p.depth > 0 || !p.onDisk) {
          const glow = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, 10);
          glow.addColorStop(0, "rgba(247,214,153,0.9)");
          glow.addColorStop(1, "rgba(240,180,92,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // City markers with code labels.
      ctx.font = `500 10px ${monoFamily}`;
      ctx.textBaseline = "middle";
      for (const city of [ORIGIN, ...DESTINATIONS]) {
        const p = project(toVec(city));
        if (p.depth <= 0) continue;
        const isOrigin = city.code === ORIGIN.code;
        ctx.fillStyle = isOrigin ? "#f7d699" : "#f0b45c";
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, isOrigin ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        const label = city.code;
        const tw = ctx.measureText(label).width;
        const lx = p.sx + 8;
        const ly = p.sy - 12;
        ctx.fillStyle = "rgba(13,17,23,0.85)";
        ctx.strokeStyle = "rgba(240,180,92,0.35)";
        ctx.beginPath();
        ctx.roundRect(lx, ly - 8, tw + 10, 16, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#e9ebef";
        ctx.fillText(label, lx + 5, ly);
      }
    };

    // ~30 fps is plenty for a slow sway and halves the work on phones.
    let lastDraw = 0;
    const loop = (now: number) => {
      if (now - lastDraw >= 32) {
        lastDraw = now;
        draw(now);
      }
      if (running) frame = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (running || reducedMotion) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };
    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    let io: IntersectionObserver | undefined;
    let ro: ResizeObserver | undefined;
    let cancelled = false;

    // The globe is decoration, so it waits for the page to finish loading and
    // the main thread to go idle before it fetches its data and starts drawing.
    const boot = async () => {
      await loadLand();
      if (cancelled) return;
      start = performance.now();
      resize();
      draw(start);
      // Only animate while the globe is on screen.
      io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? startLoop() : stopLoop()));
      io.observe(canvas);
      ro = new ResizeObserver(() => {
        resize();
        draw(performance.now());
      });
      ro.observe(canvas);
    };
    let bootTimer = 0;
    const whenIdle = () => {
      bootTimer = window.setTimeout(() => {
        if ("requestIdleCallback" in window) requestIdleCallback(() => void boot(), { timeout: 2000 });
        else void boot();
      }, 600);
    };
    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      dragLng -= (e.clientX - lastX) * 0.3;
      lastX = e.clientX;
      if (reducedMotion) draw(performance.now());
    };
    const onUp = () => {
      dragging = false;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      cancelled = true;
      clearTimeout(bootTimer);
      window.removeEventListener("load", whenIdle);
      stopLoop();
      io?.disconnect();
      ro?.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`h-full w-full cursor-grab touch-pan-y active:cursor-grabbing ${className ?? ""}`}
    />
  );
}
