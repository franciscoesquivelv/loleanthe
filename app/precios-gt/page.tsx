import type { Metadata } from 'next';
import { getPublicFlowersServer } from '@/lib/flowers-server';
import { PRICE_ITEMS, SHIPMENT_TITLE, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from '../precios/data';
import PriceSheetView from '../precios/PriceSheetView';

// Enlace directo para clientes de Guatemala, no una sección del sitio: no va
// en el nav ni se indexa. Por ahora usa la misma lista que /precios-cr;
// pendiente de Francisco confirmar si el precio o la disponibilidad difieren
// por país (ver PRICE_ITEMS en ../precios/data.ts).
export const metadata: Metadata = {
  title: `Precios Guatemala · ${SHIPMENT_TITLE}`,
  description: 'Precios por bunch y por tallo (USD) para Guatemala, de la flor ecuatoriana que traemos en la temporada.',
  alternates: { canonical: '/precios-gt' },
  robots: { index: false, follow: false },
  openGraph: {
    title: `Precios Guatemala · ${SHIPMENT_TITLE} | Loleanthe`,
    description: 'Precios por bunch y por tallo (USD) para Guatemala.',
    url: '/precios-gt',
    images: [{ url: '/images/hero-dark.jpg', width: 1200, height: 630, alt: 'Loleanthe, flor ecuatoriana' }],
  },
};

export default async function PreciosGuatemalaPage() {
  const flowers = await getPublicFlowersServer();
  return (
    <PriceSheetView
      items={PRICE_ITEMS}
      flowers={flowers}
      title={SHIPMENT_TITLE}
      eyebrow="Precios · Guatemala"
      whatsappNumber={WHATSAPP_NUMBER}
      whatsappDisplay={WHATSAPP_DISPLAY}
    />
  );
}
