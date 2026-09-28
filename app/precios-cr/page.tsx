import type { Metadata } from 'next';
import { getPublicFlowersServer } from '@/lib/flowers-server';
import { getTipoDeCambio } from '@/lib/exchange-rate';
import { getPublishedPriceSheetServer } from '@/lib/priceSheets-server';
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from '../precios/data';
import PriceSheetView from '../precios/PriceSheetView';

// Enlace directo para clientes de Costa Rica, no una sección del sitio: no va
// en el nav ni se indexa. El precio por tallo usa el override de
// `priceByCountry.CR` cuando existe; donde no hay override, usa el general.
export async function generateMetadata(): Promise<Metadata> {
  const sheet = await getPublishedPriceSheetServer();
  const title = sheet ? `Precios Costa Rica · ${sheet.title}` : 'Precios Costa Rica';
  const description = sheet?.description || 'Precios por bunch y por tallo (USD) para Costa Rica.';
  return {
    title,
    description,
    alternates: { canonical: '/precios-cr' },
    robots: { index: false, follow: false },
    openGraph: {
      title: `${title} | Loleanthe`,
      description,
      url: '/precios-cr',
      images: [{ url: '/images/hero-dark.jpg', width: 1200, height: 630, alt: 'Loleanthe, flor ecuatoriana' }],
    },
  };
}

export default async function PreciosCostaRicaPage() {
  const [flowers, tipoDeCambio, sheet] = await Promise.all([
    getPublicFlowersServer(),
    getTipoDeCambio(),
    getPublishedPriceSheetServer(),
  ]);

  if (!sheet) {
    return (
      <p className="flex min-h-screen items-center justify-center bg-bone px-6 text-center text-[15px] text-muted">
        No hay una lista de precios publicada en este momento. Escríbenos por WhatsApp para cotizar.
      </p>
    );
  }

  return (
    <PriceSheetView
      items={sheet.items}
      flowers={flowers}
      title={sheet.title}
      description={sheet.description}
      eyebrow="Precios · Costa Rica"
      whatsappNumber={WHATSAPP_NUMBER}
      whatsappDisplay={WHATSAPP_DISPLAY}
      country="CR"
      tipoDeCambio={tipoDeCambio}
    />
  );
}
