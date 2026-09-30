'use client';

import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MaskLines, Reveal } from '@/components/motion';

const HERO_IMAGE = '/images/florista-bodas.jpg';

const PORQUE_ROWS = [
  {
    title: 'Varias fincas, no una',
    desc: 'Una boda no tiene fecha de repuesto. Consolidamos de varias fincas ecuatorianas a la vez para que un problema en una sola finca no te deje sin flor la semana del evento.',
  },
  {
    title: 'Hablás conmigo',
    desc: 'Cotizás y das seguimiento con la misma persona de principio a fin, justo cuando una fecha fija no da lugar a malentendidos de call center.',
  },
  {
    title: 'Tallo largo, cabeza grande',
    desc: 'Hasta 80 cm, con ficha de apertura, largo de tallo y vida en florero por variedad, para que le prometas a la pareja un centro de mesa o un arco que aguante todo el evento.',
  },
  {
    title: 'Lo que el mercado local no siempre tiene',
    desc: 'Si tu boda tiene una paleta de color específica, pedimos la variedad puntual, aunque no esté en catálogo.',
  },
];

const PARTES_BODA = [
  {
    title: 'Ramo de novia y tocados',
    links: [
      { href: '/catalogo/rosas-garden', label: 'Rosas Garden' },
      { href: '/catalogo/ranunculus', label: 'Ranunculus' },
    ],
  },
  {
    title: 'Centros de mesa',
    links: [
      { href: '/catalogo/rosas', label: 'Rosas' },
      { href: '/catalogo/fillers', label: 'Fillers' },
    ],
  },
  {
    title: 'Arcos y decoración de ceremonia',
    links: [{ href: '/catalogo', label: 'Ver catálogo completo' }],
  },
];

interface Faq {
  question: string;
  answer: string;
}

export default function FloresParaBodasClient({ faqs }: { faqs: Faq[] }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-bone">
        <div className="px-6 pb-20 pt-36 md:px-10 md:pb-28 md:pt-44">
          <div className="mx-auto max-w-[1500px]">
            <Reveal>
              <p className="label mb-6 text-muted">Bodas y Eventos · Costa Rica · Guatemala</p>
            </Reveal>
            <MaskLines
              as="h1"
              lines={['Flor al por mayor para', 'floristas de bodas y eventos']}
              stagger={110}
              className="font-serif text-ink"
              lineClassName="text-[clamp(32px,4.8vw,72px)] font-light leading-[1.08] tracking-[-0.02em]"
            />
            <Reveal delay={220}>
              <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-muted">
                Consolidamos flor ecuatoriana de varias fincas (rosas, rosas garden, ranunculus y
                fillers) y la importamos bajo pedido, para que la floristería que arma un ramo de
                novia o un centro de mesa tenga la variedad y el volumen que el mercado local no
                siempre tiene.
              </p>
            </Reveal>

            <Reveal delay={340}>
              <div className="relative mt-16 aspect-[16/9] overflow-hidden bg-line md:mt-20 md:aspect-[21/9]">
                <Image
                  src={HERO_IMAGE}
                  alt="Florista organizando tallos de flor para una boda"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 1400px"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </div>

        <section className="px-6 py-24 md:px-10 md:py-32">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-16 md:mb-20">
              <Reveal>
                <p className="label mb-6 text-muted">Origen</p>
              </Reveal>
              <MaskLines
                as="h2"
                lines={['Por qué un florista', 'de bodas elige Loleanthe']}
                className="font-serif text-ink"
                lineClassName="text-[clamp(30px,4.2vw,58px)] font-light leading-[1.08] tracking-[-0.02em]"
              />
            </div>

            <div className="border-t border-line">
              {PORQUE_ROWS.map((row, i) => (
                <Reveal key={row.title} delay={i * 80} y={24}>
                  <div className="grid grid-cols-1 gap-3 border-b border-line py-10 md:grid-cols-12 md:gap-8 md:py-14">
                    <h3 className="font-serif text-[clamp(22px,2.4vw,30px)] font-light leading-tight tracking-[-0.01em] text-ink md:col-span-4">
                      {row.title}
                    </h3>
                    <p className="max-w-[58ch] text-[15px] leading-relaxed text-muted md:col-span-8">
                      {row.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-paper px-6 py-24 md:px-10 md:py-32">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-16 md:mb-20">
              <Reveal>
                <p className="label mb-6 text-muted">Catálogo</p>
              </Reveal>
              <MaskLines
                as="h2"
                lines={['Flor para cada', 'parte de tu boda']}
                className="font-serif text-ink"
                lineClassName="text-[clamp(30px,4.2vw,58px)] font-light leading-[1.08] tracking-[-0.02em]"
              />
            </div>

            <div className="grid grid-cols-1 gap-12 border-t border-line pt-12 md:grid-cols-3 md:gap-10">
              {PARTES_BODA.map((block, i) => (
                <Reveal key={block.title} delay={i * 90} y={24}>
                  <div>
                    <h3 className="font-serif text-2xl font-light leading-tight text-ink">{block.title}</h3>
                    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                      {block.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="label border-b border-transparent pb-1 text-muted transition-colors duration-300 hover:border-ink hover:text-ink"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24 md:px-10 md:py-32">
          <div className="mx-auto max-w-[1500px]">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
              <Reveal className="md:col-span-3">
                <p className="label text-muted">Tiempos y temporada</p>
              </Reveal>
              <Reveal delay={100} className="md:col-span-9">
                <p className="max-w-[70ch] text-[15px] leading-relaxed text-muted">
                  Consolidamos e importamos bajo pedido, no mantenemos inventario fijo: el ciclo
                  normal es de 2 a 3 semanas entre que confirmamos tu pedido y que la flor llega a
                  Costa Rica o Guatemala. El precio por tallo es normalmente estable, pero varía
                  según la temporada (por ejemplo, alrededor de San Valentín o Día de la Madre la
                  demanda sube en todo el mercado). Para una fecha de boda, escribinos apenas
                  tengas la paleta de color definida.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 md:px-10 md:py-32">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-14 md:mb-20">
              <MaskLines
                as="h2"
                lines={['Preguntas frecuentes']}
                className="font-serif text-ink"
                lineClassName="text-[clamp(30px,4.2vw,58px)] font-light leading-[1.08] tracking-[-0.02em]"
              />
            </div>

            <div className="border-t border-line">
              {faqs.map((faq, i) => (
                <Reveal key={faq.question} delay={i * 80} y={20}>
                  <div className="grid grid-cols-1 gap-3 border-b border-line py-10 md:grid-cols-12 md:gap-8">
                    <h3 className="font-serif text-xl font-light leading-snug text-ink md:col-span-5">
                      {faq.question}
                    </h3>
                    <p className="max-w-[58ch] text-[15px] leading-relaxed text-muted md:col-span-7">
                      {faq.answer}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line px-6 py-24 text-center md:px-10 md:py-32">
          <div className="mx-auto max-w-[1500px]">
            <Reveal>
              <p className="label mb-8 text-muted">Cotización</p>
            </Reveal>
            <Reveal delay={120}>
              <Link href="/cotizacion" className="label group inline-flex items-center gap-4 text-ink">
                Cotizá tu boda
                <span className="h-px w-10 bg-ink transition-all duration-500 group-hover:w-16" />
              </Link>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
