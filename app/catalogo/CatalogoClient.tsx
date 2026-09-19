'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FlowerCard from '@/components/FlowerCard';
import { MaskLines, Reveal } from '@/components/motion';
import type { Flower } from '@/lib/types';
import { APERTURAS } from '@/lib/types';
import { CATEGORIES } from '@/lib/categories';
import { bucketsForColors, type ColorBucket } from '@/lib/colors';

const BUCKET_SWATCH: Record<ColorBucket, string> = {
  Rojo: '#B33A3A',
  Rosa: '#D4708C',
  Naranja: '#D98842',
  Amarillo: '#D9B441',
  Verde: '#7E9464',
  Azul: '#5B6E9C',
  Morado: '#8A6A9E',
  Blanco: '#EFEBE3',
};

const chip = (active: boolean) =>
  `label border-b pb-1 transition-colors duration-300 ${
    active ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
  }`;

export default function CatalogoClient({ initialFlowers }: { initialFlowers: Flower[] }) {
  const flowers = initialFlowers;
  const [stock, setStock] = useState<'all' | 'inStock'>('all');
  const [category, setCategory] = useState('');
  const [apertura, setApertura] = useState('');
  const [color, setColor] = useState<ColorBucket | ''>('');

  const availableAperturas = useMemo(
    () => APERTURAS.filter((a) => flowers.some((f) => f.apertura === a)),
    [flowers]
  );
  const availableColors = useMemo(() => {
    const present = new Set<ColorBucket>();
    flowers.forEach((f) => bucketsForColors(f.colors).forEach((b) => present.add(b)));
    return Array.from(present);
  }, [flowers]);

  const hasFilters = stock !== 'all' || category !== '' || apertura !== '' || color !== '';
  const clearAll = () => {
    setStock('all');
    setCategory('');
    setApertura('');
    setColor('');
  };

  const displayed = flowers.filter((f) => {
    if (stock === 'inStock' && !f.inStock) return false;
    if (category && (f.category ?? '').toLowerCase() !== category.toLowerCase()) return false;
    if (apertura && f.apertura !== apertura) return false;
    if (color && !bucketsForColors(f.colors).includes(color)) return false;
    return true;
  });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-bone px-6 pb-24 pt-36 md:px-10 md:pb-40 md:pt-44">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-14 md:mb-20">
            <Reveal>
              <p className="label mb-6 text-muted">
                {flowers.length} variedades · Costa Rica y Guatemala
              </p>
            </Reveal>
            <MaskLines
              lines={['Catálogo']}
              className="font-serif text-ink"
              lineClassName="text-[clamp(44px,7vw,104px)] font-light leading-[1] tracking-[-0.02em]"
            />
            <Reveal delay={200}>
              <p className="mt-8 max-w-lg text-[15px] leading-relaxed text-muted">
                Lo que normalmente manejamos. Agrega lo que te interese y pide cotización —
                si buscas algo que no está aquí, también lo conseguimos.
              </p>
            </Reveal>
          </div>

          {/* Filtros */}
          <Reveal delay={120}>
            <div className="flex flex-col gap-6 border-y border-line py-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <button onClick={() => setStock(stock === 'inStock' ? 'all' : 'inStock')} className={chip(stock === 'inStock')}>
                  Solo disponibles
                </button>

                <span className="h-4 w-px bg-line" aria-hidden />

                <button onClick={() => setCategory('')} className={chip(category === '')}>
                  Todas
                </button>
                {CATEGORIES.map((c) => (
                  <button key={c.slug} onClick={() => setCategory(c.label)} className={chip(category === c.label)}>
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                {availableAperturas.length > 0 && (
                  <select
                    value={apertura}
                    onChange={(e) => setApertura(e.target.value)}
                    className="label border-b border-line bg-transparent pb-1 text-muted focus:border-ink focus:text-ink"
                  >
                    <option value="">Apertura</option>
                    {availableAperturas.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                )}

                {availableColors.length > 0 && (
                  <div className="flex items-center gap-2">
                    {availableColors.map((bucket) => (
                      <button
                        key={bucket}
                        onClick={() => setColor((prev) => (prev === bucket ? '' : bucket))}
                        title={bucket}
                        aria-label={`Filtrar por ${bucket}`}
                        className={`h-4 w-4 rounded-full transition-all duration-300 ${
                          color === bucket ? 'ring-1 ring-ink ring-offset-4 ring-offset-bone' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: BUCKET_SWATCH[bucket] }}
                      />
                    ))}
                  </div>
                )}

                {hasFilters && (
                  <button onClick={clearAll} className="label text-muted underline underline-offset-4 hover:text-ink">
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </Reveal>

          {/* Rejilla */}
          {flowers.length === 0 ? (
            <div className="py-32 text-center">
              <p className="font-serif text-3xl font-light text-ink">El catálogo está en preparación</p>
              <Link href="/cotizacion" className="label mt-8 inline-block border-b border-ink pb-1 text-ink">
                Contactar
              </Link>
            </div>
          ) : displayed.length === 0 ? (
            <div className="py-32 text-center">
              <p className="font-serif text-3xl font-light text-ink">Nada coincide con estos filtros</p>
              <button onClick={clearAll} className="label mt-8 border-b border-ink pb-1 text-ink">
                Limpiar filtros
              </button>
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
        </div>
      </main>
      <Footer />
    </>
  );
}
