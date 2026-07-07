'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import FlowerCard from './FlowerCard';
import type { Flower } from '@/lib/types';

const PLACEHOLDERS: Flower[] = [
  { id: 'p1', name: 'Rosa Garden Spirit', description: 'Rosa de tallo largo con cabeza grande y pétalos voluminosos. Duración excepcional de hasta dos semanas.', images: ['/images/flor-portada.png'], inStock: true, archived: false, createdAt: '', updatedAt: '' },
  { id: 'p2', name: 'Ranunculus Pink Amandine', description: 'Ranúnculo importado en tono rosado pastel. Perfecto para arreglos de alta delicadeza.', images: ['/images/ranunculus-pink.png'], inStock: true, archived: false, createdAt: '', updatedAt: '' },
  { id: 'p3', name: 'Ranunculus Bianco', description: 'Variedad blanca pura con textura en capas. Un clásico de lujo para ocasiones especiales.', images: ['/images/ranunculus-bianco.png'], inStock: true, archived: false, createdAt: '', updatedAt: '' },
  { id: 'p4', name: 'Ranunculus Butterfly Hestia', description: 'Variedad de ranúnculo con degradado único entre crema y rosa suave. Irrepetible.', images: ['/images/ranunculus-hestia.png'], inStock: true, archived: false, createdAt: '', updatedAt: '' },
  { id: 'p5', name: 'Flor Exótica Filler', description: 'Flores de relleno exóticas que complementan cualquier arreglo con textura y volumen natural.', images: ['/images/flor-filler.png'], inStock: true, archived: false, createdAt: '', updatedAt: '' },
  { id: 'p6', name: 'Ranunculus Amarillo', description: 'Ranúnculo en tono amarillo vibrante. Agrega luminosidad y vida a cualquier composición.', images: ['/images/flor-ranunculus.png'], inStock: true, archived: false, createdAt: '', updatedAt: '' },
];

export default function CatalogPreview({ initialFlowers }: { initialFlowers: Flower[] }) {
  const flowers = initialFlowers.slice(0, 6);
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

  const displayFlowers = flowers.length > 0 ? flowers : PLACEHOLDERS;

  return (
    <section id="catalogo" ref={sectionRef} className="bg-[#E7E8E0] py-24 md:py-32 px-5 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div>
            <p className="font-body font-bold text-[11px] tracking-[0.24em] uppercase text-[#8A3B57] mb-4">La colección</p>
            <h2 className="font-display font-extrabold text-[clamp(38px,5.5vw,74px)] leading-[0.95] text-[#1C2A22]">El catálogo</h2>
          </div>
          <p className="text-[#5C6960] text-sm max-w-sm">
            Cada variedad, seleccionada por su belleza, tamaño y durabilidad — mucho más allá de lo convencional.
          </p>
        </div>

        <div className="catalog-grid">
          {displayFlowers.map((flower, i) => (
            <div
              key={flower.id}
              className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <FlowerCard flower={flower} priority={i < 2} detailHref={flowers.length > 0 ? `/catalogo/${flower.id}` : undefined} />
            </div>
          ))}
        </div>

        <div className={`flex justify-center mt-14 transition-all duration-1000 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Link href="/catalogo" className="group inline-flex items-center gap-3 font-body font-bold text-sm tracking-wide uppercase text-[#1C2A22] hover:text-[#8A3B57] transition-colors">
            Ver todo el catálogo
            <span className="w-10 h-px bg-current transition-all duration-300 group-hover:w-16" />
          </Link>
        </div>
      </div>
    </section>
  );
}
