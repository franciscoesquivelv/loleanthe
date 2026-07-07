'use client';

import { useEffect, useRef } from 'react';

// Living element: golden pollen motes drifting upward with a randomized,
// never-repeating loop. Canvas so it stays cheap on mobile.
export default function Pollen() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;

    interface Mote {
      x: number; y: number; r: number; vx: number; vy: number;
      a: number; sway: number; phase: number; hue: number;
    }
    let motes: Mote[] = [];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    function build() {
      // Particle count scales with area but stays light on phones.
      const count = Math.max(18, Math.min(80, Math.round((w * h) / 26000)));
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: rand(0.8, 3),
        vx: rand(-0.14, 0.14),
        vy: rand(-0.34, -0.07),
        a: rand(0.25, 0.8),
        sway: rand(0.3, 1.1),
        phase: Math.random() * Math.PI * 2,
        hue: rand(40, 50),
      }));
    }

    function resize() {
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function frame() {
      t += 1;
      ctx!.clearRect(0, 0, w, h);
      for (const m of motes) {
        if (!reduce) {
          m.x += m.vx + Math.sin(t * 0.01 + m.phase) * m.sway * 0.16;
          m.y += m.vy;
          if (m.y < -6) { m.y = h + 6; m.x = Math.random() * w; }
          if (m.x < -6) m.x = w + 6;
          else if (m.x > w + 6) m.x = -6;
        }
        ctx!.beginPath();
        ctx!.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${m.hue}, 85%, 52%, ${m.a})`;
        ctx!.shadowColor = `hsla(${m.hue}, 85%, 48%, ${m.a})`;
        ctx!.shadowBlur = m.r * 2.2;
        ctx!.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    frame();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 z-[6] pointer-events-none" aria-hidden="true" />;
}
