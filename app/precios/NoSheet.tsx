import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SIN_HOJA_TITULO, destinationInfo, type PriceDestination } from '@/lib/price-destinations';
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from './data';

/**
 * Lo que ve quien abre un enlace de precios que no tiene hoja publicada. Es un
 * 200 con noindex, no un 404: quien llega con el enlace en la mano necesita una
 * página con marca y una salida a WhatsApp, no un error.
 *
 * Nunca muestra la hoja de otro destino ni enlaza a ellas: sería mostrar
 * precios del país equivocado.
 */
export default function NoSheet({ destination }: { destination: PriceDestination }) {
  const info = destinationInfo(destination);
  const para = destination === 'GENERAL' ? '' : ` ${info.deLa}`;
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, quiero los precios${para} de Loleanthe`
  )}`;
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col justify-center bg-bone px-6 pb-20 pt-32 md:px-10">
        <div className="mx-auto w-full max-w-[1400px]">
          <p className="label mb-5 text-muted">{info.eyebrow}</p>
          <h1 className="font-serif text-[clamp(40px,6.5vw,92px)] font-light leading-[0.98] tracking-[-0.02em] text-ink">
            {SIN_HOJA_TITULO}
          </h1>
          <p className="mt-8 max-w-md text-[15px] leading-relaxed text-muted">
            Escríbenos por WhatsApp y te enviamos los precios{para}.
          </p>
          <a href={href} className="label group mt-8 inline-flex items-center gap-3 text-ink">
            WhatsApp {WHATSAPP_DISPLAY}
            <span className="h-px w-8 bg-ink transition-all duration-500 group-hover:w-14" />
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
