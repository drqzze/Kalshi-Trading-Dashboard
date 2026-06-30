"use client";

import { useEffect, useRef } from "react";

// Mulberry32 PRNG so the field is identical on every render/reload.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Star = {
  x: number;
  y: number;
  r: number;
  baseOpacity: number;
  phase: number;
  speed: number;
};

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const ctxOrNull = canvas.getContext("2d");
    if (!ctxOrNull) return;
    const ctx: CanvasRenderingContext2D = ctxOrNull;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function buildStars() {
      const rand = mulberry32(1337);
      const density = 0.00012;
      const count = Math.floor(width * height * density);
      stars = Array.from({ length: count }, () => ({
        x: rand() * width,
        y: rand() * height,
        r: rand() * 1.1 + 0.3,
        baseOpacity: rand() * 0.5 + 0.15,
        phase: rand() * Math.PI * 2,
        speed: rand() * 0.4 + 0.15,
      }));
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    }

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    function draw(t: number) {
      ctx.clearRect(0, 0, width, height);
      const time = t / 1000;
      for (const s of stars) {
        const flicker = reduceMotion
          ? 0
          : Math.sin(time * s.speed + s.phase) * 0.35;
        const opacity = Math.max(0.05, Math.min(1, s.baseOpacity + flicker));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 230, 245, ${opacity})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-void">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% -10%, color-mix(in srgb, var(--nebula) 14%, transparent), transparent), radial-gradient(ellipse 60% 40% at 90% 10%, color-mix(in srgb, var(--amber) 8%, transparent), transparent)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
