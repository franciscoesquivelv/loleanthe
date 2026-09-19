'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FlowerCard from '@/components/FlowerCard';
import { MaskLines, Reveal } from '@/components/motion';
import type { Flower } from '@/lib/types';
import type { Category } from '@/lib/categories';

export default function CategoryClient({ category, initialFlowers }: { category: Category; initialFlowers: Flower[] }) {
  const flowers = initialFlowers;
  const [onlyStock, setOnlyStock] = useState(false);

  const displayed = onlyStock ? flowers.filter((f) => f.inStock) : flowers;
  const available = flowers.filter((f) => f.inStock).length;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-bone px-6 pb-24 pt-32 md:px-10 md:pb-40 md:pt-40">
        <div className="mx-auto max-w-[1500px]">
          <nav className="label mb-12 flex flex-wrap items-center gap-3 text-muted md:mb-16">
            <Link href="/catalogo" className="transition-opacity hover:opacity-60">Catálogo</Link>
            <span aria-hidden>/</span>
            <span className="text-ink">{category.label}</span>
          </nav>

          <div className="mb-14 md:mb-20">
            <Reveal>
              <p className="label mb-6 text-muted">
                {flowers.length} {flowers.length === 1 ? 'variedad' : 'variedades'}
              </p>
            </Reveal>
            <MaskLines
              lines={[category.label]}
              className="font-serif text-ink"
              lineClassName="text-[clamp(44px,7vw,104px)] font-light leading-[1] tracking-[-0.02em]"
            />
            <Reveal delay={200}>
              <p className="mt-8 max-w-lg text-[15px] leading-relaxed text-muted">{category.blurb}</p>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <div className="flex items-center gap-8 border-y border-line py-6">
              <button
                onClick={() => setOnlyStock(false)}
                className={`label border-b pb-1 transition-colors duration-300 ${
                  !onlyStock ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                Todas ({flowers.length})
              </button>
              <button
                onClick={() => setOnlyStock(true)}
                className={`label border-b pb-1 transition-colors duration-300 ${
                  onlyStock ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                Disponibles ({available})
              </button>
            </div>
          </Reveal>

          {displayed.length === 0 ? (
            <div className="py-32 text-center">
              <p className="font-serif text-3xl font-light text-ink">
                Estamos cargando {category.label.toLowerCase()}
              </p>
              <Link href="/cotizacion" className="label mt-8 inline-block border-b border-ink pb-1 text-ink">
                Pedir por encargo
              </Link>
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayed.map((flower, i) => (
                <Reveal key={flower.id} delay={(i % 4) * 70} y={32}>
                  <FlowerCard flower={flower} priority={i < 4} detailHref={`/catalogo/${flower.id}`} />
                </Reveal>
              ))}
            </div>
          )}

          <div className="mt-20 border-t border-line pt-10">
            <Link href="/catalogo" className="label group inline-flex items-center gap-4 text-ink">
              <span className="h-px w-10 bg-ink transition-all duration-500 group-hover:w-16" />
              Ver todo el catálogo
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
