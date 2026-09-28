import type { Metadata } from 'next';
import { getCategoryBySlug } from '@/lib/categories';
import { getFlowersByCategoryServer } from '@/lib/flowers-server';
import CategoryClient from '@/components/CategoryClient';

const category = getCategoryBySlug('rosas')!;

const OG_IMAGE = { url: category.fallbackImage, width: 1200, height: 630, alt: category.label };

export const metadata: Metadata = {
  title: category.label,
  description: `${category.blurb} Rosas premium importadas, disponibles para cotización en Loleanthe.`,
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
