'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const benefits = [
  {
    title: 'Tallos extraordinarios',
    desc: 'Nuestras rosas y flores vienen con tallos que superan los estandares convencionales, permitiendo arreglos verticales de impacto y una presentacion inigualable.',
  },
  {
    title: 'Durabilidad excepcional',
    desc: 'Seleccionamos solo variedades de larga vida. Mientras las flores comunes duran 3-5 dias, las nuestras mantienen su esplendor hasta por 2 semanas con el cuidado adecuado.',
  },
  {
    title: 'Tamanos unicos',
    desc: 'Rosas de cabeza grande, peonias voluminosas y flores exoticas que no encontraras en el mercado local. Cada pieza es un elemento decorativo por si sola.',
  },
  {
    title: 'Variedades exclusivas',
    desc: 'Acceso a colores, texturas y especies que simplemente no existen en la floreria convencional. Tu arreglo sera irrepetible.',
  },
];

const stats = [
  { value: '50+', label: 'Variedades exclusivas' },
  { value: '2x', label: 'Mayor duracion' },
  { value: '100%', label: 'Seleccion a mano' },
  { value: 'Unico', label: 'Cada arreglo' },
];

const services = [
  {
    title: 'Arreglos por encargo',
    desc: 'Disenamos el arreglo perfecto para tu ocasion especial. Bodas, eventos corporativos, aniversarios o simplemente un capricho exquisito.',
    image: '/images/artboard-4.png',
  },
  {
    title: 'Seleccion personalizada',
    desc: 'Cuentanos tu vision y te ayudamos a elegir las variedades ideales de nuestro catalogo exclusivo para hacer realidad tu arreglo sonado.',
    image: '/images/artboard-5.png',
  },
  {
    title: 'Catalogo estacional',
    desc: 'Nuestras selecciones cambian con las temporadas para garantizarte siempre lo mejor de cada periodo del ano a nivel mundial.',
    image: '/images/artboard-6.png',
  },
];

export default function BenefitsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="nosotros" ref={sectionRef} className="relative overflow-hidden">
      {/* Dark band */}
      <div className="bg-[#1A130A] py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className={`text-center mb-16 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="font-script text-[#B08D6B] text-3xl mb-3">Por que elegirnos</p>
            <h2 className="font-display text-5xl md:text-6xl font-light text-[#FAF7F2]">
              La diferencia que se <em className="italic text-[#D4B896]">ve y se siente</em>
            </h2>
          </div>

          {/* Benefits grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#B08D6B]/20">
            {benefits.map((b, i) => (
              <div
                key={i}
                className={`bg-[#1A130A] p-10 hover:bg-[#2C1E10] transition-colors duration-300 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${200 + i * 100}ms`, transitionProperty: 'opacity, transform', transitionDuration: '800ms' }}
              >
                <div className="w-8 h-px bg-[#B08D6B] mb-6" />
                <h3 className="font-display text-2xl text-[#FAF7F2] font-medium mb-3">{b.title}</h3>
                <p className="text-[#7A6654] leading-relaxed text-sm">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-px bg-[#B08D6B]/20 mt-px transition-all duration-1000 delay-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            {stats.map((s, i) => (
              <div key={i} className="bg-[#1A130A] py-10 px-6 text-center hover:bg-[#253830] transition-colors duration-300">
                <span className="font-display text-5xl text-[#B08D6B] font-light">{s.value}</span>
                <p className="text-[#7A6654] text-xs tracking-widest uppercase mt-2 font-display">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Services strip */}
      <div className="bg-[#FAF7F2] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-14 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="font-display text-4xl md:text-5xl font-light text-[#1A130A]">
              Nuestros <em className="italic text-[#B08D6B]">servicios</em>
            </h2>
            <p className="text-[#7A6654] mt-4 max-w-lg mx-auto text-sm leading-relaxed">
              Mas alla de las flores, ofrecemos una experiencia completa de floricultura de lujo para ocasiones que merecen ser recordadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((s, i) => (
              <div
                key={i}
                className={`border border-[#EDE0CE] overflow-hidden hover:border-[#B08D6B] transition-all duration-300 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${900 + i * 100}ms`, transitionProperty: 'opacity, transform', transitionDuration: '800ms' }}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#F2EDE4]">
                  <Image
                    src={s.image}
                    alt={s.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl text-[#1A130A] font-medium mb-2 group-hover:text-[#B08D6B] transition-colors">{s.title}</h3>
                  <p className="text-[#7A6654] text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
