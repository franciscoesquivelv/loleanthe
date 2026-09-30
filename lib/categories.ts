export interface Category {
  slug: 'rosas' | 'rosas-garden' | 'ranunculus' | 'fillers';
  label: string;
  blurb: string;
  // Imagen de respaldo mientras la categoría no tenga flores reales cargadas.
  fallbackImage: string;
  // Enlace de vuelta a /flores-para-bodas: solo en las categorías donde el
  // nicho de bodas pega más fuerte (Rosas Garden, Ranunculus).
  weddingGuide?: boolean;
}

export const CATEGORIES: Category[] = [
  {
    slug: 'rosas',
    label: 'Rosas',
    blurb: 'Tallos largos, cabezas grandes, para el arreglo que impone.',
    fallbackImage: '/images/flor-portada.jpg',
  },
  {
    slug: 'rosas-garden',
    label: 'Rosas Garden',
    blurb: 'Copa abierta y decenas de pétalos, la favorita para el ramo de novia.',
    fallbackImage: '/images/rosa-garden.jpg',
    weddingGuide: true,
  },
  {
    slug: 'ranunculus',
    label: 'Ranunculus',
    blurb: 'Pétalos en capas, colores imposibles de replicar, de las favoritas para bouquet de boda en temporada.',
    fallbackImage: '/images/ranunculus-hestia.jpg',
    weddingGuide: true,
  },
  {
    slug: 'fillers',
    label: 'Fillers',
    blurb: 'Textura y volumen, el toque final de un centro de mesa de boda.',
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
