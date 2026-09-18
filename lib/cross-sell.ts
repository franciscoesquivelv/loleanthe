import type { Flower } from './types';
import { CATEGORIES } from './categories';

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

// Sugiere variedades de OTRAS categorías para completar un arreglo (ej. una
// rosa ya elegida + un ranunculus + un filler), nunca más de la misma familia.
// El punto de partida rota según el id de la flor actual para que no todas las
// fichas de una categoría recomienden exactamente las mismas 2 variedades.
export function getCrossSell(flower: Flower, allFlowers: Flower[], perCategory = 2): Flower[] {
  const otherCategories = CATEGORIES.map((c) => c.label).filter(
    (label) => label.toLowerCase() !== (flower.category ?? '').toLowerCase()
  );

  const picks: Flower[] = [];
  for (const label of otherCategories) {
    const candidates = allFlowers.filter(
      (f) => f.id !== flower.id && f.inStock && (f.category ?? '').toLowerCase() === label.toLowerCase()
    );
    if (candidates.length === 0) continue;
    const start = hashId(flower.id) % candidates.length;
    for (let i = 0; i < Math.min(perCategory, candidates.length); i++) {
      picks.push(candidates[(start + i) % candidates.length]);
    }
  }
  return picks;
}
