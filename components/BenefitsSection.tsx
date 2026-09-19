'use client';

import { useEffect, useRef, useState } from 'react';

const features = [
  {
    n: '01',
    title: 'Nunca dependes de una sola finca',
    desc: 'Consolidamos flor de varias fincas ecuatorianas a la vez. Si a una le va mal esa semana por clima o escasez, tu pedido no se queda corto ni cambia de variedad sin avisarte.',
  },
  {
    n: '02',
    title: 'Trato directo conmigo',
    desc: 'Cotizas y das seguimiento con Francisco, no con un call center ni un ticket de soporte. La misma persona conoce tu pedido de principio a fin.',
  },
  {
    n: '03',
    title: 'Tallos más largos',
    desc: 'Hasta 80 cm, para arreglos verticales de impacto que no arma cualquiera.',
  },
  {
    n: '04',
    title: 'Variedades exclusivas',
    desc: 'Acceso a colores, texturas y especies que la mayoría de importadores no trae.',
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
    <section id="nosotros" ref={sectionRef} className="bg-[#2B1620] text-[#FBF7F0] py-24 md:py-32 px-5 md:px-6">
      <div className="max-w-4xl mx-auto">
        <div className={`mb-14 md:mb-20 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="font-body font-bold text-[11px] tracking-[0.24em] uppercase text-[#9C7A3C] mb-4">La diferencia</p>
          <h2 className="font-display font-extrabold text-[clamp(38px,5.5vw,74px)] leading-[0.95]">Por qué Loleanthe</h2>
        </div>

        <div>
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`flex flex-col sm:flex-row gap-4 sm:gap-10 py-10 border-t border-[#A69485]/25 last:border-b transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${150 + i * 110}ms` }}
            >
              <span className="font-display text-3xl md:text-4xl text-[#9C7A3C] shrink-0 sm:w-16">{f.n}</span>
              <div>
                <h3 className="font-display font-bold text-2xl md:text-[28px] mb-3">{f.title}</h3>
                <p className="text-[#B3A395] text-[15px] leading-relaxed max-w-[56ch]">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
