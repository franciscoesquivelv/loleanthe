'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import type { PriceItem, PriceSheet } from '@/lib/priceSheets';
import { availabilityNote, availabilityWarnings, priceRange, repartir, stemPriceLabel } from '@/lib/price-sheet-rules';
import type { Flower } from '@/lib/types';
import {
  PRICE_DESTINATIONS,
  destinationInfo,
  urlDe,
  urlVisible,
  type PriceDestination,
} from '@/lib/price-destinations';
import PrecioEnLinea from './PrecioEnLinea';
import { ACCION, ACCION_PRINC, ACCION_SUAVE, AVISO, BOTON, ETIQ_DESTINO, FIELD } from './ui';

export interface SheetFormState {
  title: string;
  dateStart: string;
  dateEnd: string;
  description: string;
  /** `null` = todavía sin elegir. Al crear una hoja NO hay valor por defecto. */
  destination: PriceDestination | null;
  items: PriceItem[];
}

const MAX_TITULO = 60;
const MAX_DESCRIPCION = 400;

/**
 * Editor de una hoja: PARA QUIÉN es va primero, porque enmarca todo lo demás
 * (en qué enlace sale, qué moneda de referencia lleva, qué flores llegan).
 */
export default function SheetEditor({
  form,
  setForm,
  sheet,
  catalogFlowers,
  vivasPorDestino,
  dirty,
  guardando,
  onVolver,
  onGuardar,
  onGuardarYPublicar,
  onDescartar,
  onPublicar,
  onMover,
  onAgregarFlor,
  onPegar,
  onVistaPrevia,
  onCambiarPrecio,
  onEditarItem,
  onMoverItem,
  onQuitarItem,
}: {
  form: SheetFormState;
  setForm: Dispatch<SetStateAction<SheetFormState>>;
  /** La hoja guardada; `null` mientras es nueva y todavía no se guardó. */
  sheet: PriceSheet | null;
  /** El catálogo, para marcar qué flores no llegan al destino de la hoja. */
  catalogFlowers: Flower[];
  /** La hoja publicada hoy en cada destino, para decir qué reemplazaría esta. */
  vivasPorDestino: Partial<Record<PriceDestination, PriceSheet>>;
  dirty: boolean;
  guardando: boolean;
  onVolver: () => void;
  onGuardar: () => void;
  /** Guarda y, sin soltar la hoja, abre la confirmación de publicar. */
  onGuardarYPublicar: () => void;
  onDescartar: () => void;
  onPublicar: () => void;
  /** Hoja viva: abre el diálogo de "Mover a otro destino". */
  onMover: () => void;
  onAgregarFlor: () => void;
  /** Abre la pantalla de pegar una lista de precios. */
  onPegar: () => void;
  /** Abre la hoja como la ve el cliente, con lo que hay en el formulario. */
  onVistaPrevia: () => void;
  /** Cambia solo el precio por bunch de una flor, desde su fila. */
  onCambiarPrecio: (index: number, precio: number | null) => void;
  onEditarItem: (index: number) => void;
  onMoverItem: (index: number, direccion: -1 | 1) => void;
  onQuitarItem: (index: number) => void;
}) {
  const esNueva = !sheet;
  const viva = sheet?.status === 'published';
  const archivada = sheet?.status === 'archived';
  const dest = form.destination;
  const info = dest ? destinationInfo(dest) : null;
  const ocupante = dest ? vivasPorDestino[dest] : undefined;
  const nFlores = form.items.length;
  const flowerPorId = new Map(catalogFlowers.map((f) => [f.id, f]));
  const avisosCatalogo = availabilityWarnings(form, catalogFlowers);
  const hojasImpresas = repartir(nFlores);

  const puedePublicar = !viva && !!dest && nFlores > 0;
  // Con el país ya elegido las tres tarjetas ocupan media pantalla y solo sirven
  // para equivocarse: se muestra el país y un "Cambiar".
  const [cambiandoPais, setCambiandoPais] = useState(false);
  const mostrarTarjetas = !dest || (cambiandoPais && !viva);
  const [copiado, setCopiado] = useState(false);
  const copiarEnlace = async () => {
    if (!dest) return;
    try {
      await navigator.clipboard.writeText(urlDe(dest));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Algunos navegadores embebidos niegan el portapapeles: se muestra el
      // enlace para copiarlo a mano.
      toast(`Copia este enlace: ${urlDe(dest)}`, { duration: 10000 });
    }
  };

  const estado = esNueva ? 'Nueva' : viva ? `En vivo ${info?.en ?? ''}`.trim() : archivada ? 'Archivada' : 'Borrador';

  return (
    <div className="mx-auto w-full max-w-3xl pb-4">
      <button type="button" onClick={onVolver} className={ACCION_SUAVE}>
        ← Volver a Precios
      </button>
      <p className="label mt-2 text-muted">Hoja de precios · {estado}</p>

      {/* ── Para quién es ─────────────────────────────────────────────── */}
      <fieldset className="mt-8">
        <legend className="label text-muted">Para quién es esta hoja</legend>
        {mostrarTarjetas ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {PRICE_DESTINATIONS.map((d) => (
              <label
                key={d.code}
                className={`relative block ${viva ? `cursor-not-allowed ${dest === d.code ? '' : 'opacity-50'}` : 'cursor-pointer'}`}
              >
                <input
                  type="radio"
                  name="destino"
                  value={d.code}
                  checked={dest === d.code}
                  disabled={viva}
                  onChange={() => {
                    setForm((p) => ({ ...p, destination: d.code }));
                    setCambiandoPais(false);
                  }}
                  className="peer sr-only"
                />
                <span className="block border border-line p-4 pr-10 transition-colors hover:border-muted peer-checked:border-ink peer-checked:bg-paper peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2">
                  <span className="block font-serif text-xl font-light text-ink">{d.label}</span>
                  <span className="label mt-2 block text-muted">{d.route}</span>
                  <span className="mt-3 block text-[13px] leading-snug text-muted">{d.cardMoneda}</span>
                </span>
                <span
                  aria-hidden="true"
                  className="absolute right-4 top-4 h-2.5 w-2.5 border border-muted peer-checked:border-ink peer-checked:bg-ink"
                />
              </label>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4">
            <p className="font-serif text-3xl font-light text-ink">{info?.label}</p>
            {!viva && (
              <button type="button" onClick={() => setCambiandoPais(true)} className={ACCION_SUAVE}>
                Cambiar
              </button>
            )}
          </div>
        )}

        {viva && (
          <div className="mt-2">
            <button type="button" onClick={onMover} disabled={dirty} className={ACCION_SUAVE}>
              {(sheet?.destination ? 'Cambiar de destino…' : 'Elegir destino…') + (dirty ? ' (guardá primero)' : '')}
            </button>
          </div>
        )}

        {/* Consecuencia: qué pasa con los enlaces, dicho en la pantalla que decide */}
        <div className="mt-4 space-y-1">
          {dest && info ? (
            <>
              <p className="text-[15px] leading-relaxed text-ink">
                Esta hoja saldrá en <span className="underline underline-offset-4">{urlVisible(dest)}</span>.{' '}
                {info.currency
                  ? `Los precios se escriben en dólares; la hoja pública agrega la referencia en ${info.currency.name}.`
                  : 'Los precios se escriben en dólares y la hoja pública no agrega moneda local.'}
              </p>
              {viva ? (
                <p className={`${AVISO} mt-3`}>
                  Esta hoja está en vivo en {urlVisible(dest)}. Lo que guardes se ve apenas guardes.
                </p>
              ) : (
                <p className="text-[14px] leading-relaxed text-muted">
                  Todavía no está publicada. Cuando la publiques sale en {urlVisible(dest)}.{' '}
                  {ocupante
                    ? `Hoy ese enlace muestra «${ocupante.title}»: al publicar esta hoja, esa pasa a archivadas.`
                    : 'Hoy ese enlace no muestra ninguna hoja.'}
                </p>
              )}
            </>
          ) : (
            <p className="text-[14px] leading-relaxed text-muted">
              {esNueva ? 'Elegí para quién es la hoja.' : 'Esta hoja no tiene destino. Elegí uno para poder publicarla.'}
            </p>
          )}
        </div>
      </fieldset>

      {/* ── Datos de la hoja ──────────────────────────────────────────── */}
      <section className="mt-10 border-t border-line pt-8">
        <p className="label text-muted">Datos de la hoja</p>
        <input
          value={form.title}
          maxLength={MAX_TITULO}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="Título, ej: Temporada Octubre - Diciembre"
          aria-label="Título de la hoja"
          className="mt-4 w-full border-0 border-b border-muted/80 bg-transparent py-2 font-serif text-xl font-light text-ink transition-colors placeholder:text-muted focus:border-ink md:text-2xl"
        />
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="fecha-desde" className="label mb-2 block text-muted">
              Desde
            </label>
            <input
              id="fecha-desde"
              type="date"
              value={form.dateStart}
              onChange={(e) => setForm((p) => ({ ...p, dateStart: e.target.value }))}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="fecha-hasta" className="label mb-2 block text-muted">
              Hasta
            </label>
            <input
              id="fecha-hasta"
              type="date"
              value={form.dateEnd}
              onChange={(e) => setForm((p) => ({ ...p, dateEnd: e.target.value }))}
              className={FIELD}
            />
            {form.dateStart && form.dateEnd && form.dateEnd < form.dateStart && (
              <p className="mt-1 text-[13px] text-ink">La fecha final es anterior a la inicial.</p>
            )}
          </div>
        </div>
        <div className="mt-6">
          <label htmlFor="descripcion" className="label mb-2 block text-muted">
            Descripción
          </label>
          <textarea
            id="descripcion"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Lo que ve el visitante arriba de la lista de precios"
            rows={3}
            maxLength={MAX_DESCRIPCION}
            className={`${FIELD} resize-none`}
          />
          <p className="label mt-1 text-right text-muted">
            {form.description.length} / {MAX_DESCRIPCION}
          </p>
        </div>
      </section>

      {/* ── Flores ───────────────────────────────────────────────────── */}
      <section className="mt-10 border-t border-line pt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-light text-ink">Flores</h2>
            <p className="label mt-1 text-muted">
              {nFlores} {nFlores === 1 ? 'flor' : 'flores'}
              {nFlores > 0 && ` · se imprime en ${hojasImpresas.length} ${hojasImpresas.length === 1 ? 'hoja' : 'hojas'}${hojasImpresas.length > 1 ? ` (${hojasImpresas.join(' + ')})` : ''}`}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-6">
            <button type="button" onClick={onPegar} className={ACCION}>
              Pegar lista
            </button>
            <button type="button" onClick={onAgregarFlor} disabled={esNueva} className={BOTON}>
              + Agregar flor
            </button>
          </div>
        </div>
        {esNueva && (
          <p className="mt-3 max-w-md text-[14px] text-muted">
            Podés pegar la lista de precios ahora. Para agregar flores de a una (con foto propia), guardá la hoja primero.
          </p>
        )}

        {avisosCatalogo.map((a) => (
          <p key={a.code} className={`${AVISO} mt-4`}>
            {a.text} Revisá si siguen en la hoja.
          </p>
        ))}

        {nFlores === 0 ? (
          !esNueva && (
            <div className="mt-6 border-t border-line py-10">
              <p className="text-[15px] text-muted">Todavía no hay flores en esta hoja.</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-8">
                <button type="button" onClick={onPegar} className={ACCION_PRINC}>
                  Pegar la lista de precios
                  <span className="h-px w-8 bg-ink transition-all duration-500 group-hover:w-14" />
                </button>
                <button type="button" onClick={onAgregarFlor} className={ACCION_SUAVE}>
                  Agregar una flor
                </button>
              </div>
            </div>
          )
        ) : (
          <ul className="mt-6 border-t border-line">
            {form.items.map((item, i) => (
              <li key={`${item.slug}-${i}`} className="flex items-start gap-4 border-b border-line py-4">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-line">
                  {item.image ? (
                    <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center font-serif text-lg text-muted">
                      {item.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg font-light leading-tight text-ink">{item.name}</p>
                  <p className="label mt-1 text-muted">
                    {[item.size, item.stemsPerBunch ? `${item.stemsPerBunch} tallos` : 'Tallos sin indicar'].filter(Boolean).join(' · ')}
                  </p>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <PrecioEnLinea
                      key={item.bunchPrice ?? 'sin-precio'}
                      nombre={item.name}
                      valor={item.bunchPrice}
                      onCambiar={(precio) => onCambiarPrecio(i, precio)}
                    />
                    {(() => {
                      const sp = stemPriceLabel(item);
                      return sp ? (
                        <span className="text-[13px] text-muted">
                          {sp.approx ? '≈ ' : ''}${sp.text} por tallo
                        </span>
                      ) : item.bunchPrice == null ? (
                        <span className="text-[13px] text-muted">La hoja dice «Precio a confirmar»</span>
                      ) : null;
                    })()}
                  </div>
                  {(() => {
                    const flor = item.catalogFlowerId ? flowerPorId.get(item.catalogFlowerId) : undefined;
                    const nota = flor ? availabilityNote(flor, dest) : null;
                    return (
                      (nota?.fuera || priceRange(item)) && (
                        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          {nota?.fuera && <span className={ETIQ_DESTINO}>{nota.text}</span>}
                          {priceRange(item) && <span className={ETIQ_DESTINO}>Revisar el precio</span>}
                        </p>
                      )
                    );
                  })()}
                  <div className="mt-1 flex flex-wrap items-center gap-x-6">
                    <button type="button" onClick={() => onEditarItem(i)} className={ACCION}>
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoverItem(i, -1)}
                      disabled={i === 0}
                      aria-label={`Subir ${item.name}`}
                      className={`${ACCION_SUAVE} disabled:opacity-30`}
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoverItem(i, 1)}
                      disabled={i === nFlores - 1}
                      aria-label={`Bajar ${item.name}`}
                      className={`${ACCION_SUAVE} disabled:opacity-30`}
                    >
                      Bajar
                    </button>
                    <button type="button" onClick={() => onQuitarItem(i)} className={ACCION_SUAVE}>
                      Quitar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Barra inferior: estado a la izquierda, las acciones a la derecha. En
          el celular las acciones pasan a una segunda línea en vez de apretarse. ── */}
      <div className="sticky bottom-0 z-10 -mx-6 mt-10 border-t border-line bg-paper px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
          <p className="label text-muted" aria-live="polite">
            {dirty || esNueva
              ? 'Sin guardar'
              : viva
                ? `En vivo ${info?.en ?? ''}`.trim()
                : archivada
                  ? 'Archivada'
                  : nFlores === 0
                    ? 'Guardada · agregá al menos una flor'
                    : 'Guardada'}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-x-5">
            <button type="button" onClick={onVistaPrevia} disabled={nFlores === 0} className={ACCION_SUAVE}>
              Vista previa
            </button>
            {dirty || esNueva ? (
              <>
                {!esNueva && (
                  <button type="button" onClick={onDescartar} disabled={guardando} className={ACCION_SUAVE}>
                    Descartar
                  </button>
                )}
                {puedePublicar ? (
                  <>
                    <button type="button" onClick={onGuardar} disabled={guardando} className={ACCION}>
                      {archivada ? 'Guardar' : 'Guardar borrador'}
                    </button>
                    <button type="button" onClick={onGuardarYPublicar} disabled={guardando} className={BOTON}>
                      {guardando ? 'Guardando…' : 'Guardar y publicar'}
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={onGuardar} disabled={guardando} className={BOTON}>
                    {guardando ? 'Guardando…' : 'Guardar'}
                  </button>
                )}
              </>
            ) : viva && dest ? (
              <>
                <button type="button" onClick={copiarEnlace} className={ACCION_SUAVE}>
                  {copiado ? 'Copiado' : 'Copiar enlace'}
                </button>
                <a href={urlDe(dest)} target="_blank" rel="noopener noreferrer" className={ACCION}>
                  Abrir el enlace
                </a>
              </>
            ) : (
              <button type="button" onClick={onPublicar} disabled={!puedePublicar} className={BOTON}>
                {archivada ? 'Volver a publicar' : 'Publicar'}
                {info ? ` ${info.en}` : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
