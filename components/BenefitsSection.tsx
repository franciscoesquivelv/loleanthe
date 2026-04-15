'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const benefits = [
  {
    title: 'Tallos extraordinarios',
    desc: 'Nuestras rosas y flores vienen con tallos que superan los estándares convencionales, permitiendo arreglos verticales de impacto y una presentación inigualable.',
  },
  {
    title: 'Durabilidad excepcional',
    desc: 'Seleccionamos solo variedades de larga vida. Mientras las flores comunes duran 3-5 días, las nuestras mantienen su esplendor hasta por 2 semanas con el cuidado adecuado.',
  },
  {
    title: 'Tamaños únicos',
    desc: 'Rosas de cabeza grande, peonías voluminosas y flores exóticas que no encontrarás en el mercado local. Cada pieza es un elemento decorativo por sí sola.',
  },
  {
    title: 'Variedades exclusivas',
    desc: 'Acceso a colores, texturas y especies que simplemente no existen en la floristería convencional. Tu arreglo será irrepetible.',
  },
];

const stats = [
  { value: '50+', label: 'Variedades exclusivas' },
  { value: '2x', label: 'Mayor duración' },
  { value: '100%', label: 'Selección a mano' },
  { value: 'Único', label: 'Cada arreglo' },
];

const services = [
  {
    number: '01',
    title: 'Arreglos por encargo',
    desc: 'Diseñamos el arreglo perfecto para tu ocasión especial. Bodas, eventos corporativos, aniversarios o simplemente un capricho exquisito.',
    overlay: 'bg-[#2A3D35]/80',
    accent: 'text-[#8BAF9F]',
    image: '/images/servicio-1.jpg',
  },
  {
    number: '02',
    title: 'Selección personalizada',
    desc: 'Cuéntanos tu visión y te ayudamos a elegir las variedades ideales de nuestro catálogo exclusivo para hacer realidad tu arreglo soñado.',
    overlay: 'bg-[#1A130A]/80',
    accent: 'text-[#B08D6B]',
    image: '/images/servicio-2.jpg',
  },
  {
    number: '03',
    title: 'Catálogo estacional',
    desc: 'Nuestras selecciones cambian con las temporadas para garantizarte siempre lo mejor de cada período del año a nivel mundial.',
    overlay: 'bg-[#3D2A1A]/80',
    accent: 'text-[#D4B896]',
    image: '/images/servicio-3.jpg',
  },
];

export default function BenefitsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="nosotros" ref={sectionRef} className="relative overflow-hidden">
      {/* Dark band */}
      <div className="bg-[#1A130A] py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className={`text-center mb-10 md:mb-16 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="font-script text-[#B08D6B] text-2xl md:text-3xl mb-3">Por qué elegirnos</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-[#FAF7F2]">
              La diferencia que se <em className="italic text-[#D4B896]">ve y se siente</em>
            </h2>
          </div>

          {/* Benefits grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#B08D6B]/20">
            {benefits.map((b, i) => (
              <div
                key={i}
                className={`bg-[#1A130A] p-6 md:p-10 hover:bg-[#2C1E10] transition-colors duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${200 + i * 100}ms`, transitionProperty: 'opacity, transform', transitionDuration: '800ms' }}
              >
                <div className="w-8 h-px bg-[#B08D6B] mb-5" />
                <h3 className="font-display text-xl md:text-2xl text-[#FAF7F2] font-medium mb-3">{b.title}</h3>
                <p className="text-[#7A6654] leading-relaxed text-sm">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-px bg-[#B08D6B]/20 mt-px transition-all duration-1000 delay-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            {stats.map((s, i) => (
              <div key={i} className="bg-[#1A130A] py-8 md:py-10 px-6 text-center hover:bg-[#253830] transition-colors duration-300">
                <span className="font-display text-4xl md:text-5xl text-[#B08D6B] font-light">{s.value}</span>
                <p className="text-[#7A6654] text-xs tracking-widest uppercase mt-2 font-display">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Services strip */}
      <div className="bg-[#FAF7F2] py-14 md:py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-10 md:mb-14 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-[#1A130A]">
              Nuestros <em className="italic text-[#B08D6B]">servicios</em>
            </h2>
            <p className="text-[#7A6654] mt-4 max-w-lg mx-auto text-sm leading-relaxed">
              Más allá de las flores, ofrecemos una experiencia completa de floricultura de lujo para ocasiones que merecen ser recordadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {services.map((s, i) => (
              <div
                key={i}
                className={`relative overflow-hidden flex flex-col justify-end min-h-[280px] md:min-h-[380px] group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${900 + i * 100}ms`, transitionProperty: 'opacity, transform', transitionDuration: '800ms' }}
              >
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className={`absolute inset-0 ${s.overlay} transition-opacity duration-300`} />
                <div className="relative z-10 p-6 md:p-8">
                  <span className={`font-display text-4xl md:text-5xl font-light ${s.accent} opacity-40 block mb-3 leading-none`}>{s.number}</span>
                  <div className="w-8 h-px bg-white/30 mb-4" />
                  <h3 className="font-display text-xl md:text-2xl text-[#FAF7F2] font-light mb-2">{s.title}</h3>
                  <p className="text-[#FAF7F2]/70 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
