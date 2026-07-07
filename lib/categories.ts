export interface Category {
  slug: 'rosas' | 'ranunculus' | 'fillers';
  label: string;
  blurb: string;
  // Imagen de respaldo mientras la categoría no tenga flores reales cargadas.
  fallbackImage: string;
}

export const CATEGORIES: Category[] = [
  {
    slug: 'rosas',
    label: 'Rosas',
    blurb: 'Tallos largos, cabezas grandes, para el arreglo que impone.',
    fallbackImage: '/images/flor-portada.png',
  },
  {
    slug: 'ranunculus',
    label: 'Ranunculus',
    blurb: 'Pétalos en capas, colores imposibles de replicar.',
    fallbackImage: '/images/ranunculus-hestia.png',
  },
  {
    slug: 'fillers',
    label: 'Fillers',
    blurb: 'Textura y volumen que completan cualquier composición.',
    fallbackImage: '/images/flor-filler-web.jpg',
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getCategoryByLabel(label?: string): Category | undefined {
  if (!label) return undefined;
  return CATEGORIES.find((c) => c.label.toLowerCase() === label.toLowerCase());
}
