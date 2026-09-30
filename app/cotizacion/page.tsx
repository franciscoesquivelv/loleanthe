import type { Metadata } from 'next';
import CotizacionClient from './CotizacionClient';

const OG_IMAGE = { url: '/images/hero-dark.jpg', width: 1200, height: 630, alt: 'Loleanthe, flor ecuatoriana' };

/**
 * Antes este archivo era `'use client'` de punta a punta, así que no podía
 * exportar `metadata` y heredaba entera la del layout, incluido
 * `alternates.canonical: '/'`. Resultado: la página donde de verdad se
 * convierte un lead (hallazgo de Vera, 28/9) le decía a Google que su URL
 * real era la home. Mismo patrón que /catalogo y la ficha de flor: servidor
 * con su propia metadata, cliente aparte para lo interactivo.
 */
export const metadata: Metadata = {
  title: 'Cotización',
  description: 'Pedí cotización de flor ecuatoriana al por mayor para tu boda o evento en Costa Rica y Guatemala. Respondemos en menos de 24 horas.',
  alternates: { canonical: '/cotizacion' },
  openGraph: {
    title: 'Cotización | Loleanthe',
    description: 'Pedí cotización de flor ecuatoriana al por mayor para tu boda o evento en Costa Rica y Guatemala. Respondemos en menos de 24 horas.',
    url: '/cotizacion',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cotización | Loleanthe',
    description: 'Pedí cotización de flor ecuatoriana al por mayor para tu boda o evento en Costa Rica y Guatemala. Respondemos en menos de 24 horas.',
    images: [OG_IMAGE.url],
  },
};

export default function CotizacionPage() {
  return <CotizacionClient />;
}
