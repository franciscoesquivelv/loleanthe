'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FlowerCard from '@/components/FlowerCard';
import type { Flower } from '@/lib/types';
import Link from 'next/link';
import { useQuote } from '@/context/QuoteContext';
import { useRouter } from 'next/navigation';

export default function CatalogoClient({ initialFlowers }: { initialFlowers: Flower[] }) {
  const flowers = initialFlowers;
  const [filter, setFilter] = useState<'all' | 'inStock'>('all');
  const { count } = useQuote();
  const router = useRouter();

  const displayed = filter === 'inStock' ? flowers.filter((f) => f.inStock) : flowers;

  return (
    <>
      <Header />
      <main className="pt-24 md:pt-32 pb-16 md:pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          {/* Page header */}
          <div className="text-center mb-10 md:mb-16">
            <p className="font-script text-[#8A3B57] text-2xl md:text-3xl mb-3">Explora</p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-light text-[#1C2A22]">
              Catálogo <em className="italic text-[#8A3B57]">Completo</em>
            </h1>
            <div className="ornament max-w-xs mx-auto mt-5 mb-5">
              <span className="text-[#8A3B57] text-xs tracking-[0.3em] uppercase font-display">Loleanthe Boutique</span>
            </div>
            <p className="text-[#5C6960] max-w-xl mx-auto text-sm leading-relaxed">
              Toda nuestra selección de flores exóticas de alta gama, disponibles para arreglos personalizados y cotizaciones exclusivas.
            </p>
          </div>

          {/* Filters & CTA bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-8 border-b border-[#DADCD1] pb-5">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`font-display text-xs tracking-widest uppercase px-4 py-2 border transition-all ${filter === 'all' ? 'bg-[#1C2A22] text-[#E7E8E0] border-[#1C2A22]' : 'border-[#8E9C88] text-[#5C6960] hover:border-[#8A3B57]'}`}
              >
                Todas ({flowers.length})
              </button>
              <button
                onClick={() => setFilter('inStock')}
                className={`font-display text-xs tracking-widest uppercase px-4 py-2 border transition-all ${filter === 'inStock' ? 'bg-[#1C2A22] text-[#E7E8E0] border-[#1C2A22]' : 'border-[#8E9C88] text-[#5C6960] hover:border-[#8A3B57]'}`}
              >
                Disponibles ({flowers.filter((f) => f.inStock).length})
              </button>
            </div>
            {count > 0 && (
              <button
                onClick={() => router.push('/cotizacion')}
                className="flex items-center gap-2 bg-[#8A3B57] text-[#E7E8E0] px-6 py-2 font-display text-sm tracking-widest uppercase hover:bg-[#1C2A22] transition-all"
              >
                Solicitar cotización
                <span className="bg-[#E7E8E0] text-[#8A3B57] rounded-full w-5 h-5 text-xs flex items-center justify-center font-sans font-bold">
                  {count}
                </span>
              </button>
            )}
          </div>

          {/* Grid */}
          {displayed.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-script text-4xl text-[#8A3B57] mb-4">Próximamente</p>
              <p className="font-display text-2xl text-[#1C2A22] mb-3">El catálogo está en preparación</p>
              <p className="text-[#5C6960] text-sm max-w-sm mx-auto mb-8">
                Estamos cargando nuestra selección exclusiva. Mientras tanto, puedes contactarnos directamente.
              </p>
              <Link
                href="/#contacto"
                className="border border-[#8A3B57] text-[#8A3B57] px-6 py-3 font-display text-sm tracking-widest uppercase hover:bg-[#8A3B57] hover:text-white transition-all"
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
            <Link href="/" className="font-display text-sm tracking-widest uppercase text-[#5C6960] hover:text-[#8A3B57] transition-colors hover-underline">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
