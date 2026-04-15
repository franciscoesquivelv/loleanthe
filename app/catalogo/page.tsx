'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FlowerCard from '@/components/FlowerCard';
import { getPublicFlowers } from '@/lib/flowers';
import type { Flower } from '@/lib/types';
import Link from 'next/link';
import { useQuote } from '@/context/QuoteContext';
import { useRouter } from 'next/navigation';

export default function CatalogoPage() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'inStock'>('all');
  const { count } = useQuote();
  const router = useRouter();

  useEffect(() => {
    getPublicFlowers()
      .then(setFlowers)
      .finally(() => setLoading(false));
  }, []);

  const displayed = filter === 'inStock' ? flowers.filter((f) => f.inStock) : flowers;

  return (
    <>
      <Header />
      <main className="pt-24 md:pt-32 pb-16 md:pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          {/* Page header */}
          <div className="text-center mb-10 md:mb-16">
            <p className="font-script text-[#B08D6B] text-2xl md:text-3xl mb-3">Explora</p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-light text-[#1A130A]">
              Catálogo <em className="italic text-[#B08D6B]">Completo</em>
            </h1>
            <div className="ornament max-w-xs mx-auto mt-5 mb-5">
              <span className="text-[#B08D6B] text-xs tracking-[0.3em] uppercase font-display">Loleanthe Boutique</span>
            </div>
            <p className="text-[#7A6654] max-w-xl mx-auto text-sm leading-relaxed">
              Toda nuestra selección de flores exóticas de alta gama, disponibles para arreglos personalizados y cotizaciones exclusivas.
            </p>
          </div>

          {/* Filters & CTA bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-8 border-b border-[#EDE0CE] pb-5">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`font-display text-xs tracking-widest uppercase px-4 py-2 border transition-all ${filter === 'all' ? 'bg-[#1A130A] text-[#FAF7F2] border-[#1A130A]' : 'border-[#D4B896] text-[#7A6654] hover:border-[#B08D6B]'}`}
              >
                Todas ({flowers.length})
              </button>
              <button
                onClick={() => setFilter('inStock')}
                className={`font-display text-xs tracking-widest uppercase px-4 py-2 border transition-all ${filter === 'inStock' ? 'bg-[#1A130A] text-[#FAF7F2] border-[#1A130A]' : 'border-[#D4B896] text-[#7A6654] hover:border-[#B08D6B]'}`}
              >
                Disponibles ({flowers.filter((f) => f.inStock).length})
              </button>
            </div>
            {count > 0 && (
              <button
                onClick={() => router.push('/cotizacion')}
                className="flex items-center gap-2 bg-[#B08D6B] text-[#FAF7F2] px-6 py-2 font-display text-sm tracking-widest uppercase hover:bg-[#1A130A] transition-all"
              >
                Solicitar cotización
                <span className="bg-[#FAF7F2] text-[#B08D6B] rounded-full w-5 h-5 text-xs flex items-center justify-center font-sans font-bold">
                  {count}
                </span>
              </button>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="catalog-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] skeleton" />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-script text-4xl text-[#B08D6B] mb-4">Próximamente</p>
              <p className="font-display text-2xl text-[#1A130A] mb-3">El catálogo está en preparación</p>
              <p className="text-[#7A6654] text-sm max-w-sm mx-auto mb-8">
                Estamos cargando nuestra selección exclusiva. Mientras tanto, puedes contactarnos directamente.
              </p>
              <Link
                href="/#contacto"
                className="border border-[#B08D6B] text-[#B08D6B] px-6 py-3 font-display text-sm tracking-widest uppercase hover:bg-[#B08D6B] hover:text-white transition-all"
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
                  <FlowerCard flower={flower} priority={i < 4} />
                </div>
              ))}
            </div>
          )}

          {/* Back */}
          <div className="text-center mt-12 md:mt-16">
            <Link href="/" className="font-display text-sm tracking-widest uppercase text-[#7A6654] hover:text-[#B08D6B] transition-colors hover-underline">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
