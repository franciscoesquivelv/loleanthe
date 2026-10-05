'use client';

import Image from 'next/image';
import type { Dispatch, SetStateAction } from 'react';
import type { Category } from '@/lib/categories';
import type { PriceDestination } from '@/lib/price-destinations';
import type { Flower } from '@/lib/types';
import { parseMoneyInput, priceRange, stemPriceLabel } from '@/lib/price-sheet-rules';
import CatalogPicker, { type YaEnHoja } from './CatalogPicker';
import { ACCION_SUAVE, AVISO, BOTON, FIELD, chip } from './ui';

/** Qué número se escribió en el campo de precio: el del bunch (lo normal, es lo
 *  que dicen las listas) o el de un tallo (cuando solo se tiene ese). */
export type ModoPrecio = 'bunch' | 'tallo';

export interface ItemForm {
  slug: string;
  name: string;
  size: string;
  /** Vacío = se vende por peso, sin cantidad fija de tallos. */
  stemsPerBunch: string;
  /** Lo que se escribió, en el modo activo. */
  price: string;
  priceMode: ModoPrecio;
  catalogFlowerId: string;
  /** Lo escrito en el buscador del catálogo (no el nombre de la flor elegida). */
  catalogSearch: string;
  categorySlug: string;
  image: string;
  note: string;
}

export const itemFormVacio: ItemForm = {
  slug: '',
  name: '',
  size: '',
  stemsPerBunch: '',
  price: '',
  priceMode: 'bunch',
  catalogFlowerId: '',
  catalogSearch: '',
  categorySlug: '',
  image: '',
  note: '',
};

/** Tallos escritos: entero >= 1, o `undefined` si se dejó vacío (por peso).
 *  `null` si lo escrito no sirve. */
