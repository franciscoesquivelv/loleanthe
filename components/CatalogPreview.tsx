'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import type { Flower } from '@/lib/types';
import FlowerCard from './FlowerCard';

export default function CatalogPreview({ initialFlowers }: { initialFlowers: Flower[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Selección balanceada: hasta 3 variedades disponibles por categoría, en vez de
  // esconder el catálogo real detrás de 3 tarjetas de categoría.
  const featured = useMemo(() => {
    const perCategory = 3;
    const picks: Flower[] = [];
    for (const category of CATEGORIES) {
      const inCategory = initialFlowers.filter(
        (f) => f.inStock && (f.category ?? '').toLowerCase() === category.label.toLowerCase()
      );
      picks.push(...inCategory.slice(0, perCategory));
    }
    return picks;
  }, [initialFlowers]);

  const displayed = categoryFilter
    ? featured.filter((f) => (f.category ?? '').toLowerCase() === categoryFilter.toLowerCase())
    : featured;

  return (
    <section id="catalogo" ref={sectionRef} className="bg-[#EDE4D8] py-20 md:py-32 px-5 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-10 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div>
            <p className="font-body font-bold text-[11px] tracking-[0.24em] uppercase text-[#9C7A3C] mb-4">La colección</p>
            <h2 className="font-display text-[clamp(34px,5.5vw,74px)] leading-[0.95] text-[#2B1620]">El catálogo</h2>
          </div>
          <p className="text-[#6B5D50] text-sm max-w-sm">
            Variedades reales, disponibles hoy para pedido. Agrega las que te interesen y solicita cotización.
          </p>
        </div>

        <div className={`flex flex-wrap gap-2 mb-8 md:mb-10 transition-all duration-1000 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <button
            onClick={() => setCategoryFilter('')}
            className={`font-body text-xs tracking-wide uppercase px-4 py-2 border transition-all ${categoryFilter === '' ? 'bg-[#2B1620] text-[#EDE4D8] border-[#2B1620]' : 'border-[#A69485] text-[#6B5D50] hover:border-[#9C7A3C]'}`}
          >
            Todas
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategoryFilter(c.label)}
              className={`font-body text-xs tracking-wide uppercase px-4 py-2 border transition-all ${categoryFilter === c.label ? 'bg-[#2B1620] text-[#EDE4D8] border-[#2B1620]' : 'border-[#A69485] text-[#6B5D50] hover:border-[#9C7A3C]'}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className={`catalog-grid transition-all duration-1000 delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {displayed.map((flower, i) => (
            <FlowerCard key={flower.id} flower={flower} priority={i < 3} detailHref={`/catalogo/${flower.id}`} />
          ))}
        </div>

        <div className={`flex justify-center mt-12 md:mt-14 transition-all duration-1000 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Link href="/catalogo" className="group inline-flex items-center gap-3 font-body font-bold text-sm tracking-wide uppercase text-[#2B1620] hover:text-[#9C7A3C] transition-colors">
            Ver todo el catálogo
            <span className="w-10 h-px bg-current transition-all duration-300 group-hover:w-16" />
          </Link>
        </div>
      </div>
    </section>
  );
}
