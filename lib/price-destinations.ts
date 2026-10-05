// Los tres destinos de una hoja de precios y todo lo que cuelga de cada uno:
// enlace, moneda de referencia, textos del admin y de la tarjeta de WhatsApp.
//
// Es la ÚNICA lista de destinos. La usan las tres rutas públicas, la ruta que
// revalida el caché, el admin y las reglas puras de publicación. Sumar un
// destino es una fila acá, una línea en firestore.rules y un page.tsx.
//
// Sin imports de Firebase a propósito: lo importan el servidor, el cliente y
// el cálculo puro, y ninguno de los tres debe arrastrar el SDK de otro.
import type { CountryCode } from './types';

/** Dirección que se manda a los clientes. Nunca `window.location.origin`: en
 *  una vista previa de Vercel se copiaría el enlace de la vista previa. */
export const SITE_ORIGIN = 'https://loleanthe.com';

/** Lo que dice un enlace sin hoja publicada. El admin lo cita ("Quien abra este
 *  enlace hoy ve «…»") y la página pública lo muestra: un solo texto. */
export const SIN_HOJA_TITULO = 'Esta lista todavía no está publicada';

export const PRICE_DESTINATIONS = [
  {
    code: 'CR',
    label: 'Costa Rica',
    route: '/precios-cr',
    /** País del catálogo (`availableIn`). `null` en General: sin filtro. */
    country: 'CR',
    currency: { symbol: '₡', name: 'colones' },
    eyebrow: 'Precios · Costa Rica',
    /** Frases armadas para que la gramática no se rompa en los diálogos. */
    en: 'en Costa Rica',
    a: 'a Costa Rica',
    deLa: 'de Costa Rica',
    hojaDe: 'de Costa Rica',
    cardMoneda: 'Dólares, con referencia en colones',
    shareTitle: 'Lista de precios Costa Rica | Loleanthe',
    shareDescription: 'Flor ecuatoriana al por mayor. Precios en dólares, con referencia en colones.',
    metaTitle: 'Precios Costa Rica',
    locale: 'es_CR',
  },
  {
    code: 'GT',
    label: 'Guatemala',
    route: '/precios-gt',
    country: 'GT',
    currency: { symbol: 'Q', name: 'quetzales' },
    eyebrow: 'Precios · Guatemala',
    en: 'en Guatemala',
    a: 'a Guatemala',
    deLa: 'de Guatemala',
    hojaDe: 'de Guatemala',
    cardMoneda: 'Dólares, con referencia en quetzales',
    shareTitle: 'Lista de precios Guatemala | Loleanthe',
    shareDescription: 'Flor ecuatoriana al por mayor. Precios en dólares, con referencia en quetzales.',
    metaTitle: 'Precios Guatemala',
    locale: 'es_GT',
  },
  {
    code: 'GENERAL',
    label: 'General',
    route: '/precios',
    country: null,
    currency: null,
    eyebrow: 'Precios · Lista general',
    en: 'en la lista general',
    a: 'a la lista general',
    deLa: 'de la lista general',
    hojaDe: 'general',
    cardMoneda: 'Solo dólares, sin moneda local',
    shareTitle: 'Lista de precios | Loleanthe',
    shareDescription: 'Flor ecuatoriana al por mayor. Precios en dólares (USD).',
    metaTitle: 'Precios',
    locale: 'es_LA',
  },
] as const;

export type PriceDestination = (typeof PRICE_DESTINATIONS)[number]['code'];
export type PriceDestinationInfo = (typeof PRICE_DESTINATIONS)[number];

export const PRICE_DESTINATION_CODES: PriceDestination[] = PRICE_DESTINATIONS.map((d) => d.code);

/**
 * Convierte lo que venga de Firestore a un destino válido, o `null`.
 *
 * `null` quiere decir "hoja sin asignar" (las que se cargaron antes de que
 * existiera el campo) y NO se lee como General: una hoja sin asignar que
 * saliera en el enlace general estaría publicada donde nadie la decidió. Un
 * valor mal escrito ('cr', 'gt ', '') también da `null`: falla cerrado, la
 * hoja queda invisible en los tres enlaces, nunca en el país equivocado.
 */
export function normalizeDestination(value: unknown): PriceDestination | null {
  return PRICE_DESTINATIONS.some((d) => d.code === value) ? (value as PriceDestination) : null;
}

export function destinationInfo(code: PriceDestination): PriceDestinationInfo {
  return PRICE_DESTINATIONS.find((d) => d.code === code)!;
}

/** Lo que se copia y se manda: absoluto, con protocolo, para que WhatsApp lo vuelva enlace. */
export function urlDe(code: PriceDestination): string {
  return SITE_ORIGIN + destinationInfo(code).route;
}

/** Lo que se muestra: sin protocolo. */
export function urlVisible(code: PriceDestination): string {
  return SITE_ORIGIN.replace(/^https?:\/\//, '') + destinationInfo(code).route;
}

/** País del catálogo para el filtro de disponibilidad; `null` en General. */
export function catalogCountry(code: PriceDestination): CountryCode | null {
  return destinationInfo(code).country;
}
