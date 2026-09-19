'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FlowerCard from '@/components/FlowerCard';
import type { Flower } from '@/lib/types';
import type { Category } from '@/lib/categories';
import Link from 'next/link';
import { useQuote } from '@/context/QuoteContext';
import { useRouter } from 'next/navigation';

export default function CategoryClient({ category, initialFlowers }: { category: Category; initialFlowers: Flower[] }) {
  const flowers = initialFlowers;
  const [filter, setFilter] = useState<'all' | 'inStock'>('all');
  const { count } = useQuote();
  const router = useRouter();

  const displayed = filter === 'inStock' ? flowers.filter((f) => f.inStock) : flowers;

  return (
    <>
      <Header />
      <main className="pt-24 md:pt-32 pb-16 md:pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-5 md:px-6">
          {/* Breadcrumb */}
          <nav className="mb-6 md:mb-8 text-xs font-display tracking-widest uppercase text-[#6B5D50]">
            <Link href="/catalogo" className="hover:text-[#9C7A3C] transition-colors">Catálogo</Link>
            <span className="mx-2">/</span>
            <span className="text-[#2B1620]">{category.label}</span>
          </nav>

          {/* Page header */}
          <div className="text-center mb-10 md:mb-16">
            <h1 className="font-display text-4xl md:text-5xl lg:text-7xl text-[#2B1620]">{category.label}</h1>
            <p className="text-[#6B5D50] max-w-xl mx-auto text-sm leading-relaxed mt-4">{category.blurb}</p>
          </div>

          {/* Filters & CTA bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-8 border-b border-[#DDD2C2] pb-5">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`font-display text-xs tracking-widest uppercase px-4 py-2 border transition-all ${filter === 'all' ? 'bg-[#2B1620] text-[#EDE4D8] border-[#2B1620]' : 'border-[#A69485] text-[#6B5D50] hover:border-[#9C7A3C]'}`}
              >
                Todas ({flowers.length})
              </button>
              <button
                onClick={() => setFilter('inStock')}
                className={`font-display text-xs tracking-widest uppercase px-4 py-2 border transition-all ${filter === 'inStock' ? 'bg-[#2B1620] text-[#EDE4D8] border-[#2B1620]' : 'border-[#A69485] text-[#6B5D50] hover:border-[#9C7A3C]'}`}
              >
                Disponibles ({flowers.filter((f) => f.inStock).length})
              </button>
            </div>
            {count > 0 && (
              <button
                onClick={() => router.push('/cotizacion')}
                className="flex items-center gap-2 bg-[#9C7A3C] text-[#EDE4D8] px-6 py-2 font-display text-sm tracking-widest uppercase hover:bg-[#2B1620] transition-all"
              >
                Solicitar cotización
                <span className="bg-[#EDE4D8] text-[#9C7A3C] rounded-full w-5 h-5 text-xs flex items-center justify-center font-body font-bold">
                  {count}
                </span>
              </button>
            )}
          </div>

          {/* Grid */}
          {displayed.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-display text-2xl text-[#2B1620] mb-3">Próximamente</p>
              <p className="text-[#6B5D50] text-sm max-w-sm mx-auto mb-8">
                Estamos cargando la selección de {category.label.toLowerCase()}. Mientras tanto, puedes contactarnos directamente.
              </p>
              <Link
                href="/#contacto"
                className="border border-[#9C7A3C] text-[#9C7A3C] px-6 py-3 font-display text-sm tracking-widest uppercase hover:bg-[#9C7A3C] hover:text-white transition-all"
              >
                Contactar
              </Link>
            </div>
          ) : (
            <div className="catalog-grid">
              {displayed.map((flower, i) => (
                <div
                  key={flower.id}
                  className="opacity-0 translate-y-4"
                  style={{ animation: `fadeInUp 0.6s ease ${i * 60}ms forwards` }}
                >
                  <FlowerCard flower={flower} priority={i < 4} detailHref={`/catalogo/${flower.id}`} />
                </div>
              ))}
            </div>
          )}

          {/* Back */}
          <div className="text-center mt-12 md:mt-16">
            <Link href="/catalogo" className="font-display text-sm tracking-widest uppercase text-[#6B5D50] hover:text-[#9C7A3C] transition-colors hover-underline">
              ← Ver todas las categorías
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
