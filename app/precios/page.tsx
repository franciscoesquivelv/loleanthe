import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPublicFlowersServer } from '@/lib/flowers-server';
import { PRICE_ITEMS, SHIPMENT_TITLE, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from './data';
import DownloadButton from './DownloadButton';

export const metadata: Metadata = {
  title: `Precios · ${SHIPMENT_TITLE}`,
  description: `Precios por bunch y por tallo (USD) de la flor ecuatoriana que traemos en la temporada. Rosas en bunch de 25 tallos, el resto de 10.`,
  alternates: { canonical: '/precios' },
  openGraph: {
    title: `Precios · ${SHIPMENT_TITLE} | Loleanthe`,
    description: 'Precios por bunch y por tallo (USD) de la temporada.',
    url: '/precios',
    images: [{ url: '/images/hero-dark.jpg', width: 1200, height: 630, alt: 'Loleanthe, flor ecuatoriana' }],
  },
};

export default async function PreciosPage() {
  const flowers = await getPublicFlowersServer();

  // Enlace a la ficha de la variedad cuando existe en el catálogo; si no, a su
  // categoría. Las que no están cargadas (crisantemo, larkspur, limonium) se
  // quedan sin enlace en lugar de mandar al visitante a una página vacía.
  const hrefFor = (item: (typeof PRICE_ITEMS)[number]) => {
    if (item.catalogName) {
      const match = flowers.find((f) => f.name.toLowerCase() === item.catalogName!.toLowerCase());
      if (match) return `/catalogo/${match.id}`;
    }
    if (item.categorySlug) return `/catalogo/${item.categorySlug}`;
    return null;
  };

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, quiero hacer un pedido de la lista de precios: ${SHIPMENT_TITLE}`
  )}`;

  return (
    <>
      <div className="print:hidden">
        <Header />
      </div>

      <main className="min-h-screen bg-bone px-6 pb-20 pt-32 md:px-10 md:pt-40 print:px-2 print:pb-1 print:pt-0">
        <div className="mx-auto max-w-[1400px]">
          {/* Encabezado de la versión impresa: solo el logo */}
          <div className="mb-4 hidden justify-center pt-1 print:flex">
            <Image
              src="/logo-wordmark.png"
              alt="Loleanthe"
              width={200}
              height={73}
              className="h-9 w-auto object-contain"
              style={{ width: 'auto' }}
            />
          </div>

          <div className="price-head pb-12 md:pb-16">
            <p className="label mb-5 text-muted">Precios · Próximo envío</p>
            <h1 className="price-title font-serif text-[clamp(40px,6.5vw,92px)] font-light leading-[0.98] tracking-[-0.02em] text-ink">
              {SHIPMENT_TITLE}
            </h1>

            <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between print:hidden">
              <p className="max-w-md text-[15px] leading-relaxed text-muted">
                Precios en dólares (USD). Rosas en bunch de 25 tallos, el resto de 10.
                La mayoría de estas variedades viene en distintos colores, escríbenos
                para ver la disponibilidad de la temporada.
              </p>
              <DownloadButton />
            </div>

            <p className="price-note mt-2 hidden text-[10px] text-muted">
              USD · Rosas: bunch de 25 tallos · Resto: bunch de 10 · Disponibles en distintos colores
            </p>
          </div>

          <div className="price-grid grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {PRICE_ITEMS.map((item) => {
              const bunch = item.price != null ? item.price * item.stemsPerBunch : null;
              const href = hrefFor(item);

              const card = (
                <>
                  <div className="price-photo relative aspect-[4/5] overflow-hidden bg-line">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-serif text-4xl font-light text-muted/50">
                          {item.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="price-body px-4 pb-5 pt-4">
                    <h3 className="price-name font-serif text-lg font-light leading-tight text-ink">
                      {item.name}
                    </h3>
                    <p className="price-meta label mt-2 text-muted">
                      {[item.size, `${item.stemsPerBunch} tallos`].filter(Boolean).join(' · ')}
                    </p>

                    <div className="price-split mt-4 border-t border-line pt-3">
                      {bunch != null ? (
                        <>
                          <p className="price-bunch font-serif text-2xl font-light leading-none text-ink">
                            ${bunch.toFixed(2)}
                            <span className="label ml-1.5 align-middle text-muted">bunch</span>
                          </p>
                          <p className="price-stem mt-1.5 text-[13px] text-muted">
                            ${item.price!.toFixed(2)} por tallo
                          </p>
                        </>
                      ) : (
                        <p className="price-stem text-[13px] leading-snug text-muted">Precio a confirmar</p>
                      )}
                    </div>
                  </div>
                </>
              );

              return href ? (
                <Link key={item.slug} href={href} className="price-card price-reveal group block bg-paper">
                  {card}
                </Link>
              ) : (
                <article key={item.slug} className="price-card price-reveal group bg-paper">
                  {card}
                </article>
              );
            })}
          </div>

          <p className="mt-5 hidden text-right text-[9px] tracking-wide text-muted print:mt-2 print:block">
            WhatsApp {WHATSAPP_DISPLAY}
          </p>

          <div className="mt-16 flex flex-col gap-6 border-t border-line pt-10 md:flex-row md:items-center md:justify-between print:hidden">
            <p className="font-serif text-[clamp(22px,3vw,34px)] font-light leading-tight text-ink">
              ¿Hacemos tu pedido?
            </p>
            <div className="flex flex-wrap items-center gap-10">
              <a href={whatsappHref} className="label group inline-flex items-center gap-3 text-ink">
                WhatsApp {WHATSAPP_DISPLAY}
                <span className="h-px w-8 bg-ink transition-all duration-500 group-hover:w-14" />
              </a>
              <DownloadButton />
            </div>
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}
