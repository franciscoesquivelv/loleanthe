import type { Metadata } from 'next';
import { getPublicFlowersServer } from '@/lib/flowers-server';
import { PRICE_ITEMS, SHIPMENT_TITLE, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from './data';
import PriceSheetView from './PriceSheetView';

// Enlace que Francisco comparte directo, no una sección del sitio: no va en
// el nav (ver components/Header.tsx y Footer.tsx) y tampoco se indexa ni se
// lista en el sitemap. Las versiones por país viven en /precios-cr y
// /precios-gt; esta queda como genérica, para quien reciba un enlace viejo.
export const metadata: Metadata = {
  title: `Precios · ${SHIPMENT_TITLE}`,
  description: `Precios por bunch y por tallo (USD) de la flor ecuatoriana que traemos en la temporada. Rosas en bunch de 25 tallos, el resto de 10.`,
  alternates: { canonical: '/precios' },
  robots: { index: false, follow: false },
  openGraph: {
    title: `Precios · ${SHIPMENT_TITLE} | Loleanthe`,
    description: 'Precios por bunch y por tallo (USD) de la temporada.',
    url: '/precios',
    images: [{ url: '/images/hero-dark.jpg', width: 1200, height: 630, alt: 'Loleanthe, flor ecuatoriana' }],
  },
};

export default async function PreciosPage() {
  const flowers = await getPublicFlowersServer();
  return (
    <PriceSheetView
      items={PRICE_ITEMS}
      flowers={flowers}
      title={SHIPMENT_TITLE}
      eyebrow="Precios · Próximo envío"
      whatsappNumber={WHATSAPP_NUMBER}
      whatsappDisplay={WHATSAPP_DISPLAY}
    />
  );
}
