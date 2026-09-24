export interface PriceItem {
  slug: string;
  name: string;
  /** Largo de tallo. Vacío si aún no está confirmado. */
  size?: string;
  /** Tallos por bunch: rosas 25, el resto 10. */
  stemsPerBunch: number;
  /** Precio por tallo en USD. `null` = pendiente de confirmar. */
  price: number | null;
  image?: string;
  /** Nombre exacto de la variedad en el catálogo, para enlazar a su ficha. */
  catalogName?: string;
  /** Si no hay ficha individual, se enlaza a la categoría. */
  categorySlug?: string;
}

export const SHIPMENT_TITLE = 'Temporada Octubre - Diciembre';
export const WHATSAPP_NUMBER = '50688472038';
export const WHATSAPP_DISPLAY = '8847-2038';

export const PRICE_ITEMS: PriceItem[] = [
  { slug: 'rosa', name: 'Rosa', size: '50 cm', stemsPerBunch: 25, price: 1.0, image: '/images-dia-de-la-madre/rosa.jpg', categorySlug: 'rosas' },
  { slug: 'rosa-garden', name: 'Rosa Garden', size: '50 cm', stemsPerBunch: 25, price: 3.18, image: '/images-dia-de-la-madre/rosa-garden.jpg', catalogName: "White O'hara", categorySlug: 'rosas-garden' },
  { slug: 'ranunculus', name: 'Ranunculus', size: '35 cm', stemsPerBunch: 10, price: 3.19, image: '/images-dia-de-la-madre/ranunculus.jpg', categorySlug: 'ranunculus' },
  { slug: 'crisantemo', name: 'Crisantemo', size: '70 cm', stemsPerBunch: 10, price: 2.05, image: '/images-dia-de-la-madre/crisantemo.jpg' },
  { slug: 'delphinium', name: 'Delphinium', size: '80 cm', stemsPerBunch: 10, price: 1.8, image: '/images-dia-de-la-madre/delphinium.jpg', catalogName: 'Delphinium Sea Waltz' },
  { slug: 'larkspur', name: 'Larkspur', size: '80 cm', stemsPerBunch: 10, price: 2.2, image: '/images-dia-de-la-madre/larkspur.jpg' },
  { slug: 'hypericum', name: 'Hypericum', size: '60 cm', stemsPerBunch: 10, price: 1.28, image: '/images-dia-de-la-madre/hypericum.jpg', catalogName: 'Hypericum' },
  { slug: 'limonium', name: 'Limonium', size: '70 cm', stemsPerBunch: 10, price: 2.2, image: '/images-dia-de-la-madre/limonium.jpg' },
  // Francisco dio el precio por bunch ($12), no por tallo: 12 / 10 tallos = 1.20.
  { slug: 'gypsophila', name: 'Gypsophila de colores', size: '60-80 cm', stemsPerBunch: 10, price: 1.2, image: '/images-dia-de-la-madre/gypsophila-colores.jpg', catalogName: 'Gypsophila Xlence' },
];