export function parseStems(texto: string): number | undefined | null {
  const t = texto.trim();
  if (t === '') return undefined;
  const n = Number(t);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

const aDos = (n: number) => Math.round(n * 100) / 100;

/**
 * El precio del BUNCH que sale del formulario, o por qué no se puede guardar.
 * En modo tallo se multiplica por los tallos y se redondea a centavos al
 * guardar (nunca queda un 11.350000000000001 en la base).
 */
export function precioDeFormulario(
  f: Pick<ItemForm, 'price' | 'priceMode' | 'stemsPerBunch'>
): { ok: true; bunchPrice: number | null } | { ok: false; error: string } {
  const r = parseMoneyInput(f.price, f.priceMode === 'tallo' ? 4 : 2);
  if (!r.ok) return r;
  if (r.value == null || f.priceMode === 'bunch') return { ok: true, bunchPrice: r.value };
  const tallos = parseStems(f.stemsPerBunch);
  if (!tallos) return { ok: false, error: 'Para cargar por tallo, primero escribí los tallos por bunch.' };
  return { ok: true, bunchPrice: aDos(r.value * tallos) };
}

/** El formulario de una flor de la hoja, como vista propia. */
export default function ItemEditor({
  form,
  setForm,
  imagePreview,
  onElegirFoto,
  flowers,
  destination,
  yaEnHoja,
  onElegirFlor,
  onElegirCategoria,
  onQuitarEnlace,
  onGuardar,
  onCancelar,
  guardando,
  paso,
}: {
  form: ItemForm;
  setForm: Dispatch<SetStateAction<ItemForm>>;
  imagePreview: string;
  onElegirFoto: (file: File) => void;
  /** Catálogo completo; el selector deja afuera las archivadas. */
  flowers: Flower[];
  /** Destino de la hoja: decide qué flores se marcan como "No llega a …". */
  destination: PriceDestination | null;
  yaEnHoja: YaEnHoja;
  onElegirFlor: (flower: Flower) => void;
  onElegirCategoria: (categoria: Category) => void;
  onQuitarEnlace: () => void;
  onGuardar: () => void;
  onCancelar: () => void;
  guardando: boolean;
  paso: string;
}) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <button type="button" onClick={onCancelar} className={ACCION_SUAVE}>
        ← Volver a la hoja
      </button>

      <h2 className="mt-4 mb-8 font-serif text-2xl font-light text-ink">
        {form.name ? `Editando: ${form.name}` : 'Nueva flor'}
      </h2>

      <div className="flex flex-col gap-8">
        {/* Foto primero: es la decisión visual central de la tarjeta, y la
            parte lenta y asíncrona, mejor resuelta con atención fresca que
            como último paso antes de guardar. */}
        <div>
          <label className="label mb-2 block text-muted">Foto</label>
          {imagePreview ? (
            <div className="relative aspect-[4/5] w-40 overflow-hidden bg-line">
              <Image src={imagePreview} alt="" fill sizes="160px" className="object-cover" />
            </div>
          ) : (
            <div
              onClick={() => document.getElementById('foto-item-input')?.click()}
              className="flex aspect-[4/5] w-40 cursor-pointer items-center justify-center border-2 border-dashed border-line text-center transition-colors hover:border-muted"
            >
              <span className="label text-muted">Elegir foto</span>
            </div>
          )}
          <input
            id="foto-item-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onElegirFoto(file);
              e.target.value = '';
            }}
          />
          {imagePreview && (
            <button
              type="button"
              onClick={() => document.getElementById('foto-item-input')?.click()}
              className={`${ACCION_SUAVE} mt-1`}
            >
              Cambiar foto
            </button>
          )}
          {paso && <p className="label mt-2 text-muted">{paso}</p>}
        </div>

        <div>
          <label htmlFor="item-nombre" className="label mb-2 block text-muted">
            Nombre
          </label>
          <input
            id="item-nombre"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ej: Rosa Garden"
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="item-catalogo" className="label mb-2 block text-muted">
            Flor del catálogo (opcional)
          </label>
          <CatalogPicker
            flowers={flowers}
            destination={destination}
            yaEnHoja={yaEnHoja}
            busqueda={form.catalogSearch}
            onBuscar={(texto) => setForm((p) => ({ ...p, catalogSearch: texto }))}
            flowerId={form.catalogFlowerId}
            categorySlug={form.categorySlug}
            onElegirFlor={onElegirFlor}
            onElegirCategoria={onElegirCategoria}
            onQuitar={onQuitarEnlace}
          />
        </div>

        <div>
          <label htmlFor="item-tamano" className="label mb-2 block text-muted">
            Tamaño (largo de tallo)
          </label>
          <input
            id="item-tamano"
            value={form.size}
            onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))}
            placeholder="Ej: 50 cm"
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="item-tallos" className="label mb-2 block text-muted">
            Tallos por bunch
          </label>
          <input
            id="item-tallos"
            type="number"
            min={1}
            value={form.stemsPerBunch}
            onChange={(e) => setForm((p) => ({ ...p, stemsPerBunch: e.target.value }))}
            placeholder="Vacío si se vende por peso"
            className={FIELD}
          />
          <div className="mt-1 flex flex-wrap items-center gap-x-6">
            {[
              ['10', '10'],
              ['25', '25'],
              ['', 'Por peso'],
            ].map(([valor, etiqueta]) => (
              <button
                key={etiqueta}
                type="button"
                onClick={() => setForm((p) => ({ ...p, stemsPerBunch: valor }))}
                className="inline-flex min-h-11 items-center"
              >
                <span className={chip(form.stemsPerBunch.trim() === valor)}>{etiqueta}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="item-nota" className="label mb-2 block text-muted">
            Nota sobre el bunch (opcional)
          </label>
          <textarea
            id="item-nota"
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            placeholder="Ej: la finca puede empacar menos tallos según la variedad, para evitar maltrato de la flor"
            rows={2}
            className={`${FIELD} resize-none`}
          />
          <p className="label mt-1 text-muted">
            Se muestra chico, junto al tallos/bunch, en la hoja pública. Usalo para cuando ese
            número no es fijo (ej. Gypsophila se vende por peso, no por cantidad).
          </p>
        </div>

        <PrecioBunch form={form} setForm={setForm} />
      </div>

      <div className="mt-10 flex items-center gap-6">
        <button type="button" onClick={onGuardar} disabled={guardando} className={BOTON}>
          {guardando ? paso || 'Guardando…' : 'Guardar flor'}
        </button>
        <button type="button" onClick={onCancelar} className={ACCION_SUAVE}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

/** El precio: el campo grande es el del bunch (lo que dicen las listas); el del
 *  tallo se calcula solo y se muestra al lado, nunca se escribe a mano a menos
 *  que se pida. */
function PrecioBunch({
  form,
  setForm,
}: {
  form: ItemForm;
  setForm: Dispatch<SetStateAction<ItemForm>>;
}) {
  const modoTallo = form.priceMode === 'tallo';
  const tallos = parseStems(form.stemsPerBunch);
  const r = precioDeFormulario(form);
  const bunchPrice = r.ok ? r.bunchPrice : null;
  const item = { bunchPrice, stemsPerBunch: tallos ?? undefined };
  const rango = priceRange(item);
  const porTallo = stemPriceLabel(item);

  const cambiarModo = (modo: ModoPrecio) => setForm((p) => ({ ...p, priceMode: modo }));

  let equivale: string | null = null;
  if (r.ok) {
    if (modoTallo) {
      equivale =
        bunchPrice != null && tallos
          ? `Equivale a $${bunchPrice.toFixed(2)} por bunch de ${tallos} tallos (${(parseMoneyInput(form.price, 4) as { value: number }).value} × ${tallos}).`
          : null;
    } else if (bunchPrice != null) {
      equivale = porTallo
        ? `Equivale a ${porTallo.approx ? '≈ ' : ''}$${porTallo.text} por tallo (${bunchPrice.toFixed(2)} ÷ ${tallos}).`
        : 'Sin cantidad de tallos, la hoja no muestra el precio por tallo.';
    }
  }

  return (
    <div>
      <label htmlFor="item-precio" className="label mb-2 block text-muted">
        {modoTallo ? 'Precio por tallo (dólares)' : 'Precio por bunch (dólares)'}
      </label>
      <div className="flex items-baseline gap-3 border-b border-muted/80 transition-colors focus-within:border-ink">
        <span className="font-serif text-3xl font-light text-muted">$</span>
        <input
          id="item-precio"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          value={form.price}
          onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
          className="w-28 border-0 bg-transparent py-2 font-serif text-3xl font-light text-ink placeholder:text-muted focus-visible:outline-none!"
        />
        <span className="text-[14px] text-muted">
          {modoTallo ? 'por tallo' : `por bunch${tallos ? ` de ${tallos} tallos` : ''}`}
        </span>
      </div>

      {!r.ok && <p className="mt-3 text-[14px] text-ink">{r.error}</p>}
      {equivale && (
        <p className="mt-3 text-[14px] text-ink" aria-live="polite">
          {equivale}
        </p>
      )}

      {r.ok && rango && (
        <div className={`${AVISO} mt-4`}>
          {modoTallo
            ? rango === 'bajo'
              ? 'Es muy poco para una flor.'
              : 'Es mucho para un solo tallo. ¿Es el precio del bunch?'
            : rango === 'bajo'
              ? 'Es muy poco para una flor. ¿Escribiste el precio por tallo?'
              : 'Es mucho para una flor. ¿Escribiste el precio por bunch en un lugar equivocado?'}{' '}
          <button
            type="button"
            onClick={() => cambiarModo(modoTallo ? 'bunch' : 'tallo')}
            className="underline underline-offset-4"
          >
            {modoTallo ? 'Sí, es por bunch' : 'Sí, es por tallo'}
          </button>
        </div>
      )}

      <div className="mt-1">
        <button type="button" onClick={() => cambiarModo(modoTallo ? 'bunch' : 'tallo')} className={ACCION_SUAVE}>
          {modoTallo ? 'Volver al precio por bunch' : 'Tengo el precio por tallo'}
        </button>
      </div>
      <p className="mt-1 text-[13px] leading-snug text-muted">
        Si lo dejás vacío, la hoja dice «Precio a confirmar».
      </p>
    </div>
  );
}
