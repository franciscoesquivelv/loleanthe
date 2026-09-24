import type { Metadata } from 'next';
import { getCategoryBySlug } from '@/lib/categories';
import { getFlowersByCategoryServer } from '@/lib/flowers-server';
import CategoryClient from '@/components/CategoryClient';

const category = getCategoryBySlug('rosas-garden')!;

export const metadata: Metadata = {
  title: category.label,
  description: `${category.blurb} Rosas garden importadas de Ecuador, disponibles para cotización en Loleanthe.`,
  alternates: { canonical: '/catalogo/rosas-garden' },
  openGraph: {
    title: `${category.label} | Loleanthe`,
    description: category.blurb,
    url: '/catalogo/rosas-garden',
  },
};

export default async function RosasGardenPage() {
  const flowers = await getFlowersByCategoryServer(category.label);
  return <CategoryClient category={category} initialFlowers={flowers} />;
}
