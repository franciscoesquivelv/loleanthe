'use client';

import { BUCKET_HEX, COLOR_BUCKETS, colorBucket, type ColorBucket } from '@/lib/colors';

/** Marcar un color agrega el tono de la paleta a `colors`. Desmarcar quita TODOS
 *  los tonos de ese balde: una flor guardada antes de la paleta puede traer
 *  varios hex sueltos que caen en el mismo color. */
export function toggleColor(colors: string[], bucket: ColorBucket): string[] {
  const marcado = colors.some((c) => colorBucket(c) === bucket);
  return marcado ? colors.filter((c) => colorBucket(c) !== bucket) : [...colors, BUCKET_HEX[bucket]];
}

/** Los 8 colores del filtro del catálogo, como botones. Lo que se marca acá es
 *  exactamente lo que el filtro usa para decidir en qué color sale la flor. */
export default function ColorToggles({
  colors,
  onChange,
}: {
  colors: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase font-display text-[#7B7369] mb-2">Colores disponibles</label>
      <div className="flex flex-wrap items-center gap-2">
        {COLOR_BUCKETS.map((bucket) => {
          const marcado = colors.some((c) => colorBucket(c) === bucket);
          return (
            <button
              key={bucket}
              type="button"
              onClick={() => onChange(toggleColor(colors, bucket))}
              aria-pressed={marcado}
              className={`flex items-center gap-2 border px-3 py-2 text-xs tracking-widest uppercase font-display transition-colors ${
                marcado
                  ? 'border-[#12100E] bg-[#12100E] text-[#F2EFE8]'
                  : 'border-[#A39C92] text-[#7B7369] hover:border-[#7B7369]'
              }`}
            >
              <span
                className="h-4 w-4 rounded-full border border-[#A39C92]"
                style={{ backgroundColor: BUCKET_HEX[bucket] }}
                aria-hidden
              />
              {bucket}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-[#7B7369] mt-2">
        Marca cada color en el que viene la flor. Es lo mismo que usa el filtro de color del catálogo: si un color no está marcado acá, la flor no sale en ese filtro. Algunas variedades vienen en varios colores (ej. ranunculus, lisianthus): marca todos.
      </p>
    </div>
  );
}
