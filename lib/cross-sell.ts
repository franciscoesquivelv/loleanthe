import type { Flower } from './types';
import { CATEGORIES } from './categories';

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

// Sugiere variedades de OTRAS categorías para completar un arreglo (ej. una
// rosa ya elegida + un ranunculus + un filler), nunca de la misma familia.
// El punto de partida rota según el id de la flor actual para que no todas las
// fichas de una categoría recomienden exactamente las mismas variedades.
export function getCrossSell(flower: Flower, allFlowers: Flower[], limit = 4): Flower[] {
  const otherCategories = CATEGORIES.map((c) => c.label).filter(
    (label) => label.toLowerCase() !== (flower.category ?? '').toLowerCase()
  );

  const byCategory = otherCategories.map((label) => {
    const candidates = allFlowers.filter(
      (f) => f.id !== flower.id && f.inStock && (f.category ?? '').toLowerCase() === label.toLowerCase()
    );
    if (candidates.length === 0) return [];
    const start = hashId(flower.id) % candidates.length;
    return candidates.map((_, i) => candidates[(start + i) % candidates.length]);
  });

  // Se reparte por rondas: primero una de cada categoría, después la segunda.
  // Con 4 categorías, tomar 2 de cada una daba 6 sugerencias en una rejilla de
  // 4 y dejaba una fila huérfana; así la fila se llena y ninguna familia la
  // acapara.
  const picks: Flower[] = [];
  for (let round = 0; picks.length < limit; round++) {
    let addedThisRound = false;
    for (const candidates of byCategory) {
      if (picks.length >= limit) break;
      const pick = candidates[round];
      if (pick) {
        picks.push(pick);
        addedThisRound = true;
      }
    }
    if (!addedThisRound) break;
  }
  return picks;
}
