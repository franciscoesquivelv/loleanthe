'use client';

import Image from 'next/image';
import type { Dispatch, SetStateAction } from 'react';
import type { Flower } from '@/lib/types';
import { ACCION_SUAVE, BOTON, FIELD } from './ui';

export interface ItemForm {
  slug: string;
  name: string;
  size: string;
  stemsPerBunch: string;
  price: string;
  catalogFlowerId: string;
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
  catalogFlowerId: '',
  catalogSearch: '',
  categorySlug: '',
  image: '',
  note: '',
};

/** El formulario de una flor de la hoja, como vista propia. */
export default function ItemEditor({
  form,
  setForm,
  imagePreview,
  onElegirFoto,
  coincidencias,
  onBuscar,
  onElegirFlor,
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
  coincidencias: Flower[];
  onBuscar: (texto: string) => void;
  onElegirFlor: (flower: Flower) => void;
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
            Enlazar a una flor del catálogo (opcional)
          </label>
          <input
            id="item-catalogo"
            value={form.catalogSearch}
            onChange={(e) => onBuscar(e.target.value)}
            placeholder="Buscar flor del catálogo"
            className={FIELD}
          />
          {coincidencias.length > 0 && (
            <ul className="mt-1 border-t border-line bg-paper">
              {coincidencias.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => onElegirFlor(f)}
                    className="flex w-full items-center gap-3 px-2 py-2 text-left hover:bg-bone"
                  >
                    <div className="relative h-10 w-9 shrink-0 overflow-hidden bg-line">
                      {f.images[0] && <Image src={f.images[0]} alt="" fill sizes="36px" className="object-cover" />}
                    </div>
                    <span className="font-serif text-sm text-ink">{f.name}</span>
                    {f.category && <span className="label text-muted">{f.category}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {form.catalogSearch.trim() && coincidencias.length === 0 && !form.catalogFlowerId && (
            <p className="label mt-1 text-muted">Sin resultados</p>
          )}
          {form.catalogFlowerId && (
            <p className="label mt-2 text-muted">
              Enlazado a esta flor del catálogo ·{' '}
              <button type="button" onClick={onQuitarEnlace} className="text-ink underline underline-offset-4">
                Quitar enlace
              </button>
            </p>
          )}
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
            placeholder="Ej: 25"
            className={FIELD}
          />
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

        <div>
          <label htmlFor="item-precio" className="label mb-2 block text-muted">
            Precio por tallo (dólares)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-muted">$</span>
            <input
              id="item-precio"
              type="number"
              step="0.0001"
              min={0}
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              placeholder="0.00"
              className={FIELD}
            />
          </div>
        </div>
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
