'use client';

import { useMemo, useState } from 'react';
import { CATEGORIES } from '@/lib/categories';
import { destinationInfo, type PriceDestination } from '@/lib/price-destinations';
import {
  MAX_FLORES,
  actionFor,
  applyImport,
  matchName,
  notMentioned,
  parsePastedList,
  type ImportEntry,
  type ImportMatch,
  type ImportResult,
  type PastedIgnored,
} from '@/lib/price-import';
import { availabilityNote, priceRange } from '@/lib/price-sheet-rules';
import type { PriceItem } from '@/lib/priceSheets';
import type { Flower } from '@/lib/types';
import { ACCION_SUAVE, AVISO, BOTON, ETIQ_DESTINO, FIELD } from './ui';

const EJEMPLO = `Stock 9.90
Ruscus 4.50
Rosas 18
Garden roses 30
Clavel $10`;

const valorDe = (m: ImportMatch) => (m.kind === 'flor' ? `flor:${m.flowerId}` : m.kind === 'categoria' ? `cat:${m.slug}` : '');
const matchDe = (v: string): ImportMatch =>
  v.startsWith('flor:') ? { kind: 'flor', flowerId: v.slice(5) } : v.startsWith('cat:') ? { kind: 'categoria', slug: v.slice(4) } : { kind: 'ninguna' };

const dolares = (n: number | null) => (n == null ? 'sin precio' : `$${n.toFixed(2)}`);

/**
 * Cargar una lista de precios pegándola, en vez de flor por flor. Dos pasos:
 * se pega el texto, y se REVISA antes de tocar la hoja (qué flor del catálogo
 * encontró para cada línea, qué precio cambia, qué no entendió). Nada se
 * escribe en la base acá: al aplicar, las flores pasan al formulario de la hoja
 * y quedan "sin guardar" como cualquier otro cambio.
 *
 * No pide ni inventa tallos: la lista trae nombre y precio por bunch, y eso es
 * lo que se carga. Los tallos, el largo o una nota se agregan después, flor por
 * flor, solo si se saben.
 */
