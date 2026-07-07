import type { Metadata } from 'next';
import { getCategoryBySlug } from '@/lib/categories';
import { getFlowersByCategoryServer } from '@/lib/flowers-server';
import CategoryClient from '@/components/CategoryClient';

const category = getCategoryBySlug('ranunculus')!;

export const metadata: Metadata = {
  title: category.label,
  description: `${category.blurb} Ranunculus importados, disponibles para cotización en Loleanthe Boutique.`,
  alternates: { canonical: '/catalogo/ranunculus' },
  openGraph: {
    title: `${category.label} | Loleanthe Boutique`,
    description: category.blurb,
    url: '/catalogo/ranunculus',
  },
};

export default async function RanunculusPage() {
  const flowers = await getFlowersByCategoryServer(category.label);
  return <CategoryClient category={category} initialFlowers={flowers} />;
}
