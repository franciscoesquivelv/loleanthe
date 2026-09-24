'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { Flower } from '@/lib/types';
import { CATEGORIES } from '@/lib/categories';
import FlowerCard from './FlowerCard';
import { Reveal } from './motion';

export default function Collection({ initialFlowers }: { initialFlowers: Flower[] }) {
  // Dos variedades disponibles por categoría: muestra el surtido real sin
  // convertir la portada en un catálogo completo.
  const featured = useMemo(() => {
    const picks: Flower[] = [];
    for (const category of CATEGORIES) {
      picks.push(
        ...initialFlowers
          .filter((f) => f.inStock && (f.category ?? '').toLowerCase() === category.label.toLowerCase())
          .slice(0, 2)
      );
    }
    return picks;
  }, [initialFlowers]);

  if (featured.length === 0) return null;

  return (
    <section id="catalogo" className="bg-bone px-6 py-24 md:px-10 md:py-40">
      <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-24">
        {/* Columna que se queda fija mientras la rejilla pasa al lado */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <p className="label mb-6 text-muted">La colección</p>
            <h2 className="font-serif text-[clamp(38px,5vw,64px)] font-light leading-[1.02] tracking-[-0.015em] text-ink">
              Lo que traemos
            </h2>
            <p className="mt-7 max-w-sm text-[15px] leading-relaxed text-muted">
              Tenemos una selección amplia de flores, como rosas, ranunculus y flores
              de relleno, en distintos tamaños, colores y texturas. Cada producto
              indica su apertura, el largo del tallo, los colores disponibles y su
              vida en florero.
            </p>
            <Link
              href="/catalogo"
              className="label group mt-10 inline-flex items-center gap-4 text-ink"
            >
              Ver variedades
              <span className="h-px w-10 bg-ink transition-all duration-500 group-hover:w-16" />
            </Link>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
          {featured.map((flower, i) => (
            <Reveal key={flower.id} delay={(i % 3) * 90} y={36}>
              <FlowerCard flower={flower} priority={i < 2} detailHref={`/catalogo/${flower.id}`} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
