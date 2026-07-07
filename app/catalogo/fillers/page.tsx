import type { Metadata } from 'next';
import { getCategoryBySlug } from '@/lib/categories';
import { getFlowersByCategoryServer } from '@/lib/flowers-server';
import CategoryClient from '@/components/CategoryClient';

const category = getCategoryBySlug('fillers')!;

export const metadata: Metadata = {
  title: category.label,
  description: `${category.blurb} Flores de relleno exóticas, disponibles para cotización en Loleanthe Boutique.`,
  alternates: { canonical: '/catalogo/fillers' },
  openGraph: {
    title: `${category.label} | Loleanthe Boutique`,
    description: category.blurb,
    url: '/catalogo/fillers',
  },
};

export default async function FillersPage() {
  const flowers = await getFlowersByCategoryServer(category.label);
  return <CategoryClient category={category} initialFlowers={flowers} />;
}
