// Agrupa los colores (hex) guardados por flor en baldes con nombre, para poder
// filtrar el catálogo por color sin depender de coincidencias exactas de hex.
export const COLOR_BUCKETS = ['Rojo', 'Rosa', 'Naranja', 'Amarillo', 'Verde', 'Azul', 'Morado', 'Blanco'] as const;
export type ColorBucket = (typeof COLOR_BUCKETS)[number];

// El tono que se guarda en la flor cuando se marca cada color en el admin. Son
// los mismos 8 que ya traían las 44 flores del catálogo, así que el dato
// existente no cambia. Lo que cambia es que el admin ofrece SOLO estos: con el
// selector libre de antes nadie podía saber en qué balde iba a caer el tono
// elegido (un rosa pastel, #FFCDD2, terminaba en Rojo).
export const BUCKET_HEX: Record<ColorBucket, string> = {
  Rojo: '#c6716e',
  Rosa: '#dc95a7',
  Naranja: '#e0a674',
  Amarillo: '#e0c575',
  Verde: '#a1af8c',
  Azul: '#8894b2',
  Morado: '#a891b4',
  Blanco: '#efece4',
};

const HEX_TO_BUCKET = new Map<string, ColorBucket>(
  COLOR_BUCKETS.map((bucket) => [BUCKET_HEX[bucket], bucket])
);

function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

export function colorBucket(hex: string): ColorBucket {
  // Los 8 tonos de la paleta no se clasifican por cálculo: se les dice a mano
  // a qué balde van. El amarillo (#e0c575) caía en h=44.86, a una décima del
  // corte con el naranja, y por eso el filtro Amarillo casi no mostraba
  // flores: las amarillas aparecían bajo Naranja.
  const known = HEX_TO_BUCKET.get(hex.toLowerCase());
  if (known) return known;

  // Para cualquier otro hex (flores guardadas antes de la paleta) se calcula.
  const [h, s, l] = hexToHsl(hex);
  // Cerca del blanco, el cálculo de saturación de HSL se dispara con
  // diferencias de RGB mínimas (ej. #efece4, un crema casi blanco, da
  // s=25.6%): el umbral viejo (s<12) solo atrapaba grises puros y dejaba
  // afuera cualquier blanco con un ligerísimo tinte cálido, que terminaba
  // en el balde de tono (acá, Naranja).
  if (l > 90 && s < 30) return 'Blanco';
  if (s < 12) return 'Blanco';
  // Un rojo muy claro es un rosa (#FFCDD2), no un rojo.
  if (h < 10 || h >= 350) return l >= 78 ? 'Rosa' : 'Rojo';
  if (h < 40) return 'Naranja';
  if (h < 65) return 'Amarillo';
  if (h < 170) return 'Verde';
  if (h < 255) return 'Azul';
  if (h < 320) return 'Morado';
  return 'Rosa';
}

export function bucketsForColors(colors?: string[]): ColorBucket[] {
  if (!colors || colors.length === 0) return [];
  return Array.from(new Set(colors.map(colorBucket)));
}
