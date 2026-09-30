import type { Metadata } from 'next';
import { getCategoryBySlug } from '@/lib/categories';
import { getFlowersByCategoryServer } from '@/lib/flowers-server';
import CategoryClient from '@/components/CategoryClient';

const category = getCategoryBySlug('ranunculus')!;

const OG_IMAGE = { url: category.fallbackImage, width: 1200, height: 630, alt: category.label };

export const metadata: Metadata = {
  title: 'Ranunculus al por Mayor para Bodas | Flor de Temporada',
  description:
    'Ranunculus importado, pétalos en capas y colores que no se consiguen en el mercado local. Ideal para bouquets de boda de temporada. Al por mayor CR y GT.',
  alternates: { canonical: '/catalogo/ranunculus' },
  openGraph: {
    title: `${category.label} | Loleanthe`,
    description: category.blurb,
    url: '/catalogo/ranunculus',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${category.label} | Loleanthe`,
    description: category.blurb,
    images: [OG_IMAGE.url],
  },
};

export default async function RanunculusPage() {
  const flowers = await getFlowersByCategoryServer(category.label);
  return <CategoryClient category={category} initialFlowers={flowers} />;
}