export default function PasteList({
  items,
  flowers,
  destination,
  onAplicar,
  onCancelar,
}: {
  /** Las flores que la hoja ya tiene: si la lista trae una de ellas, solo cambia su precio. */
  items: PriceItem[];
  flowers: Flower[];
  destination: PriceDestination | null;
  onAplicar: (resultado: ImportResult) => void;
  onCancelar: () => void;
}) {
  const [texto, setTexto] = useState('');
  const [revision, setRevision] = useState<{ entradas: ImportEntry[]; ignoradas: PastedIgnored[] } | null>(null);

  const info = destination ? destinationInfo(destination) : null;
  const activas = useMemo(
    () => flowers.filter((f) => !f.archived).sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [flowers]
  );

  const revisar = () => {
    const { rows, ignored } = parsePastedList(texto);
    setRevision({
      entradas: rows.map((row) => ({ row, match: matchName(row.name, flowers, CATEGORIES), incluir: true })),
      ignoradas: ignored,
    });
  };

  // ── Paso 1: pegar ───────────────────────────────────────────────────────
  if (!revision) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <button type="button" onClick={onCancelar} className={ACCION_SUAVE}>
          ← Volver a la hoja
        </button>
        <h2 className="mt-4 font-serif text-3xl font-light text-ink">Pegar la lista de precios</h2>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
          Pegá la lista tal como la tengas: una flor por línea, con su precio por bunch en dólares. Antes de que se
          agregue nada, vas a revisar qué flor del catálogo encontró para cada una.
        </p>
        <p className="label mt-8 text-muted">Ejemplo</p>
        <pre className="mt-2 border-l border-line pl-4 font-sans text-[14px] leading-relaxed text-muted">{EJEMPLO}</pre>
        <label htmlFor="lista-pegada" className="label mt-8 block text-muted">
          La lista
        </label>
        <textarea
          id="lista-pegada"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={14}
          autoFocus
          placeholder="Pegá acá"
          className={`${FIELD} mt-2 resize-y border border-muted/80 p-3`}
        />
        <div className="mt-6 flex items-center gap-6">
          <button type="button" onClick={revisar} disabled={!texto.trim()} className={BOTON}>
            Revisar la lista
          </button>
          <button type="button" onClick={onCancelar} className={ACCION_SUAVE}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ── Paso 2: revisar ─────────────────────────────────────────────────────
  const { entradas, ignoradas } = revision;
  const cambiar = (i: number, parche: Partial<ImportEntry>) =>
    setRevision((r) => r && { ...r, entradas: r.entradas.map((e, k) => (k === i ? { ...e, ...parche } : e)) });

  const incluidas = entradas.filter((e) => e.incluir);
  const resultado = applyImport(items, entradas, flowers, CATEGORIES);
  const demasiadas = resultado.items.length > MAX_FLORES;
  const sinTocar = notMentioned(items, entradas);
  const sinEnlace = incluidas.filter((e) => e.match.kind === 'ninguna' && actionFor(items, e).tipo === 'nueva').length;
  const total = resultado.agregadas + resultado.actualizadas;

  const resumen = [
    resultado.agregadas > 0 && `${resultado.agregadas} ${resultado.agregadas === 1 ? 'flor nueva' : 'flores nuevas'}`,
    resultado.actualizadas > 0 &&
      `${resultado.actualizadas} ${resultado.actualizadas === 1 ? 'precio que cambia' : 'precios que cambian'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="mx-auto w-full max-w-3xl pb-4">
      <button type="button" onClick={() => setRevision(null)} className={ACCION_SUAVE}>
        ← Volver a editar el texto
      </button>
      <h2 className="mt-4 font-serif text-3xl font-light text-ink">Revisá antes de agregar</h2>
      <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
        {entradas.length === 0
          ? 'No se entendió ninguna línea.'
          : `Se entendieron ${entradas.length} ${entradas.length === 1 ? 'línea' : 'líneas'}. Nada se agrega a la hoja hasta que lo confirmes abajo.`}
      </p>

      {sinEnlace > 0 && (
        <p className={`${AVISO} mt-6`}>
          {sinEnlace === 1 ? '1 flor no se encontró' : `${sinEnlace} flores no se encontraron`} en el catálogo. Elegí la
          que corresponde debajo de cada línea, o dejala sin enlace: saldrá con su nombre, sin foto.
        </p>
      )}

      {entradas.length > 0 && (
        <ul className="mt-8 border-t border-line">
          {entradas.map((e, i) => {
            const accion = actionFor(items, e);
            const { match } = e;
            const flor = match.kind === 'flor' ? flowers.find((f) => f.id === match.flowerId) : undefined;
            const nota = flor ? availabilityNote(flor, destination) : null;
            const raro = priceRange({ bunchPrice: e.row.price, stemsPerBunch: undefined });
            return (
              <li key={`${e.row.line}-${e.row.name}`} className="border-b border-line py-4">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={e.incluir}
                    onChange={(ev) => cambiar(i, { incluir: ev.target.checked })}
                    aria-label={`Usar ${e.row.name}`}
                    className="mt-1.5 h-5 w-5 shrink-0 accent-ink"
                  />
                  <div className={`min-w-0 flex-1 ${e.incluir ? '' : 'opacity-50'}`}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <p className="font-serif text-xl font-light text-ink">{e.row.name}</p>
                      <p className="font-serif text-xl font-light text-ink">{dolares(e.row.price)}</p>
                    </div>
                    <p className="label mt-1 text-muted">
                      {accion.tipo === 'actualiza'
                        ? `Ya está en la hoja · el precio pasa de ${dolares(accion.antes)} a ${dolares(e.row.price)}`
                        : 'Flor nueva en la hoja'}
                    </p>
                    {(nota?.fuera || raro) && (
                      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        {nota?.fuera && <span className={ETIQ_DESTINO}>{nota.text}</span>}
                        {raro && <span className={ETIQ_DESTINO}>Revisar el precio</span>}
                      </p>
                    )}
                    <div className="mt-2">
                      <label htmlFor={`enlace-${i}`} className="sr-only">
                        Flor del catálogo para {e.row.name}
                      </label>
                      <select
                        id={`enlace-${i}`}
                        value={valorDe(e.match)}
                        onChange={(ev) => cambiar(i, { match: matchDe(ev.target.value) })}
                        className={FIELD}
                      >
                        <option value="">Sin enlace al catálogo (solo el nombre)</option>
                        <optgroup label="Categorías">
                          {CATEGORIES.map((c) => (
                            <option key={c.slug} value={`cat:${c.slug}`}>
                              {c.label} · todas las variedades
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Flores del catálogo">
                          {activas.map((f) => {
                            const n = availabilityNote(f, destination);
                            return (
                              <option key={f.id} value={`flor:${f.id}`}>
                                {f.name}
                                {n.fuera && info ? ` (no llega a ${info.label})` : ''}
                              </option>
                            );
                          })}
                        </optgroup>
                      </select>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {ignoradas.length > 0 && (
        <section className="mt-10">
          <h3 className="label text-muted">No se usaron ({ignoradas.length})</h3>
          <ul className="mt-2 border-t border-line">
            {ignoradas.map((g) => (
              <li key={`${g.line}-${g.text}`} className="border-b border-line py-3 text-[14px] leading-snug">
                <span className="text-ink">«{g.text}»</span> <span className="text-muted">{g.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sinTocar.length > 0 && entradas.length > 0 && (
        <p className="mt-8 max-w-xl text-[14px] leading-relaxed text-muted">
          Estas flores ya estaban en la hoja y no aparecen en lo que pegaste, así que quedan como están:{' '}
          {sinTocar.join(', ')}.
        </p>
      )}

      {demasiadas && (
        <p className={`${AVISO} mt-6`}>
          Con estas, la hoja tendría {resultado.items.length} flores y el máximo son {MAX_FLORES}. Desmarcá algunas.
        </p>
      )}

      <div className="sticky bottom-0 z-10 -mx-6 mt-10 border-t border-line bg-paper px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 py-3">
          <p className="label text-muted" aria-live="polite">
            {total > 0 ? resumen : 'Nada seleccionado'}
          </p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={onCancelar} className={ACCION_SUAVE}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onAplicar(resultado)}
              disabled={total === 0 || demasiadas}
              className={BOTON}
            >
              {total === 0 ? 'Agregar a la hoja' : `Agregar a la hoja (${total})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
