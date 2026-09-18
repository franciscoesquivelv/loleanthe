export interface PriceItem {
  slug: string;
  name: string;
  size: string;
  price: number;
  image?: string;
}

export const SHIPMENT_TITLE = 'Día de la Madre';
export const WHATSAPP_NUMBER = '50688472038';
export const WHATSAPP_DISPLAY = '8847-2038';

export const PRICE_ITEMS: PriceItem[] = [
  { slug: 'rosa', name: 'Rosa', size: '50 cm', price: 1.0, image: '/images-dia-de-la-madre/Rose.webp' },
  { slug: 'rosa-garden', name: 'Rosa Garden', size: '50 cm', price: 3.18, image: '/images-dia-de-la-madre/Garden-Rose.jpg' },
  { slug: 'ranunculus', name: 'Ranunculus', size: '35 cm', price: 3.19, image: '/images-dia-de-la-madre/ranunculus.jpg' },
  { slug: 'anemone', name: 'Anemone', size: '30 cm', price: 4.35, image: '/images-dia-de-la-madre/Anemone.webp' },
  { slug: 'crisantemo', name: 'Crisantemo', size: '70 cm', price: 2.05, image: '/images-dia-de-la-madre/crisantemo.jpg' },
  { slug: 'delphinium', name: 'Delphinium', size: '80 cm', price: 1.8, image: '/images-dia-de-la-madre/delphinium.jpeg' },
  { slug: 'larkspur', name: 'Larkspur', size: '80 cm', price: 2.2, image: '/images-dia-de-la-madre/larkspur.webp' },
  { slug: 'hypericum', name: 'Hypericum', size: '60 cm', price: 1.28, image: '/images-dia-de-la-madre/hypericum.webp' },
];
