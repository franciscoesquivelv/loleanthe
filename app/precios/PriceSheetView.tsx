import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Flower } from '@/lib/types';
import type { TipoDeCambio } from '@/lib/exchange-rate';
import { formatoLocal } from '@/lib/exchange-rate';
import type { PriceItem } from '@/lib/priceSheets';
import { stemPriceLabel } from '@/lib/price-sheet-rules';
import { destinationInfo, type PriceDestination } from '@/lib/price-destinations';
import DownloadButton from './DownloadButton';

/**
 * El cuerpo de la hoja de precios, compartido entre los tres destinos
 * (`/precios-cr`, `/precios-gt` y la general `/precios`). La moneda de
 * referencia sale del destino: la general no la tiene y se queda solo en
 * dólares, sin favorecer una moneda sobre otra.
 */
export default function PriceSheetView({
  items,
  flowers,
  title,
  description,
  destination,
  whatsappNumber,
  whatsappDisplay,
  tipoDeCambio,
}: {
  items: PriceItem[];
  flowers: Flower[];
  title: string;
  /** Editable desde el admin (sección Precios). Reemplaza el párrafo que
   *  antes estaba escrito acá mismo en JSX. */
  description: string;
  destination: PriceDestination;
  whatsappNumber: string;
  whatsappDisplay: string;
  tipoDeCambio?: TipoDeCambio;
}) {
  const info = destinationInfo(destination);
  const eyebrow = info.eyebrow;
  const tasa = tipoDeCambio ? (info.country === 'CR' ? tipoDeCambio.crc : tipoDeCambio.gtq) : null;
  const moneda = info.currency && tasa ? { ...info.currency, tasa } : null;
  // Enlace a la ficha de la variedad cuando existe en el catálogo; si no, a su
  // categoría; si tampoco, sin enlace (la tarjeta se renderiza sin `group`,
  // así el hover no promete un clic que no lleva a ningún lado). Antes era un
  // match por nombre contra `catalogName`, que rompió dos veces (un typo en
  // el catálogo, una categoría mal asignada); ahora es un id directo.
  const hrefFor = (item: PriceItem) => {
    if (item.catalogFlowerId) {
      const match = flowers.find((f) => f.id === item.catalogFlowerId);
      if (match) return `/catalogo/${match.id}`;
    }
    if (item.categorySlug) return `/catalogo/${item.categorySlug}`;
    return null;
  };

  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hola, quiero hacer un pedido de la lista de precios${destination === 'GENERAL' ? '' : ` ${info.deLa}`}: ${title}`
  )}`;

  return (
    <>
      <div className="print:hidden">
        <Header />
      </div>

      <main className="min-h-screen bg-bone px-6 pb-20 pt-32 md:px-10 md:pt-40 print:px-2 print:pb-1 print:pt-0">
        <div className="mx-auto max-w-[1400px]">
          {/* Encabezado de la versión impresa: solo el logo */}
          <div className="mb-3 hidden justify-center pt-1 print:flex">
            <Image
              src="/logo-wordmark.png"
              alt="Loleanthe"
              width={200}
              height={73}
              className="h-7 w-auto object-contain"
              style={{ width: 'auto' }}
            />
          </div>

          <div className="price-head pb-12 md:pb-16">
            <p className="label mb-5 text-muted">{eyebrow}</p>
            <h1 className="price-title font-serif text-[clamp(40px,6.5vw,92px)] font-light leading-[0.98] tracking-[-0.02em] text-ink">
              {title}
            </h1>

            <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between print:hidden">
              <p className="max-w-md text-[15px] leading-relaxed text-muted">
                {description}
                {moneda && tipoDeCambio && (
                  <>
                    {' '}El precio en dólares es el real; el de {moneda.name} es una
                    referencia al tipo de cambio de hoy.
                  </>
                )}
              </p>
              <DownloadButton />
            </div>

            {/* Misma descripción, a tamaño de impresión: mejor repetir el
                dato real y editable que mantener un resumen aparte a mano
                que puede quedar desactualizado apenas Francisco cambie el
                párrafo de arriba. */}
            <p className="price-note mt-2 hidden text-[10px] text-muted">
              {description}
              {moneda && tipoDeCambio && ` · ≈ en ${moneda.name} al tipo de cambio de hoy, referencial`}
            </p>
          </div>

          <div className="price-grid grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((item) => {
              const bunch = item.bunchPrice;
              const local = bunch != null && moneda ? formatoLocal(bunch, moneda.tasa, moneda.symbol) : null;
              // Sin cantidad fija de tallos (se vende por peso) no hay precio por tallo.
              const porTallo = stemPriceLabel(item);
              const meta = [item.size, item.stemsPerBunch ? `${item.stemsPerBunch} tallos` : null].filter(Boolean);
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
                    {meta.length > 0 && (
                      <p className="price-meta label mt-2 text-muted">{meta.join(' · ')}</p>
                    )}
                    {item.note && (
                      <p className="price-note-item mt-1 text-[11px] leading-snug text-muted/80">
                        {item.note}
                      </p>
                    )}

                    <div className="price-split mt-4 border-t border-line pt-3">
                      {bunch != null ? (
                        <>
                          <p className="price-bunch font-serif text-2xl font-light leading-none text-ink">
                            ${bunch.toFixed(2)}
                            <span className="label ml-1.5 align-middle text-muted">bunch</span>
                          </p>
                          {local && (
                            <p className="price-local mt-1 text-[12px] text-muted">≈ {local}</p>
                          )}
                          {porTallo && (
                            <p className="price-stem mt-1.5 text-[13px] text-muted">
                              {porTallo.approx ? '≈ ' : ''}${porTallo.text} por tallo
                            </p>
                          )}
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
                // Sin `group`: sin enlace, el hover no debe prometer un clic
                // que no lleva a ningún lado (la foto no hace zoom).
                <article key={item.slug} className="price-card price-reveal bg-paper">
                  {card}
                </article>
              );
            })}
          </div>

          <p className="mt-5 hidden text-right text-[9px] tracking-wide text-muted print:mt-2 print:block">
            WhatsApp {whatsappDisplay}
          </p>

          <div className="mt-16 flex flex-col gap-6 border-t border-line pt-10 md:flex-row md:items-center md:justify-between print:hidden">
            <p className="font-serif text-[clamp(22px,3vw,34px)] font-light leading-tight text-ink">
              ¿Hacemos tu pedido?
            </p>
            <div className="flex flex-wrap items-center gap-10">
              <a href={whatsappHref} className="label group inline-flex items-center gap-3 text-ink">
                WhatsApp {whatsappDisplay}
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
