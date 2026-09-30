'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  getAllPriceSheets,
  createPriceSheet,
  updatePriceSheet,
  duplicatePriceSheet,
  publishPriceSheet,
  deletePriceSheet,
  uploadPriceItemImage,
  type PriceSheet,
  type PriceItem,
} from '@/lib/priceSheets';
import { validateImageFiles, type EtapaSubida } from '@/lib/flowers';
import { compressImage } from '@/lib/image-compress';
import type { Flower } from '@/lib/types';

// Mismo campo subrayado que ya usa el resto del admin migrado a tokens
// (ver Contact.tsx, la lista de catálogo). Toda esta pantalla es código
// nuevo, así que no hay excusa para construir un campo en caja.
const FIELD =
  'w-full border-0 border-b border-line bg-transparent py-2 text-[15px] text-ink placeholder:text-muted/70 transition-colors duration-300 focus:border-ink';

const SAVE_TIMEOUT_MS = 60_000;
function conTiempoLimite<T>(promesa: Promise<T>, ms = SAVE_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promesa,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms)),
  ]);
}

function slugify(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `item-${Date.now()}`;
}

type Vista = 'list' | 'sheet' | 'item';

interface SheetForm {
  title: string;
  dateStart: string;
  dateEnd: string;
  description: string;
  items: PriceItem[];
}
const sheetFormVacio: SheetForm = { title: '', dateStart: '', dateEnd: '', description: '', items: [] };

interface ItemForm {
  slug: string;
  name: string;
  size: string;
  stemsPerBunch: string;
  price: string;
  crEnabled: boolean;
  crPrice: string;
  gtEnabled: boolean;
  gtPrice: string;
  catalogFlowerId: string;
  catalogSearch: string;
  categorySlug: string;
  image: string;
  note: string;
}
const itemFormVacio: ItemForm = {
  slug: '',
  name: '',
  size: '',
  stemsPerBunch: '',
  price: '',
  crEnabled: false,
  crPrice: '',
  gtEnabled: false,
  gtPrice: '',
  catalogFlowerId: '',
  catalogSearch: '',
  categorySlug: '',
  image: '',
  note: '',
};

