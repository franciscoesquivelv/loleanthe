'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES } from '@/lib/categories';
import type { Flower } from '@/lib/types';

export default function CatalogPreview({ initialFlowers }: { initialFlowers: Flower[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const groups = CATEGORIES.map((category) => {
    const flowers = initialFlowers.filter(
      (f) => (f.category ?? '').toLowerCase() === category.label.toLowerCase()
    );
    const withImage = flowers.find((f) => f.images.length > 0);
    return {
      category,
      count: flowers.length,
      image: withImage ? withImage.images[0] : category.fallbackImage,
    };
  });

  return (
    <section id="catalogo" ref={sectionRef} className="bg-[#E7E8E0] py-20 md:py-32 px-5 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div>
            <p className="font-body font-bold text-[11px] tracking-[0.24em] uppercase text-[#8A3B57] mb-4">La colección</p>
            <h2 className="font-display text-[clamp(34px,5.5vw,74px)] leading-[0.95] text-[#1C2A22]">El catálogo</h2>
          </div>
          <p className="text-[#5C6960] text-sm max-w-sm">
            Explora por familia de flor — cada una con su propia selección de variedades.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {groups.map(({ category, count, image }, i) => (
            <Link
              key={category.slug}
              href={`/catalogo/${category.slug}`}
              className={`group relative overflow-hidden aspect-[4/5] sm:aspect-[3/4] transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <Image
                src={image}
                alt={category.label}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                priority={i === 0}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12201A]/85 via-[#12201A]/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                <h3 className="font-display text-[#F7F8F4] text-3xl md:text-4xl leading-none mb-2">
                  {category.label}
                </h3>
                <p className="text-[#dfe4da] text-xs md:text-sm mb-3 max-w-[30ch]">{category.blurb}</p>
                <span className="inline-flex items-center gap-2 font-body font-bold text-[11px] tracking-wide uppercase text-[#F7F8F4]">
                  {count > 0 ? `${count} variedad${count === 1 ? '' : 'es'}` : 'Próximamente'}
                  <span className="w-6 h-px bg-current transition-all duration-300 group-hover:w-10" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className={`flex justify-center mt-12 md:mt-14 transition-all duration-1000 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Link href="/catalogo" className="group inline-flex items-center gap-3 font-body font-bold text-sm tracking-wide uppercase text-[#1C2A22] hover:text-[#8A3B57] transition-colors">
            Ver todo el catálogo
            <span className="w-10 h-px bg-current transition-all duration-300 group-hover:w-16" />
          </Link>
        </div>
      </div>
    </section>
  );
}
