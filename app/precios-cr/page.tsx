import type { Metadata } from 'next';
import { getPublicFlowersServer } from '@/lib/flowers-server';
import { getTipoDeCambio } from '@/lib/exchange-rate';
import { PRICE_ITEMS, SHIPMENT_TITLE, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from '../precios/data';
import PriceSheetView from '../precios/PriceSheetView';

// Enlace directo para clientes de Costa Rica, no una sección del sitio: no va
// en el nav ni se indexa. El precio por tallo usa el override de
// `priceByCountry.CR` cuando existe (ver PRICE_ITEMS en ../precios/data.ts);
// donde no hay override todavía, usa el precio general.
export const metadata: Metadata = {
  title: `Precios Costa Rica · ${SHIPMENT_TITLE}`,
  description: 'Precios por bunch y por tallo (USD) para Costa Rica, de la flor ecuatoriana que traemos en la temporada.',
  alternates: { canonical: '/precios-cr' },
  robots: { index: false, follow: false },
  openGraph: {
    title: `Precios Costa Rica · ${SHIPMENT_TITLE} | Loleanthe`,
    description: 'Precios por bunch y por tallo (USD) para Costa Rica.',
    url: '/precios-cr',
    images: [{ url: '/images/hero-dark.jpg', width: 1200, height: 630, alt: 'Loleanthe, flor ecuatoriana' }],
  },
};

export default async function PreciosCostaRicaPage() {
  const [flowers, tipoDeCambio] = await Promise.all([getPublicFlowersServer(), getTipoDeCambio()]);
  return (
    <PriceSheetView
      items={PRICE_ITEMS}
      flowers={flowers}
      title={SHIPMENT_TITLE}
      eyebrow="Precios · Costa Rica"
      whatsappNumber={WHATSAPP_NUMBER}
      whatsappDisplay={WHATSAPP_DISPLAY}
      country="CR"
      tipoDeCambio={tipoDeCambio}
    />
  );
}
