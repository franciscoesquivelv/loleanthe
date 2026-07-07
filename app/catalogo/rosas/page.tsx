import type { Metadata } from 'next';
import { getCategoryBySlug } from '@/lib/categories';
import { getFlowersByCategoryServer } from '@/lib/flowers-server';
import CategoryClient from '@/components/CategoryClient';

const category = getCategoryBySlug('rosas')!;

export const metadata: Metadata = {
  title: category.label,
  description: `${category.blurb} Rosas premium importadas, disponibles para cotización en Loleanthe Boutique.`,
  alternates: { canonical: '/catalogo/rosas' },
  openGraph: {
    title: `${category.label} | Loleanthe Boutique`,
    description: category.blurb,
    url: '/catalogo/rosas',
  },
};

export default async function RosasPage() {
  const flowers = await getFlowersByCategoryServer(category.label);
  return <CategoryClient category={category} initialFlowers={flowers} />;
}
