// Agrupa los colores (hex) guardados por flor en baldes con nombre, para poder
// filtrar el catálogo por color sin depender de coincidencias exactas de hex.
export const COLOR_BUCKETS = ['Rojo', 'Rosa', 'Naranja', 'Amarillo', 'Verde', 'Azul', 'Morado', 'Blanco'] as const;
export type ColorBucket = (typeof COLOR_BUCKETS)[number];

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
  const [h, s, l] = hexToHsl(hex);
  if (l > 92 && s < 12) return 'Blanco';
  if (s < 12) return 'Blanco';
  if (h < 10 || h >= 350) return 'Rojo';
  if (h < 45) return 'Naranja';
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
