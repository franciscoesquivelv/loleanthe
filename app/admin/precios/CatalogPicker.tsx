'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { CATEGORIES, getCategoryByLabel, getCategoryBySlug, type Category } from '@/lib/categories';
import { destinationInfo, type PriceDestination } from '@/lib/price-destinations';
import { CATEGORY_ALIASES, availabilityNote, matchesQuery } from '@/lib/price-sheet-rules';
import type { Flower } from '@/lib/types';
import { ACCION_SUAVE, AVISO, FIELD } from './ui';

/** Lo que ya está en la hoja: no se vuelve a ofrecer, para no repetir una flor. */
export interface YaEnHoja {
  flowerIds: Set<string>;
  categorySlugs: Set<string>;
}

function Foto({ src, nombre, w, h }: { src?: string; nombre: string; w: number; h: number }) {
  return (
    <div className="relative shrink-0 overflow-hidden bg-line" style={{ width: w, height: h }}>
      {src ? (
        <Image src={src} alt="" fill sizes={`${w}px`} className="object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center font-serif text-lg text-muted">{nombre.charAt(0)}</span>
      )}
    </div>
  );
}

/**
 * Elegir la flor del catálogo a la que enlaza una flor de la hoja.
 *
 * - Una lista siempre visible, no un autocompletar escondido: en el celular el
 *   teclado se come los resultados, y escribir sobre el campo borraba el enlace
 *   en silencio.
 * - Busca por nombre Y categoría, sin tildes: "rosa", "rosas" y "ranunculo" ahora
 *   encuentran algo (las flores se llaman por variedad, y "rosa" daba 0).
 * - Las que llegan al país de la hoja van primero; las que el catálogo no marca
 *   para ese país salen atenuadas con "No llega a Guatemala", pero se pueden
 *   elegir: el catálogo puede estar desactualizado.
 */
export default function CatalogPicker({
  flowers,
  destination,
  yaEnHoja,
  busqueda,
  onBuscar,
  flowerId,
  categorySlug,
  onElegirFlor,
  onElegirCategoria,
  onQuitar,
}: {
  flowers: Flower[];
  destination: PriceDestination | null;
  yaEnHoja: YaEnHoja;
  busqueda: string;
  onBuscar: (texto: string) => void;
  flowerId: string;
  categorySlug: string;
  onElegirFlor: (flower: Flower) => void;
  onElegirCategoria: (categoria: Category) => void;
  onQuitar: () => void;
}) {
  const info = destination ? destinationInfo(destination) : null;
  const activas = useMemo(() => flowers.filter((f) => !f.archived), [flowers]);

  const flor = flowerId ? flowers.find((f) => f.id === flowerId) : undefined;
  const categoria = categorySlug ? getCategoryBySlug(categorySlug) : undefined;

  // ── Ya hay algo enlazado: un resumen, no la lista ─────────────────────────
  if (flowerId || categorySlug) {
    const nota = flor ? availabilityNote(flor, destination) : null;
    return (
      <div>
        <div className="flex items-center gap-3 border-y border-line py-3">
          <Foto src={flor?.images[0] ?? undefined} nombre={flor?.name ?? categoria?.label ?? '?'} w={44} h={50} />
          <div className="min-w-0 flex-1">
            <p className="font-serif text-lg font-light leading-tight text-ink">
              {flor ? flor.name : categoria ? categoria.label : 'Flor que ya no está en el catálogo'}
            </p>
            <p className="label mt-1 text-muted">
              {flor
                ? [flor.category, nota?.text || (info?.country ? `Llega ${info.a}` : '')].filter(Boolean).join(' · ')
                : categoria
                  ? 'Categoría · todas las variedades'
                  : 'El enlace a su ficha no va a funcionar'}
            </p>
          </div>
          <button type="button" onClick={onQuitar} className={ACCION_SUAVE}>
            Cambiar o quitar
          </button>
        </div>
        {nota?.fuera && info && (
          <p className={`${AVISO} mt-3`}>
            Esta flor figura solo en el otro país en el catálogo. Si ya llega {info.a}, marcalo en la ficha de la flor.
          </p>
        )}
      </div>
    );
  }

  // ── La lista ────────────────────────────────────────────────────────────
  const categoriasQueCalzan = CATEGORIES.filter(
    (c) => !yaEnHoja.categorySlugs.has(c.slug) && matchesQuery([c.label, ...(CATEGORY_ALIASES[c.slug] ?? [])].join(' '), busqueda)
  );
  const floresQueCalzan = activas
    .filter((f) => matchesQuery(`${f.name} ${f.category ?? ''} ${(CATEGORY_ALIASES[getCategoryByLabel(f.category)?.slug ?? ''] ?? []).join(' ')}`, busqueda))
    .map((f) => ({ f, nota: availabilityNote(f, destination), ya: yaEnHoja.flowerIds.has(f.id) }))
    .sort(
      (a, b) =>
        Number(a.ya) - Number(b.ya) ||
        Number(a.nota.fuera) - Number(b.nota.fuera) ||
        a.f.name.localeCompare(b.f.name, 'es')
    );

  const sinResultados = categoriasQueCalzan.length === 0 && floresQueCalzan.length === 0;

  return (
    <div>
      <input
        id="item-catalogo"
        type="search"
        value={busqueda}
        onChange={(e) => onBuscar(e.target.value)}
        placeholder="Buscar por nombre o categoría"
        autoComplete="off"
        className={FIELD}
      />

      {sinResultados ? (
        <p className="mt-3 text-[14px] text-muted">
          Sin resultados. Escribí el nombre arriba y dejala sin enlace.
        </p>
      ) : (
        <ul className="mt-2 max-h-72 overflow-y-auto border-y border-line bg-paper">
          {categoriasQueCalzan.map((c) => (
            <li key={c.slug} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => onElegirCategoria(c)}
                className="flex min-h-14 w-full items-center gap-3 px-2 py-2 text-left hover:bg-bone"
              >
                <Foto src={c.fallbackImage} nombre={c.label} w={36} h={40} />
                <span className="min-w-0">
                  <span className="block font-serif text-[15px] text-ink">{c.label}</span>
                  <span className="label block text-muted">Categoría · todas las variedades</span>
                </span>
              </button>
            </li>
          ))}
          {floresQueCalzan.map(({ f, nota, ya }) => (
            <li key={f.id} className="border-b border-line last:border-b-0">
              <button
                type="button"
                disabled={ya}
                aria-disabled={ya}
                onClick={() => onElegirFlor(f)}
                className="flex min-h-14 w-full items-center gap-3 px-2 py-2 text-left hover:bg-bone disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <span className={nota.fuera || ya ? 'opacity-50' : ''}>
                  <Foto src={f.images[0]} nombre={f.name} w={36} h={40} />
                </span>
                <span className="min-w-0">
                  <span className={`block font-serif text-[15px] ${nota.fuera || ya ? 'text-muted' : 'text-ink'}`}>{f.name}</span>
                  <span className="label block text-muted">
                    {[f.category, ya ? 'Ya está en la hoja' : null].filter(Boolean).join(' · ')}
                    {nota.text && !ya && (
                      <>
                        {f.category ? ' · ' : ''}
                        <span className={nota.fuera ? 'border-b border-ink pb-0.5 text-ink' : ''}>{nota.text}</span>
                      </>
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
