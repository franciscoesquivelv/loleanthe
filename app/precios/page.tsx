import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PRICE_ITEMS, SHIPMENT_TITLE, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from './data';

export const metadata: Metadata = {
  title: `Precios — ${SHIPMENT_TITLE}`,
  description: `Lista de precios por tallo (USD) de la selección exclusiva de Loleanthe para ${SHIPMENT_TITLE}.`,
  alternates: { canonical: '/precios' },
  openGraph: {
    title: `Precios — ${SHIPMENT_TITLE} | Loleanthe`,
    description: 'Lista de precios por tallo (USD) — selección exclusiva de Loleanthe.',
    url: '/precios',
  },
};

export default function PreciosPage() {
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, quiero hacer un pedido de la lista de precios — ${SHIPMENT_TITLE}`
  )}`;

  return (
    <main className="min-h-screen bg-[#F2EFE8]">
      <header className="print:hidden flex items-center justify-between px-6 md:px-10 py-6">
        <Link href="/" aria-label="Loleanthe — inicio">
          <Image
            src="/logo.png"
            alt="Loleanthe"
            width={160}
            height={74}
            className="h-9 w-auto object-contain"
            style={{ width: 'auto' }}
          />
        </Link>
        <Link
          href="/catalogo"
          className="font-body font-medium text-xs tracking-widest uppercase text-[#7B7369] hover:text-[#7B7369] transition-colors hover-underline"
        >
          Ver catálogo completo
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-6 md:px-10 pb-16 md:pb-20 print:px-3 print:pb-2">
        <div className="hidden print:flex justify-center pt-2 mb-3">
          <Image
            src="/logo.png"
            alt="Loleanthe"
            width={160}
            height={74}
            className="h-10 w-auto object-contain"
            style={{ width: 'auto' }}
          />
        </div>

        <div className="text-center pt-2 md:pt-8 pb-12 md:pb-16 print:pt-0 print:pb-3">
          <p className="font-display italic text-[#7B7369] text-2xl md:text-3xl mb-2">Precios</p>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-light text-[#12100E] leading-[1.05]">
            <em className="italic text-[#7B7369]">{SHIPMENT_TITLE}</em>
          </h1>
          <div className="price-ornament ornament max-w-xs mx-auto mt-6 mb-5">
            <span className="text-[#7B7369] text-xs tracking-[0.3em] uppercase font-display">Loleanthe</span>
          </div>
          <p className="print:hidden text-[#7B7369] max-w-md mx-auto text-sm leading-relaxed">
            Selección exclusiva para el próximo envío — precio por tallo, en dólares (USD).
          </p>
        </div>

        <div className="price-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {PRICE_ITEMS.map((item, i) => (
            <div
              key={item.slug}
              className="price-reveal opacity-0 translate-y-4"
              style={{ animation: `fadeInUp 0.6s ease ${i * 60}ms forwards` }}
            >
              <article className="price-card group bg-[#FBF9F5] overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_rgba(28,42,34,0.14)]">
                <div className="relative aspect-[4/5] overflow-hidden">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E8E3DA] to-[#C9C2B6]">
                      <span className="font-display text-6xl text-[#A39C92]/70">{item.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="p-3.5 md:p-4 print:p-2 border-t border-[#E8E3DA] text-center">
                  <h3 className="font-display font-bold text-base md:text-lg text-[#12100E] leading-tight">{item.name}</h3>
                  <p className="text-[#7B7369] text-xs mt-0.5 tracking-wide">{item.size}</p>
                  <p className="font-display text-xl md:text-2xl text-[#7B7369] mt-2">
                    ${item.price.toFixed(2)}
                    <span className="text-[11px] text-[#7B7369] font-body"> / tallo</span>
                  </p>
                </div>
              </article>
            </div>
          ))}
        </div>

        <p className="hidden print:block text-right text-[11px] text-[#7B7369] tracking-wide mt-4">
          WhatsApp {WHATSAPP_DISPLAY}
        </p>
      </div>

      <footer className="price-footer print:hidden bg-[#12100E] text-[#FBF9F5] py-14 md:py-16 px-6 text-center">
        <p className="font-body font-bold text-[11px] tracking-[0.24em] uppercase text-[#7B7369] mb-3">¿Hacemos tu pedido?</p>
        <p className="font-display text-2xl md:text-3xl mb-7">Escríbenos por WhatsApp</p>
        <a
          href={whatsappHref}
          className="inline-block bg-[#7B7369] text-[#FBF9F5] px-8 py-4 font-body font-bold tracking-wide text-sm uppercase hover:bg-[#7B7369] transition-colors"
        >
          Escribir por WhatsApp
        </a>
        <p className="font-body text-sm text-[#A39C92] mt-5 tracking-wide">{WHATSAPP_DISPLAY}</p>
      </footer>
    </main>
  );
}
