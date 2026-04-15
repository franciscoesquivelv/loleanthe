'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import FlowerCard from './FlowerCard';
import { getPublicFlowers } from '@/lib/flowers';
import type { Flower } from '@/lib/types';

// Static placeholders with real images for when DB is empty
const PLACEHOLDERS: Flower[] = [
  { id: 'p1', name: 'Rosa Garden Spirit', description: 'Rosa de tallo largo con cabeza grande y petales voluminosos. Duracion excepcional de hasta dos semanas.', images: ['/images/flor-portada.png'], inStock: true, archived: false, createdAt: '', updatedAt: '' },
  { id: 'p2', name: 'Ranunculus Pink Amandine', description: 'Ranunculo importado en tono rosado pastel. Perfecto para arreglos de alta delicadeza.', images: ['/images/ranunculus-pink.png'], inStock: true, archived: false, createdAt: '', updatedAt: '' },
  { id: 'p3', name: 'Ranunculus Bianco', description: 'Variedad blanca pura con textura en capas. Un clasico de lujo para ocasiones especiales.', images: ['/images/ranunculus-bianco.png'], inStock: true, archived: false, createdAt: '', updatedAt: '' },
  { id: 'p4', name: 'Ranunculus Butterfly Hestia', description: 'Variedad de ranunculo con degradado unico entre crema y rosa suave. Irrepetible.', images: ['/images/ranunculus-hestia.png'], inStock: true, archived: false, createdAt: '', updatedAt: '' },
  { id: 'p5', name: 'Flor Exotica Filler', description: 'Flores de relleno exoticas que complementan cualquier arreglo con textura y volumen natural.', images: ['/images/flor-filler.png'], inStock: true, archived: false, createdAt: '', updatedAt: '' },
  { id: 'p6', name: 'Ranunculus Amarillo', description: 'Ranunculo en tono amarillo vibrante. Agrega luminosidad y vida a cualquier composicion.', images: ['/images/flor-ranunculus.png'], inStock: true, archived: false, createdAt: '', updatedAt: '' },
];

export default function CatalogPreview() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    getPublicFlowers()
      .then((data) => setFlowers(data.slice(0, 6)))
      .catch(() => setFlowers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const displayFlowers = flowers.length > 0 ? flowers : PLACEHOLDERS;

  return (
    <section id="catalogo" ref={sectionRef} className="py-24 px-6 max-w-7xl mx-auto">
      {/* Section header */}
      <div className={`text-center mb-16 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p className="font-script text-[#B08D6B] text-3xl mb-3">Nuestra coleccion</p>
        <h2 className="font-display text-5xl md:text-6xl font-light text-[#1A130A]">
          Catalogo <em className="italic text-[#B08D6B]">Premium</em>
        </h2>
        <div className="ornament max-w-xs mx-auto mt-6">
          <span className="text-[#B08D6B] text-xs tracking-[0.3em] uppercase font-display">Flores de Excepcion</span>
        </div>
        <p className="mt-6 text-[#7A6654] max-w-xl mx-auto leading-relaxed">
          Cada variedad es cuidadosamente seleccionada por su belleza, tamano y durabilidad. Estandares de calidad que van mucho mas alla de lo convencional.
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="catalog-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] skeleton rounded-sm" />
          ))}
        </div>
      ) : (
        <div className="catalog-grid">
          {displayFlowers.map((flower, i) => (
            <div
              key={flower.id}
              className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <FlowerCard flower={flower} priority={i < 3} />
            </div>
          ))}
        </div>
      )}

      {/* See more */}
      <div className={`flex flex-col items-center mt-16 gap-6 transition-all duration-1000 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <Link
          href="/catalogo"
          className="group flex items-center gap-4 font-display text-lg tracking-widest uppercase text-[#1A130A] hover:text-[#B08D6B] transition-colors duration-300"
        >
          <span className="w-12 h-px bg-current transition-all duration-300 group-hover:w-20" />
          Ver todo el catalogo
          <span className="w-12 h-px bg-current transition-all duration-300 group-hover:w-20" />
        </Link>
        <p className="text-[#7A6654] text-sm font-display tracking-widest uppercase text-xs">
          {flowers.length > 0 ? `${flowers.length}+ variedades disponibles` : 'Coleccion completa disponible'}
        </p>
      </div>
    </section>
  );
}
