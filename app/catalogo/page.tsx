import type { Metadata } from 'next';
import { getPublicFlowersServer } from '@/lib/flowers-server';
import CatalogoClient from './CatalogoClient';

const OG_IMAGE = { url: '/images/hero-dark.jpg', width: 1200, height: 630, alt: 'Loleanthe, flor ecuatoriana' };

export const metadata: Metadata = {
  title: 'Catálogo de Flores Premium',
  description:
    'Rosas, ranunculus y fillers de tallo largo, importados bajo pedido para floristas, decoradores y hoteles en Costa Rica y Guatemala.',
  alternates: { canonical: '/catalogo' },
  openGraph: {
    title: 'Catálogo de Flores Premium | Loleanthe',
    description: 'Rosas, ranunculus y fillers de tallo largo, disponibles para cotización.',
    url: '/catalogo',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catálogo de Flores Premium | Loleanthe',
    description: 'Rosas, ranunculus y fillers de tallo largo, disponibles para cotización.',
    images: [OG_IMAGE.url],
  },
};

export default async function CatalogoPage() {
  const flowers = await getPublicFlowersServer();
  return <CatalogoClient initialFlowers={flowers} />;
}
