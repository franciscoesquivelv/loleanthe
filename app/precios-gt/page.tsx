import type { Metadata } from 'next';
import { getPublicFlowersServer } from '@/lib/flowers-server';
import { getTipoDeCambio } from '@/lib/exchange-rate';
import { getPublishedPriceSheetServer } from '@/lib/priceSheets-server';
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from '../precios/data';
import PriceSheetView from '../precios/PriceSheetView';

// Enlace directo para clientes de Guatemala, no una sección del sitio: no va
// en el nav ni se indexa. El precio por tallo usa el override de
// `priceByCountry.GT` cuando existe; donde no hay override, usa el general.
export async function generateMetadata(): Promise<Metadata> {
  const sheet = await getPublishedPriceSheetServer();
  const title = sheet ? `Precios Guatemala · ${sheet.title}` : 'Precios Guatemala';
  const description = sheet?.description || 'Precios por bunch y por tallo (USD) para Guatemala.';
  return {
    title,
    description,
    alternates: { canonical: '/precios-gt' },
    robots: { index: false, follow: false },
    openGraph: {
      title: `${title} | Loleanthe`,
      description,
      url: '/precios-gt',
      images: [{ url: '/images/hero-dark.jpg', width: 1200, height: 630, alt: 'Loleanthe, flor ecuatoriana' }],
    },
  };
}

export default async function PreciosGuatemalaPage() {
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
      eyebrow="Precios · Guatemala"
      whatsappNumber={WHATSAPP_NUMBER}
      whatsappDisplay={WHATSAPP_DISPLAY}
      country="GT"
      tipoDeCambio={tipoDeCambio}
    />
  );
}
