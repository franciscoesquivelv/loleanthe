import type { Metadata } from 'next';
import { destinationInfo, type PriceDestination } from '@/lib/price-destinations';
import { getPublishedPriceSheetServer } from '@/lib/priceSheets-server';

/** El título de la hoja es de la dueña y puede traer "(copia)" de Duplicar o
 *  ser larguísimo: acá solo entra a la pestaña del navegador, recortado. */
function tituloPresentable(titulo: string): string {
  return titulo.replace(/\s*\(copia\)\s*$/i, '').trim().slice(0, 60);
}

/**
 * Metadatos de una hoja de precios. Estas rutas son enlaces que Francisco
 * manda directo, no secciones del sitio: no van en el nav ni en el sitemap, y
 * no se indexan.
 *
 * La tarjeta que se ve en WhatsApp (og:) usa texto FIJO por destino, no el
 * título ni la descripción editables de la hoja: WhatsApp guarda la tarjeta
 * por enlace y no la actualiza sola, y el enlace de un país es permanente
 * mientras la hoja cambia cada temporada. Una tarjeta con la temporada puede
 * quedar mostrando una que ya no es la vigente. El título de la hoja solo
 * entra a la pestaña del navegador (`title`).
 */
export async function priceMetadata(destination: PriceDestination): Promise<Metadata> {
  const info = destinationInfo(destination);
  const sheet = await getPublishedPriceSheetServer(destination);
  const nombre = sheet ? tituloPresentable(sheet.title) : '';
  const image = {
    url: '/images/hero-dark.jpg',
    width: 2200,
    height: 1466,
    alt: 'Loleanthe, flor ecuatoriana',
  };
  return {
    title: nombre ? `${info.metaTitle} · ${nombre}` : info.metaTitle,
    description: info.shareDescription,
    alternates: { canonical: info.route },
    robots: { index: false, follow: false },
    openGraph: {
      title: info.shareTitle,
      description: info.shareDescription,
      url: info.route,
      siteName: 'Loleanthe',
      type: 'website',
      locale: info.locale,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: info.shareTitle,
      description: info.shareDescription,
      images: [image.url],
    },
  };
}