export default function PricingPanel({ catalogFlowers }: { catalogFlowers: Flower[] }) {
  const [cargando, setCargando] = useState(true);
  const [sheets, setSheets] = useState<PriceSheet[]>([]);
  const [vista, setVista] = useState<Vista>('list');
  const [guardando, setGuardando] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState<string | null>(null);
  const [confirmarPublicar, setConfirmarPublicar] = useState<string | null>(null);

  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [sheetForm, setSheetForm] = useState<SheetForm>(sheetFormVacio);

  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(itemFormVacio);
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string>('');
  const [paso, setPaso] = useState('');

  useEffect(() => {
    cargarHojas();
  }, []);

  const cargarHojas = async () => {
    setCargando(true);
    try {
      setSheets(await getAllPriceSheets());
    } catch (err) {
      console.error('[precios] no se pudieron cargar las hojas:', err);
      toast.error('No se pudieron cargar las hojas de precios.');
    } finally {
      setCargando(false);
    }
  };

  // ── Navegación entre las tres vistas ──────────────────────────────────

  const abrirNuevaHoja = () => {
    setEditingSheetId(null);
    setSheetForm(sheetFormVacio);
    setVista('sheet');
  };

  const abrirHoja = (sheet: PriceSheet) => {
    setEditingSheetId(sheet.id);
    setSheetForm({
      title: sheet.title,
      dateStart: sheet.dateStart,
      dateEnd: sheet.dateEnd,
      description: sheet.description,
      items: sheet.items,
    });
    setVista('sheet');
  };

  const volverALista = () => {
    setVista('list');
    cargarHojas();
  };

  const abrirNuevoItem = () => {
    setEditingItemIndex(null);
    setItemForm(itemFormVacio);
    setItemImageFile(null);
    setItemImagePreview('');
    setVista('item');
  };

  const abrirItem = (index: number) => {
    const item = sheetForm.items[index];
    setEditingItemIndex(index);
    setItemForm({
      slug: item.slug,
      name: item.name,
      size: item.size ?? '',
      stemsPerBunch: String(item.stemsPerBunch ?? ''),
      price: item.price != null ? String(item.price) : '',
      crEnabled: item.priceByCountry?.CR != null,
      crPrice: item.priceByCountry?.CR != null ? String(item.priceByCountry.CR) : '',
      gtEnabled: item.priceByCountry?.GT != null,
      gtPrice: item.priceByCountry?.GT != null ? String(item.priceByCountry.GT) : '',
      catalogFlowerId: item.catalogFlowerId ?? '',
      catalogSearch: catalogFlowers.find((f) => f.id === item.catalogFlowerId)?.name ?? '',
      categorySlug: item.categorySlug ?? '',
      image: item.image ?? '',
      note: item.note ?? '',
    });
    setItemImageFile(null);
    setItemImagePreview('');
    setVista('item');
  };

  const volverAHoja = () => setVista('sheet');

  // ── Ítems: todo local, se escribe recién cuando se guarda la hoja ───────

  const moverItem = (index: number, direccion: -1 | 1) => {
    const destino = index + direccion;
    if (destino < 0 || destino >= sheetForm.items.length) return;
    setSheetForm((p) => {
      const items = [...p.items];
      [items[index], items[destino]] = [items[destino], items[index]];
      return { ...p, items };
    });
  };

  const quitarItem = (index: number) => {
    setSheetForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== index) }));
    setConfirmarBorrado(null);
  };

  const elegirFotoItem = async (file: File) => {
    setPaso('Preparando la foto…');
    let comprimida: File;
    try {
      comprimida = await conTiempoLimite(compressImage(file), 30_000);
    } catch (err) {
      console.error('[precios] falló la preparación de la foto:', err);
      toast.error('No se pudo preparar la foto. Si viene del iPhone, exportala como JPG y volvé a intentar.', { duration: 8000 });
      setPaso('');
      return;
    }
    setPaso('');

    const error = validateImageFiles([comprimida]);
    if (error) {
      toast.error(error, { duration: 8000 });
      return;
    }

    setItemImageFile(comprimida);
    setItemImagePreview(URL.createObjectURL(comprimida));
  };

  const buscarEnCatalogo = (texto: string) => {
    setItemForm((p) => ({ ...p, catalogSearch: texto, catalogFlowerId: '' }));
  };

  const coincidenciasCatalogo =
    itemForm.catalogSearch.trim().length > 0 && !itemForm.catalogFlowerId
      ? catalogFlowers
          .filter((f) => f.name.toLowerCase().includes(itemForm.catalogSearch.trim().toLowerCase()))
          .slice(0, 5)
      : [];

  const elegirFlorCatalogo = (flower: Flower) => {
    setItemForm((p) => ({
      ...p,
      catalogFlowerId: flower.id,
      catalogSearch: flower.name,
      // Prellena, no fuerza: solo si el campo todavía está vacío. Editar una
      // flor ya enlazada no debe pisar un nombre o foto que Francisco ya
      // ajustó a mano para este envío.
      name: p.name || flower.name,
      image: p.image || flower.images[0] || p.image,
    }));
  };

  const guardarItem = async () => {
    if (!itemForm.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    setGuardando(true);
    try {
      let image = itemForm.image;
      if (itemImageFile) {
        const sheetIdParaFoto = editingSheetId ?? 'borrador';
        const slugParaFoto = itemForm.slug || slugify(itemForm.name);
        setPaso('Subiendo foto…');
        image = await conTiempoLimite(
          uploadPriceItemImage(itemImageFile, sheetIdParaFoto, slugParaFoto, (etapa: EtapaSubida, pct) =>
            setPaso(
              etapa === 'cuota'
                ? 'Revisando espacio…'
                : etapa === 'subiendo'
                  ? `Subiendo foto ${pct ?? 0}%`
                  : etapa === 'url'
                    ? 'Obteniendo enlace…'
                    : 'Actualizando contador…'
            )
          )
        );
      }

      // Firestore rechaza `undefined` como valor de campo, incluso dentro de
      // un array (getDb() no usa ignoreUndefinedProperties). Como la hoja
      // entera se reescribe completa cada vez (no hay merge por ítem), omitir
      // la clave es seguro para crear Y para editar: no queda ningún valor
      // viejo colgando en otro lado que un merge pudiera dejar sin tocar.
      const item: PriceItem = {
        slug: itemForm.slug || slugify(itemForm.name),
        name: itemForm.name.trim(),
        stemsPerBunch: Number(itemForm.stemsPerBunch) || 0,
        price: itemForm.price.trim() ? Number(itemForm.price) : null,
        ...(itemForm.size.trim() && { size: itemForm.size.trim() }),
        ...(image && { image }),
        ...(itemForm.catalogFlowerId && { catalogFlowerId: itemForm.catalogFlowerId }),
        ...(itemForm.categorySlug.trim() && { categorySlug: itemForm.categorySlug.trim() }),
        ...(itemForm.note.trim() && { note: itemForm.note.trim() }),
      };
      const priceByCountry: PriceItem['priceByCountry'] = {};
      if (itemForm.crEnabled && itemForm.crPrice.trim()) priceByCountry.CR = Number(itemForm.crPrice);
      if (itemForm.gtEnabled && itemForm.gtPrice.trim()) priceByCountry.GT = Number(itemForm.gtPrice);
      if (Object.keys(priceByCountry).length > 0) item.priceByCountry = priceByCountry;

      setSheetForm((p) => {
        const items = [...p.items];
        if (editingItemIndex != null) items[editingItemIndex] = item;
        else items.push(item);
        return { ...p, items };
      });

      toast.success('Ítem listo. Se guarda con la temporada.');
      setVista('sheet');
    } catch (err) {
      console.error('[precios] falló el guardado del ítem:', err);
      const msg = (err as Error)?.message;
      toast.error(
        msg === 'STORAGE_LIMIT_REACHED'
          ? 'El almacenamiento está lleno. Elimina imágenes antes de subir nuevas.'
          : msg === 'TIMEOUT'
            ? 'La subida se quedó esperando al servidor. Revisá tu conexión y volvé a intentar.'
            : 'No se pudo preparar el ítem. Mirá la consola para el detalle.',
        { duration: 8000 }
      );
    } finally {
      setGuardando(false);
      setPaso('');
    }
  };

  // ── La hoja: acá sí se escribe a Firestore ──────────────────────────────

  const guardarHoja = async () => {
    if (!sheetForm.title.trim()) {
      toast.error('El título es requerido');
      return;
    }
    if (!sheetForm.dateStart || !sheetForm.dateEnd) {
      toast.error('Las fechas de inicio y fin son requeridas');
      return;
    }
    setGuardando(true);
    try {
      if (editingSheetId) {
        await conTiempoLimite(updatePriceSheet(editingSheetId, sheetForm));
        toast.success('Temporada actualizada');
      } else {
        const id = await conTiempoLimite(createPriceSheet(sheetForm));
        setEditingSheetId(id);
        toast.success('Temporada creada como borrador');
      }
    } catch (err) {
      console.error('[precios] falló el guardado de la hoja:', err);
      toast.error('No se pudo guardar la temporada. Mirá la consola para el detalle.', { duration: 8000 });
    } finally {
      setGuardando(false);
    }
  };

  const duplicar = async (sheet: PriceSheet) => {
    try {
      await duplicatePriceSheet(sheet.id);
      toast.success('Duplicada como borrador nuevo');
      cargarHojas();
    } catch (err) {
      console.error('[precios] falló duplicar:', err);
      toast.error('No se pudo duplicar la temporada.');
    }
  };

  const publicar = async (sheet: PriceSheet) => {
    if (confirmarPublicar !== sheet.id) {
      setConfirmarPublicar(sheet.id);
      setTimeout(() => setConfirmarPublicar(null), 3000);
      return;
    }
    try {
      await publishPriceSheet(sheet.id);
      toast.success('Publicada. El sitio se actualiza en el momento.');
      setConfirmarPublicar(null);
      cargarHojas();
    } catch (err) {
      console.error('[precios] falló publicar:', err);
      toast.error('No se pudo publicar la temporada.');
    }
  };

  const borrar = async (sheet: PriceSheet) => {
    if (confirmarBorrado !== sheet.id) {
      setConfirmarBorrado(sheet.id);
      setTimeout(() => setConfirmarBorrado(null), 3000);
      return;
    }
    try {
      await deletePriceSheet(sheet);
      toast.success('Eliminada');
      setConfirmarBorrado(null);
      cargarHojas();
    } catch (err) {
      const msg = (err as Error)?.message;
      toast.error(
        msg === 'NO_SE_PUEDE_BORRAR_PUBLICADA'
          ? 'No se puede eliminar la temporada publicada. Publicá otra primero, o pasala a archivada.'
          : 'No se pudo eliminar.'
      );
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (cargando) {
    return <div className="text-center py-16 font-serif text-2xl font-light text-muted">Cargando precios…</div>;
  }

  if (vista === 'item') {
    return (
      <ItemEditor
        form={itemForm}
        setForm={setItemForm}
        imagePreview={itemImagePreview || itemForm.image}
        onElegirFoto={elegirFotoItem}
        coincidencias={coincidenciasCatalogo}
        onBuscar={buscarEnCatalogo}
        onElegirFlor={elegirFlorCatalogo}
        onQuitarEnlace={() => setItemForm((p) => ({ ...p, catalogFlowerId: '', catalogSearch: '' }))}
        onGuardar={guardarItem}
        onCancelar={volverAHoja}
        guardando={guardando}
        paso={paso}
      />
    );
  }

  if (vista === 'sheet') {
    const filas = Math.ceil(sheetForm.items.length / 3) || 0;
    const hojas = Math.ceil(sheetForm.items.length / 9) || 0;
    return (
      <div>
        <button onClick={volverALista} className="label text-muted transition-colors hover:text-ink">
          ← Volver
        </button>

        <div className="mt-4 mb-10 border-b border-line pb-8">
          <p className="label mb-4 text-muted">Esta temporada</p>
          <input
            value={sheetForm.title}
            onChange={(e) => setSheetForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Título, ej: Temporada Octubre - Diciembre"
            className="w-full border-0 border-b border-line bg-transparent py-2 font-serif text-2xl font-light text-ink placeholder:text-muted/50 focus:border-ink"
          />
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <label className="label mb-2 block text-muted">Desde</label>
              <input
                type="date"
                value={sheetForm.dateStart}
                onChange={(e) => setSheetForm((p) => ({ ...p, dateStart: e.target.value }))}
                className={FIELD}
              />
            </div>
            <div>
              <label className="label mb-2 block text-muted">Hasta</label>
              <input
                type="date"
                value={sheetForm.dateEnd}
                onChange={(e) => setSheetForm((p) => ({ ...p, dateEnd: e.target.value }))}
                className={FIELD}
              />
            </div>
          </div>
          <textarea
            value={sheetForm.description}
            onChange={(e) => setSheetForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Descripción que ve el visitante arriba de la lista de precios"
            rows={3}
            maxLength={2000}
            className={`${FIELD} mt-6 resize-none`}
          />
          <button
            onClick={guardarHoja}
            disabled={guardando}
            className="label group mt-6 inline-flex items-center gap-3 text-ink disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Guardar temporada'}
            <span className="h-px w-8 bg-ink transition-all duration-500 group-hover:w-14" />
          </button>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-light text-ink">Flores de esta temporada</h2>
            <p className="label mt-1 text-muted">
              {sheetForm.items.length} {sheetForm.items.length === 1 ? 'ítem' : 'ítems'} · {filas} {filas === 1 ? 'fila' : 'filas'} al imprimir · {hojas} {hojas === 1 ? 'hoja' : 'hojas'}
            </p>
          </div>
          <button onClick={abrirNuevoItem} className="bg-ink px-5 py-2.5 label text-bone transition-all duration-300 hover:bg-ink/85">
            + Agregar flor
          </button>
        </div>

        {sheetForm.items.length === 0 ? (
          <p className="border-t border-line py-16 text-center text-[15px] text-muted">
            Todavía no hay flores en esta temporada.
          </p>
        ) : (
          <ul className="border-t border-line">
            {sheetForm.items.map((item, i) => (
              <li key={`${item.slug}-${i}`} className="flex items-start gap-4 border-b border-line py-4">
                <div className="mt-4 flex shrink-0 flex-col text-center">
                  <button
                    onClick={() => moverItem(i, -1)}
                    disabled={i === 0}
                    className="label text-muted transition-colors hover:text-ink disabled:opacity-30"
                  >
                    Subir
                  </button>
                  <button
                    onClick={() => moverItem(i, 1)}
                    disabled={i === sheetForm.items.length - 1}
                    className="label mt-1 text-muted transition-colors hover:text-ink disabled:opacity-30"
                  >
                    Bajar
                  </button>
                </div>

                <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-line">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center font-serif text-lg text-muted">
                      {item.name.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg font-light leading-tight text-ink">{item.name}</p>
                  <p className="label mt-1 text-muted">
                    {[item.size, `${item.stemsPerBunch} tallos`].filter(Boolean).join(' · ')}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="text-[13px] text-ink">
                      {item.price != null ? `$${item.price.toFixed(2)} por tallo` : 'Precio a confirmar'}
                    </span>
                    {item.priceByCountry?.CR != null && (
                      <span className="label border-b border-ink pb-0.5 text-ink">CR ${item.priceByCountry.CR.toFixed(2)}</span>
                    )}
                    {item.priceByCountry?.GT != null && (
                      <span className="label border-b border-ink pb-0.5 text-ink">GT ${item.priceByCountry.GT.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-5">
                    <button onClick={() => abrirItem(i)} className="label text-ink transition-opacity hover:opacity-60">
                      Editar
                    </button>
                    <button
                      onClick={() => quitarItem(i)}
                      className={`label transition-colors ${confirmarBorrado === `item-${i}` ? 'text-ink underline underline-offset-4' : 'text-muted hover:text-ink'}`}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // vista === 'list'
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light text-ink">Precios</h1>
          <p className="label mt-1 text-muted">{sheets.length} {sheets.length === 1 ? 'temporada' : 'temporadas'}</p>
        </div>
        <button onClick={abrirNuevaHoja} className="bg-ink px-6 py-3 label text-bone transition-all duration-300 hover:bg-ink/85">
          + Nueva hoja
        </button>
      </div>

      {sheets.length === 0 ? (
        <div className="border border-dashed border-line py-20 text-center">
          <p className="font-serif text-3xl font-light text-muted">Vacío</p>
          <p className="mt-4 text-[15px] text-muted">Todavía no hay ninguna hoja de precios.</p>
          <button onClick={abrirNuevaHoja} className="label mt-6 border-b border-ink pb-1 text-ink">
            Crear la primera
          </button>
        </div>
      ) : (
        <ul className="border-t border-line">
          {sheets.map((sheet) => (
            <li key={sheet.id} className="flex items-center justify-between gap-4 border-b border-line py-5">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <p className="font-serif text-lg font-light text-ink">{sheet.title}</p>
                  <span className="label text-muted">
                    {sheet.status === 'published' ? 'Publicada' : sheet.status === 'draft' ? 'Borrador' : 'Archivada'}
                  </span>
                </div>
                <p className="label mt-1 text-muted">
                  {sheet.dateStart} a {sheet.dateEnd} · {sheet.items.length} {sheet.items.length === 1 ? 'ítem' : 'ítems'}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-5">
                <button onClick={() => abrirHoja(sheet)} className="label text-ink transition-opacity hover:opacity-60">
                  Editar
                </button>
                <button onClick={() => duplicar(sheet)} className="label text-muted transition-colors hover:text-ink">
                  Duplicar
                </button>
                {sheet.status === 'draft' && (
                  <button
                    onClick={() => publicar(sheet)}
                    className={`label transition-colors ${confirmarPublicar === sheet.id ? 'text-ink underline underline-offset-4' : 'text-muted hover:text-ink'}`}
                  >
                    {confirmarPublicar === sheet.id ? '¿Confirmar?' : 'Publicar'}
                  </button>
                )}
                <button
                  onClick={() => borrar(sheet)}
                  className={`label transition-colors ${confirmarBorrado === sheet.id ? 'text-ink underline underline-offset-4' : 'text-muted hover:text-ink'}`}
                >
                  {confirmarBorrado === sheet.id ? '¿Confirmar?' : 'Eliminar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {sheets.length > 0 && (
        <p className="label mt-8 text-muted">
          Ver la hoja pública: General ·{' '}
          <a href="/precios" target="_blank" rel="noreferrer" className="text-ink underline underline-offset-4">General</a> ·{' '}
          <a href="/precios-cr" target="_blank" rel="noreferrer" className="text-ink underline underline-offset-4">Costa Rica</a> ·{' '}
          <a href="/precios-gt" target="_blank" rel="noreferrer" className="text-ink underline underline-offset-4">Guatemala</a>
        </p>
      )}
    </div>
  );
}

// ── El formulario de un ítem, como vista propia ──────────────────────────

function ItemEditor({
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
  setForm: React.Dispatch<React.SetStateAction<ItemForm>>;
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
    <div className="max-w-xl">
      <button onClick={onCancelar} className="label text-muted transition-colors hover:text-ink">
        ← Volver a la temporada
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
              onClick={() => document.getElementById('foto-item-input')?.click()}
              className="label mt-2 text-muted transition-colors hover:text-ink"
            >
              Cambiar foto
            </button>
          )}
          {paso && <p className="label mt-2 text-muted">{paso}</p>}
        </div>

        <div>
          <label className="label mb-2 block text-muted">Nombre</label>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ej: Rosa Garden"
            className={FIELD}
          />
        </div>

        <div>
          <label className="label mb-2 block text-muted">Enlazar a una flor del catálogo (opcional)</label>
          <input
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
              <button onClick={onQuitarEnlace} className="text-ink underline underline-offset-4">Quitar enlace</button>
            </p>
          )}
        </div>

        <div>
          <label className="label mb-2 block text-muted">Tamaño (largo de tallo)</label>
          <input
            value={form.size}
            onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))}
            placeholder="Ej: 50 cm"
            className={FIELD}
          />
        </div>

        <div>
          <label className="label mb-2 block text-muted">Tallos por bunch</label>
          <input
            type="number"
            min={1}
            value={form.stemsPerBunch}
            onChange={(e) => setForm((p) => ({ ...p, stemsPerBunch: e.target.value }))}
            placeholder="Ej: 25"
            className={FIELD}
          />
        </div>

        <div>
          <label className="label mb-2 block text-muted">Nota sobre el bunch (opcional)</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            placeholder="Ej: la finca puede empacar menos tallos según la variedad, para evitar maltrato de la flor"
            rows={2}
            className={`${FIELD} resize-none`}
          />
          <p className="label mt-1 text-muted/70">
            Se muestra chico, junto al tallos/bunch, en la hoja pública. Usalo para cuando ese
            número no es fijo (ej. Gypsophila se vende por peso, no por cantidad).
          </p>
        </div>

        <div>
          <label className="label mb-2 block text-muted">Precio general (por tallo)</label>
          <div className="flex items-center gap-2">
            <span className="text-muted">$</span>
            <input
              type="number"
              step="0.01"
              min={0}
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              placeholder="0.00"
              className={FIELD}
            />
          </div>
        </div>

        <PaisPrecio
          label="Precio distinto en Costa Rica"
          enabled={form.crEnabled}
          price={form.crPrice}
          onToggle={() =>
            setForm((p) => ({ ...p, crEnabled: !p.crEnabled, crPrice: !p.crEnabled ? p.price : p.crPrice }))
          }
          onPriceChange={(v) => setForm((p) => ({ ...p, crPrice: v }))}
        />
        <PaisPrecio
          label="Precio distinto en Guatemala"
          enabled={form.gtEnabled}
          price={form.gtPrice}
          onToggle={() =>
            setForm((p) => ({ ...p, gtEnabled: !p.gtEnabled, gtPrice: !p.gtEnabled ? p.price : p.gtPrice }))
          }
          onPriceChange={(v) => setForm((p) => ({ ...p, gtPrice: v }))}
        />
      </div>

      <div className="mt-10 flex items-center gap-6">
        <button
          onClick={onGuardar}
          disabled={guardando}
          className="bg-ink px-6 py-3 label text-bone transition-all duration-300 hover:bg-ink/85 disabled:opacity-50"
        >
          {guardando ? paso || 'Guardando…' : 'Guardar ítem'}
        </button>
        <button onClick={onCancelar} className="label text-muted transition-colors hover:text-ink">
          Cancelar
        </button>
      </div>
    </div>
  );
}

/** Switch que revela un campo de precio prellenado con el general, no vacío:
 *  encenderlo no debe presentar un "$0.00" para inventar desde cero. */
function PaisPrecio({
  label,
  enabled,
  price,
  onToggle,
  onPriceChange,
}: {
  label: string;
  enabled: boolean;
  price: string;
  onToggle: () => void;
  onPriceChange: (v: string) => void;
}) {
  return (
    <div>
      <button type="button" role="switch" aria-checked={enabled} onClick={onToggle} className="group flex items-center gap-3">
        <span className={`relative h-6 w-12 transition-colors ${enabled ? 'bg-ink' : 'bg-line'}`}>
          <span className={`absolute top-1 h-4 w-4 bg-bone transition-all ${enabled ? 'left-7' : 'left-1'}`} />
        </span>
        <span className="label text-ink">{label}</span>
      </button>
      {enabled && (
        <div className="mt-3 flex items-center gap-2 pl-15">
          <span className="text-muted">$</span>
          <input
            type="number"
            step="0.01"
            min={0}
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            className={FIELD}
          />
        </div>
      )}
    </div>
  );
}
