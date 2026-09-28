import type { Metadata } from 'next';
import { getPublicFlowersServer } from '@/lib/flowers-server';
import { getPublishedPriceSheetServer } from '@/lib/priceSheets-server';
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from './data';
import PriceSheetView from './PriceSheetView';

// Enlace que Francisco comparte directo, no una sección del sitio: no va en
// el nav (ver components/Header.tsx y Footer.tsx) y tampoco se indexa ni se
// lista en el sitemap. Las versiones por país viven en /precios-cr y
// /precios-gt; esta queda como genérica, para quien reciba un enlace viejo.
//
// `generateMetadata` en vez de un `export const metadata` fijo: el título
// depende de la hoja publicada en Firestore (sección Precios del admin), ya
// no es una constante de compilación.
export async function generateMetadata(): Promise<Metadata> {
  const sheet = await getPublishedPriceSheetServer();
  const title = sheet ? `Precios · ${sheet.title}` : 'Precios';
  const description = sheet?.description || 'Precios por bunch y por tallo (USD) de la flor ecuatoriana que traemos en la temporada.';
  return {
    title,
    description,
    alternates: { canonical: '/precios' },
    robots: { index: false, follow: false },
    openGraph: {
      title: `${title} | Loleanthe`,
      description,
      url: '/precios',
      images: [{ url: '/images/hero-dark.jpg', width: 1200, height: 630, alt: 'Loleanthe, flor ecuatoriana' }],
    },
  };
}

export default async function PreciosPage() {
  const [flowers, sheet] = await Promise.all([getPublicFlowersServer(), getPublishedPriceSheetServer()]);

  // Sin hoja publicada (recién desplegado, o Francisco archivó la vigente
  // sin publicar la siguiente): mensaje claro en vez de una página rota.
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
      eyebrow="Precios · Próximo envío"
      whatsappNumber={WHATSAPP_NUMBER}
      whatsappDisplay={WHATSAPP_DISPLAY}
    />
  );
}
