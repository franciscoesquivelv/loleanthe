'use client';

import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MaskLines, Reveal, Parallax } from '@/components/motion';

const HERO_IMAGE = '/images/florista-bodas.jpg';

const PORQUE_ROWS = [
  {
    label: 'Suministro',
    title: 'Varias fincas, no una',
    desc: 'Una boda no tiene fecha de repuesto. Consolidamos de varias fincas ecuatorianas a la vez para que un problema en una sola finca no te deje sin flor la semana del evento.',
  },
  {
    label: 'Trato',
    title: 'Hablás conmigo',
    desc: 'Cotizás y das seguimiento con la misma persona de principio a fin, justo cuando una fecha fija no da lugar a malentendidos de call center.',
  },
  {
    label: 'Producto',
    title: 'Tallo largo, cabeza grande',
    desc: 'Hasta 80 cm, con ficha de apertura, largo de tallo y vida en florero por variedad, para que le prometas a la pareja un centro de mesa o un arco que aguante todo el evento.',
  },
  {
    label: 'Selección',
    title: 'Lo que el mercado local no siempre tiene',
    desc: 'Si tu boda tiene una paleta de color específica, pedimos la variedad puntual, aunque no esté en catálogo.',
  },
];

const PARTES_BODA = [
  {
    title: 'Ramo de novia y tocados',
    image: '/images/rosa-garden.jpg',
    links: [
      { href: '/catalogo/rosas-garden', label: 'Rosas Garden' },
      { href: '/catalogo/ranunculus', label: 'Ranunculus' },
    ],
  },
  {
    title: 'Centros de mesa',
    image: '/images/flor-filler-web.jpg',
    links: [
      { href: '/catalogo/rosas', label: 'Rosas' },
      { href: '/catalogo/fillers', label: 'Fillers' },
    ],
  },
  {
    title: 'Arcos y decoración de ceremonia',
    image: '/images/florista-tallos.jpg',
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
      <main className="bg-bone">
        {/* Hero a pantalla completa, mismo tratamiento que el de home: la
            sección de bodas es la puerta de entrada del nicho nuevo, no una
            página secundaria, y se lo dice a un florista antes de pedirle
            que lea nada. */}
        <section className="relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-ink">
          <div className="drift absolute inset-0">
            <Image
              src={HERO_IMAGE}
              alt="Florista organizando tallos de flor para una boda"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-ink/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />

          <div className="relative flex h-full flex-col justify-end px-6 pb-16 md:px-10 md:pb-20">
            <div className="mx-auto w-full max-w-[1500px]">
              <Reveal delay={400} y={14}>
                <p className="label mb-6 text-bone/70">Bodas y Eventos · Costa Rica · Guatemala</p>
              </Reveal>

              <MaskLines
                as="h1"
                lines={['Flor al por mayor para', 'floristas de bodas y eventos']}
                delay={550}
                stagger={130}
                className="font-serif text-bone"
                lineClassName="text-[clamp(38px,7.2vw,104px)] font-light leading-[0.98] tracking-[-0.02em]"
              />

              <div className="mt-10 flex flex-col gap-8 border-t border-bone/20 pt-8 md:flex-row md:items-end md:justify-between">
                <Reveal delay={950} y={18}>
                  <p className="max-w-md text-[15px] leading-relaxed text-bone/75">
                    Consolidamos flor ecuatoriana de varias fincas y la importamos bajo
                    pedido, para que la floristería que arma un ramo de novia o un
                    centro de mesa tenga la variedad y el volumen que el mercado local
                    no siempre tiene.
                  </p>
                </Reveal>
                <Reveal delay={1100} y={18}>
                  <Link href="/cotizacion" className="label group inline-flex items-center gap-4 text-bone">
                    Cotizá tu boda
                    <span className="h-px w-10 bg-bone transition-all duration-500 group-hover:w-16" />
                  </Link>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* Por qué, mismo patrón de 3 columnas que Origen.tsx (label / título
            / descripción), no una versión simplificada de 2. */}
        <section className="px-6 py-24 md:px-10 md:py-40">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-16 md:mb-24">
              <Reveal>
                <p className="label mb-6 text-muted">Origen</p>
              </Reveal>
              <MaskLines
                as="h2"
                lines={['Por qué un florista', 'de bodas elige Loleanthe']}
                className="font-serif text-ink"
                lineClassName="text-[clamp(32px,5vw,72px)] font-light leading-[1.02] tracking-[-0.02em]"
              />
            </div>

            <div className="border-t border-line">
              {PORQUE_ROWS.map((row, i) => (
                <Reveal key={row.title} delay={i * 80} y={24}>
                  <div className="grid grid-cols-1 gap-3 border-b border-line py-10 md:grid-cols-12 md:gap-8 md:py-14">
                    <p className="label pt-1 text-muted md:col-span-2">{row.label}</p>
                    <h3 className="font-serif text-[clamp(22px,2.4vw,30px)] font-light leading-tight tracking-[-0.01em] text-ink md:col-span-4">
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

        {/* Segundo momento a pantalla completa, mismo recurso que Atmosphere
            en home: sin esto, la página es puro texto en columnas desde acá
            hasta el final. */}
        <section className="relative h-[70svh] min-h-[420px] w-full overflow-hidden bg-ink">
          <Parallax speed={0.16} className="absolute inset-x-0 -top-[18%] h-[136%]">
            <div className="relative h-full w-full">
              <Image
                src="/images/atmos-dark.jpg"
                alt="Bodegón floral sobre fondo oscuro"
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </Parallax>
          <div className="absolute inset-0 bg-ink/45" />
          <div className="relative flex h-full items-center px-6 md:px-10">
            <div className="mx-auto w-full max-w-[1500px]">
              <MaskLines
                lines={['Una boda no tiene fecha de repuesto.', 'Consolidamos con margen,', 'para que tu flor llegue lista.']}
                stagger={120}
                className="font-serif text-bone"
                lineClassName="max-w-4xl text-[clamp(26px,4.4vw,58px)] font-light leading-[1.12] tracking-[-0.015em]"
              />
            </div>
          </div>
        </section>

        {/* Flor para cada parte de tu boda: rejilla con foto real, no una
            lista de texto suelta. */}
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

            <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
              {PARTES_BODA.map((block, i) => (
                <Reveal key={block.title} delay={i * 90} y={28}>
                  <div className="group">
                    <div className="relative aspect-[4/5] overflow-hidden bg-line">
                      <Image
                        src={block.image}
                        alt={block.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                      />
                    </div>
                    <h3 className="mt-6 font-serif text-2xl font-light leading-tight text-ink">
                      {block.title}
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
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

        {/* Tiempos y temporada: el dato que más importa para una fecha fija,
            con el peso visual de un dato, no enterrado en un párrafo. */}
        <section className="px-6 py-24 md:px-10 md:py-32">
          <div className="mx-auto max-w-[1500px]">
            <div className="grid grid-cols-1 gap-8 border-t border-line pt-14 md:grid-cols-12 md:gap-8">
              <div className="md:col-span-5">
                <Reveal>
                  <p className="label mb-4 text-muted">Tiempos</p>
                  <p className="font-serif text-[clamp(48px,7vw,96px)] font-light leading-[0.95] tracking-[-0.02em] text-ink">
                    2 a 3<br />semanas
                  </p>
                </Reveal>
              </div>
              <Reveal delay={100} className="md:col-span-7">
                <p className="max-w-[60ch] text-[15px] leading-relaxed text-muted">
                  Consolidamos e importamos bajo pedido, no mantenemos inventario fijo:
                  ese es el ciclo normal entre que confirmamos tu pedido y que la flor
                  llega a Costa Rica o Guatemala. El precio por tallo es normalmente
                  estable, pero varía según la temporada (por ejemplo, alrededor de San
                  Valentín o Día de la Madre la demanda sube en todo el mercado). Para
                  una fecha de boda, escribinos apenas tengas la paleta de color
                  definida.
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
