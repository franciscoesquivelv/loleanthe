export const APERTURAS = ['Bouton', 'Classic', 'Royal', 'Prime', 'Majestic'] as const;
export type Apertura = (typeof APERTURAS)[number];

export const ROSE_TIERS = ['Premium', 'Grand', 'Exotic'] as const;
export type RoseTier = (typeof ROSE_TIERS)[number];

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
  vaseLifeDays?: number; // vida en florero, en días
  colors?: string[]; // uno o más colores (hex), varias variedades vienen en múltiples colores
}

export interface QuoteItem {
  flowerId: string;
  flowerName: string;
  flowerImage?: string;
}

export interface QuoteFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  flowers: QuoteItem[];
}
