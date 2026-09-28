'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Observa un elemento una sola vez y le agrega `is-in` al entrar en pantalla. */
function useInView<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/** Aparece desde abajo al entrar en pantalla. `delay` escalona grupos. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article' | 'span';
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <Tag
      ref={ref as never}
      className={`reveal ${inView ? 'is-in' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms`, '--reveal-y': `${y}px` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

/**
 * Cada línea sube desde detrás de su propio borde, escalonadas.
 *
 * `as` por defecto es 'div': un titular visual sin peso semántico. Se usaba
 * así en las cinco plantillas del sitio (home, catálogo, categoría, ficha de
 * flor, cotización), así que ninguna tenía un `<h1>` real (hallazgo de Vera,
 * 28/9). Un `<h1>` (o `<h2>` para un titular de sección, no de página) con
 * varias líneas hijas adentro se sigue leyendo como un solo encabezado para
 * un lector de pantalla o un buscador, así que envolver las líneas en la
 * etiqueta correcta no cambia nada visual, solo la semántica.
 */
export function MaskLines({
  lines,
  className = '',
  lineClassName = '',
  stagger = 110,
  delay = 0,
  as: Tag = 'div',
}: {
  lines: string[];
  className?: string;
  lineClassName?: string;
  stagger?: number;
  delay?: number;
  as?: 'div' | 'h1' | 'h2' | 'h3' | 'p';
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  return (
    <Tag ref={ref as never} className={`${inView ? 'is-in' : ''} ${className}`}>
      {lines.map((line, i) => (
        <span
          key={line + i}
          className={`mask-line ${lineClassName}`}
          style={{ '--reveal-delay': `${delay + i * stagger}ms` } as React.CSSProperties}
        >
          <span>{line}</span>
        </span>
      ))}
    </Tag>
  );
}

/**
 * Desplaza el contenido más lento que la página, así el fondo queda "detrás".
 * `speed` 0.1 a 0.3 es sutil; negativo invierte la dirección.
 */
export function Parallax({
  children,
  speed = 0.18,
  className = '',
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      // Distancia del centro del elemento al centro de la ventana.
      const fromCenter = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${(-fromCenter * speed).toFixed(2)}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [speed]);

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  );
}
