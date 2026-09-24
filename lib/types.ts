export const APERTURAS = ['Bouton', 'Classic', 'Royal', 'Prime', 'Majestic'] as const;
export type Apertura = (typeof APERTURAS)[number];

export const ROSE_TIERS = ['Premium', 'Grand', 'Exotic'] as const;
export type RoseTier = (typeof ROSE_TIERS)[number];

/** Los dos mercados que atiende Loleanthe. No todas las flores llegan a ambos. */
export const COUNTRIES = [
  { code: 'CR', label: 'Costa Rica' },
  { code: 'GT', label: 'Guatemala' },
] as const;
export type CountryCode = (typeof COUNTRIES)[number]['code'];

export interface Flower {
  id: string;
  name: string;
  description: string;
  images: string[]; // Firebase Storage URLs
  inStock: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  category?: string;
  tier?: RoseTier; // solo aplica a Rosas, grado del catálogo impreso
  apertura?: Apertura; // escala de apertura de la flor (todas las categorías)
  stemLength?: string; // rango en cm, ej. "50-70cm"
  headSize?: string; // diámetro de la cabeza, ej. "5.5 cm"
  vaseLifeDays?: number; // vida en florero, en días
  colors?: string[]; // uno o más colores (hex), varias variedades vienen en múltiples colores
  availableIn?: CountryCode[]; // mercados donde llega; vacío = todavía sin marcar
}

/**
 * Una flor sin `availableIn` está SIN MARCAR, no "no disponible": son las que
 * se cargaron antes de que existiera el campo. Por eso pasan cualquier filtro
 * de país, para que el catálogo no se vacíe mientras se terminan de marcar.
 */
export function isAvailableIn(flower: Flower, code: CountryCode): boolean {
  if (!flower.availableIn || flower.availableIn.length === 0) return true;
  return flower.availableIn.includes(code);
}

/** Etiquetas de país a mostrar. Vacío cuando la flor aún no está marcada. */
export function countryLabels(flower: Flower): string[] {
  if (!flower.availableIn || flower.availableIn.length === 0) return [];
  return COUNTRIES.filter((c) => flower.availableIn!.includes(c.code)).map((c) => c.label);
}

export interface QuoteItem {
  flowerId: string;
  flowerName: string;
  flowerImage?: string;
}

/**
 * Construye el ítem de cotización omitiendo `flowerImage` cuando la flor no
 * tiene foto. Firestore rechaza el documento entero si un campo llega como
 * `undefined`, así que la clave no puede existir con ese valor.
 */
export function toQuoteItem(flower: Pick<Flower, 'id' | 'name' | 'images'>): QuoteItem {
  const image = flower.images?.[0];
  return {
    flowerId: flower.id,
    flowerName: flower.name,
    ...(image ? { flowerImage: image } : {}),
  };
}

export interface QuoteFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  flowers: QuoteItem[];
}
