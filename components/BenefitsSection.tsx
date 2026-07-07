'use client';

import { useEffect, useRef, useState } from 'react';

const features = [
  {
    title: 'Tallos más largos',
    desc: 'Nuestras rosas y flores vienen con tallos de hasta 80 cm, permitiendo arreglos verticales de impacto y una presentación inigualable.',
  },
  {
    title: 'Mayor durabilidad',
    desc: 'Nuestras flores mantienen su esplendor hasta por 2 semanas con el cuidado adecuado.',
  },
  {
    title: 'Mayores tamaños',
    desc: 'Rosas de cabeza grande, peonías voluminosas y flores exóticas que no encontrarás en el mercado local.',
  },
  {
    title: 'Variedades exclusivas',
    desc: 'Acceso a colores, texturas y especies que no se consiguen fácilmente.',
  },
];

export default function BenefitsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="nosotros" ref={sectionRef} className="bg-[#1C2A22] text-[#F7F8F4] py-24 md:py-32 px-5 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className={`mb-14 md:mb-16 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="font-body font-bold text-[11px] tracking-[0.24em] uppercase text-[#C56E88] mb-4">La diferencia</p>
          <h2 className="font-display font-extrabold text-[clamp(38px,5.5vw,74px)] leading-[0.95]">Por qué Loleanthe</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`py-10 border-t border-[#8E9C88]/25 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${150 + i * 110}ms` }}
            >
              <div className="w-8 h-[2px] bg-[#C56E88] mb-5" />
              <h3 className="font-display font-bold text-2xl md:text-[26px] mb-3">{f.title}</h3>
              <p className="text-[#a9b4aa] text-[15px] leading-relaxed max-w-[46ch]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
