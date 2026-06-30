import type { Metadata } from 'next';
import { getPublicFlowersServer } from '@/lib/flowers-server';
import CatalogoClient from './CatalogoClient';

export const metadata: Metadata = {
  title: 'Catálogo de Flores Premium',
  description:
    'Explora nuestra selección completa de flores exóticas de alta gama: rosas, ranúnculos y variedades exclusivas para arreglos personalizados e irrepetibles.',
  alternates: { canonical: '/catalogo' },
  openGraph: {
    title: 'Catálogo de Flores Premium | Loleanthe Boutique',
    description:
      'Toda nuestra selección de flores exóticas de alta gama, disponibles para arreglos personalizados y cotizaciones exclusivas.',
    url: '/catalogo',
  },
};

export default async function CatalogoPage() {
  const flowers = await getPublicFlowersServer();
  return <CatalogoClient initialFlowers={flowers} />;
}
