import type { Metadata } from 'next';
import { getCategoryBySlug } from '@/lib/categories';
import { getFlowersByCategoryServer } from '@/lib/flowers-server';
import CategoryClient from '@/components/CategoryClient';

const category = getCategoryBySlug('rosas-garden')!;

const OG_IMAGE = { url: category.fallbackImage, width: 1200, height: 630, alt: category.label };

export const metadata: Metadata = {
  title: 'Rosas Garden al por Mayor para Bodas',
  description:
    'Rosas garden de copa abierta, la variedad que más se pide para ramo de novia y centros de mesa románticos. Al por mayor para Costa Rica y Guatemala.',
  alternates: { canonical: '/catalogo/rosas-garden' },
  openGraph: {
    title: `${category.label} | Loleanthe`,
    description: category.blurb,
    url: '/catalogo/rosas-garden',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${category.label} | Loleanthe`,
    description: category.blurb,
    images: [OG_IMAGE.url],
  },
};

export default async function RosasGardenPage() {
  const flowers = await getFlowersByCategoryServer(category.label);
  return <CategoryClient category={category} initialFlowers={flowers} />;
}
