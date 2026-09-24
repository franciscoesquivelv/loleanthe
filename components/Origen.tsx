'use client';

import { MaskLines, Reveal } from './motion';

const ROWS = [
  {
    label: 'Suministro',
    title: 'Varias fincas, no una',
    desc: 'Consolidamos de distintas fincas ecuatorianas a la vez para poder garantizar la entrega del producto solicitado.',
  },
  {
    label: 'Trato',
    title: 'Hablas conmigo',
    desc: 'Cotizas y das seguimiento con la misma persona de principio a fin. Sin call center, sin tickets, sin intermediarios.',
  },
  {
    label: 'Producto',
    title: 'Tallo largo, cabeza grande',
    desc: 'Hasta 80 cm. Cada variedad llega con su ficha: apertura, largo de tallo y vida en florero, para que puedas prometerle algo concreto a tu cliente.',
  },
  {
    label: 'Selección',
    title: 'Lo que otros no traen',
    desc: 'Colores, texturas y variedades fuera del surtido habitual del mercado local, y pedidos específicos de lo que no está en catálogo.',
  },
];

export default function Origen() {
  return (
    <section id="origen" className="bg-bone px-6 py-24 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-16 md:mb-24">
          <Reveal>
            <p className="label mb-6 text-muted">Origen</p>
          </Reveal>
          <MaskLines
            lines={['Por qué Loleanthe']}
            className="font-serif text-ink"
            lineClassName="text-[clamp(38px,6vw,86px)] font-light leading-[1] tracking-[-0.02em]"
          />
        </div>

        <div className="border-t border-line">
          {ROWS.map((row, i) => (
            <Reveal key={row.title} delay={i * 80} y={24}>
              <div className="grid grid-cols-1 gap-3 border-b border-line py-10 md:grid-cols-12 md:gap-8 md:py-14">
                <p className="label pt-1 text-muted md:col-span-2">{row.label}</p>
                <h3 className="font-serif text-[clamp(24px,2.6vw,34px)] font-light leading-tight tracking-[-0.01em] text-ink md:col-span-4">
                  {row.title}
                </h3>
                <p className="max-w-[58ch] text-[15px] leading-relaxed text-muted md:col-span-6">
                  {row.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
