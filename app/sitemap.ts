import type { MetadataRoute } from 'next';

const BASE_URL = 'https://loleanthe.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/cotizacion`, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
