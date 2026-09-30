import type { Metadata } from 'next';
import { getCategoryBySlug } from '@/lib/categories';
import { getFlowersByCategoryServer } from '@/lib/flowers-server';
import CategoryClient from '@/components/CategoryClient';

const category = getCategoryBySlug('rosas')!;

const OG_IMAGE = { url: category.fallbackImage, width: 1200, height: 630, alt: category.label };

export const metadata: Metadata = {
  title: 'Rosas al por Mayor para Bodas y Eventos',
  description:
    'Rosas de tallo largo importadas, cabezas grandes, para el centro de mesa y el arco que necesitan presencia. Cotización al por mayor CR y GT.',
  alternates: { canonical: '/catalogo/rosas' },
  openGraph: {
    title: `${category.label} | Loleanthe`,
    description: category.blurb,
    url: '/catalogo/rosas',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${category.label} | Loleanthe`,
    description: category.blurb,
    images: [OG_IMAGE.url],
  },
};

export default async function RosasPage() {
  const flowers = await getFlowersByCategoryServer(category.label);
  return <CategoryClient category={category} initialFlowers={flowers} />;
}
