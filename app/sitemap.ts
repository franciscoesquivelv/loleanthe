import type { MetadataRoute } from 'next';
import { getPublicFlowersServer } from '@/lib/flowers-server';
import { CATEGORIES } from '@/lib/categories';

const BASE_URL = 'https://loleanthe.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const flowers = await getPublicFlowersServer();

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${BASE_URL}/catalogo/${c.slug}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const flowerRoutes: MetadataRoute.Sitemap = flowers.map((f) => ({
    url: `${BASE_URL}/catalogo/${f.id}`,
    lastModified: f.updatedAt || undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
    ...categoryRoutes,
    { url: `${BASE_URL}/cotizacion`, changeFrequency: 'monthly', priority: 0.5 },
    ...flowerRoutes,
  ];
}
