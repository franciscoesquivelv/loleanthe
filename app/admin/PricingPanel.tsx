'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getAllPriceSheets,
  getPriceSheetById,
  createPriceSheet,
  updatePriceSheet,
  duplicatePriceSheet,
  publishPriceSheet,
  unpublishPriceSheet,
  changePriceSheetDestination,
  deletePriceSheet,
  uploadPriceItemImage,
  type PriceSheet,
  type PriceItem,
  type PublishResult,
} from '@/lib/priceSheets';
import { availabilityWarnings, checkSheet, hoyLocal, planPlacement, PriceSheetError } from '@/lib/price-sheet-rules';
import { finDeTemporada, nombreDeTemporada } from '@/lib/temporada';
import { slugDe, type ImportResult } from '@/lib/price-import';
import type { Category } from '@/lib/categories';
import {
  PRICE_DESTINATIONS,
  SIN_HOJA_TITULO,
  destinationInfo,
  urlVisible,
  type PriceDestination,
} from '@/lib/price-destinations';
import { validateImageFiles, type EtapaSubida } from '@/lib/flowers';
import { compressImage } from '@/lib/image-compress';
import type { Flower } from '@/lib/types';
import ConfirmDialog from './precios/ConfirmDialog';
import ItemEditor, { itemFormVacio, parseStems, precioDeFormulario, type ItemForm, type ModoPrecio } from './precios/ItemEditor';
import LinksList from './precios/LinksList';
import PasteList from './precios/PasteList';
import SheetEditor, { type SheetFormState } from './precios/SheetEditor';
import VistaPrevia from './precios/VistaPrevia';
import { AVISO } from './precios/ui';

const SAVE_TIMEOUT_MS = 60_000;
function conTiempoLimite<T>(promesa: Promise<T>, ms = SAVE_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promesa,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms)),
  ]);
}

type Vista = 'list' | 'sheet' | 'item' | 'pegar';

type Dialogo =
  | { tipo: 'publicar'; sheet: PriceSheet }
  | { tipo: 'quitar'; sheet: PriceSheet }
  /** `sheet.destination` puede ser null: una hoja publicada sin destino (vieja)
   *  se "mueve" desde ninguna parte, y el diálogo es el de elegirle uno. */
  | { tipo: 'mover'; sheet: PriceSheet; destino: PriceDestination }
  | { tipo: 'eliminar'; sheet: PriceSheet }
  | { tipo: 'salir' };

const formVacio = (destination: PriceDestination | null = null): SheetFormState => ({
  title: '',
  dateStart: '',
  dateEnd: '',
  description: '',
  destination,
  items: [],
});

/** Una hoja nueva arranca con lo que casi siempre se escribe igual: las fechas de
 *  la temporada (de hoy al fin del segundo mes siguiente) y su nombre, como
 *  "Temporada Octubre - Diciembre". Todo se puede cambiar; solo se ahorra
 *  empezar de cero un campo obligatorio. */
const formNuevo = (destination: PriceDestination | null): SheetFormState => {
  const hoy = hoyLocal();
  const fin = finDeTemporada(hoy);
  return { ...formVacio(destination), title: nombreDeTemporada(hoy, fin), dateStart: hoy, dateEnd: fin };
};

/** Qué se le dice a quien administra cuando algo falla y no es culpa suya. */
const SI_SIGUE = 'Si vuelve a pasar, avísale a Francisco y mándale una captura de pantalla.';

const formDe = (s: PriceSheet): SheetFormState => ({
  title: s.title,
  dateStart: s.dateStart,
  dateEnd: s.dateEnd,
  description: s.description,
  destination: s.destination,
  items: s.items,
});

const flores = (n: number) => `${n} ${n === 1 ? 'flor' : 'flores'}`;

/** Lo que se le dice a quien administra cuando una acción de hojas falla: en
 *  español y con lo que tiene que hacer, no el código del error. */
function mensajeDeError(err: unknown, accion: string): string {
  if (err instanceof PriceSheetError) {
    switch (err.code) {
      case 'HOJA_NO_ENCONTRADA':
        return 'Esa hoja ya no existe. Recargá la lista.';
      case 'SIN_DESTINO':
        return 'La hoja no tiene destino. Elegí uno antes de publicarla.';
      case 'DESTINO_INVALIDO':
        return 'Ese destino no es válido.';
      case 'HOJA_INVALIDA': {
        const textos = (err.detail as { text: string }[] | undefined)?.map((e) => e.text);
        return textos?.length ? textos.join(' ') : 'La hoja tiene datos que hay que corregir.';
      }
      case 'REEMPLAZO_NO_CONFIRMADO':
        return 'La lista cambió mientras la mirabas. Cerrá este aviso y revisá de nuevo.';
      case 'NO_SE_PUEDE_BORRAR_PUBLICADA':
        return 'Una hoja en vivo no se elimina. Quitala del enlace primero.';
    }
  }
  if ((err as Error)?.message === 'TIMEOUT') {
    return 'El servidor tardó demasiado. Revisá tu conexión y probá de nuevo.';
  }
  const codigo = (err as { code?: string })?.code ?? '';
  if (codigo.includes('permission-denied') || codigo.includes('unauthenticated')) {
    // Firebase comparte la sesión entre pestañas: volver a entrar en otra basta,
    // y lo escrito en esta pantalla no se pierde.
    return 'No se aceptó el guardado. Lo más probable es que se haya cerrado tu sesión: abrí loleanthe.com/admin en otra pestaña, iniciá sesión y volvé acá a guardar (lo que escribiste sigue en esta pantalla). Si no se arregla, avísale a Francisco.';
  }
  return `No se pudo ${accion}. Revisá tu conexión y probá de nuevo. ${SI_SIGUE}`;
}

export default function PricingPanel({ catalogFlowers }: { catalogFlowers: Flower[] }) {
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [sheets, setSheets] = useState<PriceSheet[]>([]);
  const [vista, setVista] = useState<Vista>('list');
  const [guardando, setGuardando] = useState(false);

  // La hoja abierta en el editor: la guardada (null si es nueva) y el formulario.
  const [editing, setEditing] = useState<PriceSheet | null>(null);
  const [sheetForm, setSheetForm] = useState<SheetFormState>(formVacio());
  const [savedForm, setSavedForm] = useState<SheetFormState>(formVacio());

  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(itemFormVacio);
  // Si se empezó a cargar una lista por tallo, las flores siguientes arrancan
  // en el mismo modo en vez de volver al del bunch cada vez.
  const [modoPrecio, setModoPrecio] = useState<ModoPrecio>('bunch');
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string>('');
  const [paso, setPaso] = useState('');
  const [verPrevia, setVerPrevia] = useState(false);
  // Pegar la lista se abre desde la lista de enlaces (hoja nueva) o desde el editor:
  // "Cancelar" vuelve al mismo lugar de donde se vino.
  const [pegarVuelveA, setPegarVuelveA] = useState<'list' | 'sheet'>('sheet');

  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [dialogoOcupado, setDialogoOcupado] = useState(false);
  const [dialogoError, setDialogoError] = useState('');

  const dirty = useMemo(
    () => JSON.stringify(sheetForm) !== JSON.stringify(savedForm),
    [sheetForm, savedForm]
  );

  const cargarHojas = useCallback(async (conPantallaDeCarga = true) => {
    if (conPantallaDeCarga) setCargando(true);
    try {
      setSheets(await getAllPriceSheets());
      setErrorCarga(false);
    } catch (err) {
      console.error('[precios] no se pudieron cargar las hojas:', err);
      setErrorCarga(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarHojas();
  }, [cargarHojas]);

  useEffect(() => {
    if (vista === 'item') setModoPrecio(itemForm.priceMode);
  }, [vista, itemForm.priceMode]);

  // Cerrar la pestaña con cambios sin guardar: el navegador pregunta.
  useEffect(() => {
    if (vista === 'list' || !dirty) return;
    const aviso = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [vista, dirty]);

  const vivasPorDestino = useMemo(() => {
    const porDestino: Partial<Record<PriceDestination, PriceSheet>> = {};
    [...sheets]
      .filter((s) => s.status === 'published' && s.destination)
      .sort((a, b) => (a.publishedAt ?? '').localeCompare(b.publishedAt ?? ''))
      .forEach((s) => {
        porDestino[s.destination!] = s;
      });
    return porDestino;
  }, [sheets]);

  // ── Navegación ─────────────────────────────────────────────────────────

  /** Con país (el botón "Crear la hoja de Guatemala") la primera pantalla es la de
   *  pegar la lista, que es lo único que hay que hacer. Sin país ("+ Nueva hoja")
   *  se abre el editor para elegirlo. */
  const abrirNuevaHoja = (destination?: PriceDestination) => {
    const nueva = formNuevo(destination ?? null);
    setEditing(null);
    setSheetForm(nueva);
    setSavedForm(nueva);
    setPegarVuelveA(destination ? 'list' : 'sheet');
    setVista(destination ? 'pegar' : 'sheet');
  };

  const abrirHoja = (sheet: PriceSheet) => {
    setEditing(sheet);
    setSheetForm(formDe(sheet));
    setSavedForm(formDe(sheet));
    setVista('sheet');
  };

  const volverALista = () => {
    setDialogo(null);
    setVista('list');
    cargarHojas(false);
  };

  const pedirVolver = () => {
    if (dirty) setDialogo({ tipo: 'salir' });
    else volverALista();
  };

  const abrirNuevoItem = () => {
    setEditingItemIndex(null);
    setItemForm({ ...itemFormVacio, priceMode: modoPrecio });
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
      stemsPerBunch: item.stemsPerBunch ? String(item.stemsPerBunch) : '',
      price: item.bunchPrice != null ? String(item.bunchPrice) : '',
      priceMode: 'bunch',
      catalogFlowerId: item.catalogFlowerId ?? '',
      catalogSearch: '',
      categorySlug: item.categorySlug ?? '',
      image: item.image ?? '',
      note: item.note ?? '',
    });
    setItemImageFile(null);
    setItemImagePreview('');
    setVista('item');
  };

  const volverAHoja = () => setVista('sheet');

  // ── Flores: todo local, se escribe recién cuando se guarda la hoja ──────

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
  };

  const cambiarPrecio = (index: number, precio: number | null) => {
    setSheetForm((p) => ({
      ...p,
      items: p.items.map((item, i) => (i === index ? { ...item, bunchPrice: precio } : item)),
    }));
  };

  const aplicarLista = (r: ImportResult) => {
    setSheetForm((p) => ({ ...p, items: r.items }));
    const partes = [
      r.agregadas > 0 && `${r.agregadas} ${r.agregadas === 1 ? 'flor agregada' : 'flores agregadas'}`,
      r.actualizadas > 0 && `${r.actualizadas} ${r.actualizadas === 1 ? 'precio cambiado' : 'precios cambiados'}`,
    ].filter(Boolean);
    toast.success(`${partes.join(' y ')}. Falta guardar la hoja.`, { duration: 6000 });
    setVista('sheet');
  };

  const elegirFotoItem = async (file: File) => {
    setPaso('Preparando la foto…');
    let comprimida: File;
    try {
      comprimida = await conTiempoLimite(compressImage(file), 30_000);
    } catch (err) {
      console.error('[precios] falló la preparación de la foto:', err);
      toast.error('No se pudo preparar la foto. Probá con otra foto, o sacala de nuevo con la cámara.', { duration: 8000 });
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

  // Lo que ya está en la hoja (menos la flor que se está editando) no se vuelve a ofrecer.
  const yaEnHoja = useMemo(() => {
    const otros = sheetForm.items.filter((_, i) => i !== editingItemIndex);
    return {
      flowerIds: new Set(otros.map((i) => i.catalogFlowerId).filter((x): x is string => !!x)),
      categorySlugs: new Set(otros.map((i) => i.categorySlug).filter((x): x is string => !!x)),
    };
  }, [sheetForm.items, editingItemIndex]);

  const elegirFlorCatalogo = (flower: Flower) => {
    setItemForm((p) => ({
      ...p,
      catalogFlowerId: flower.id,
      categorySlug: '',
      catalogSearch: '',
      // Prellena, no fuerza: solo si el campo todavía está vacío. Editar una
      // flor ya enlazada no debe pisar un nombre o foto que Francisco ya
      // ajustó a mano para este envío. Los tallos y el precio NUNCA se
      // prellenan: son datos comerciales de este envío.
      name: p.name || flower.name,
      image: p.image || flower.images[0] || '',
    }));
  };

  const elegirCategoria = (categoria: Category) => {
    setItemForm((p) => ({
      ...p,
      categorySlug: categoria.slug,
      catalogFlowerId: '',
      catalogSearch: '',
      name: p.name || categoria.label,
      image: p.image || categoria.fallbackImage,
    }));
  };

  const guardarItem = async () => {
    if (!itemForm.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    const precio = precioDeFormulario(itemForm);
    if (!precio.ok) {
      toast.error(precio.error);
      return;
    }
    const tallos = parseStems(itemForm.stemsPerBunch);
    if (tallos === null) {
      toast.error('Los tallos por bunch tienen que ser un número entero. Si no se sabe o varía, dejalo vacío.');
      return;
    }
    if (!editing) {
      // No debería pasar: "Agregar flor" está deshabilitado hasta guardar la hoja.
      toast.error('Guardá la hoja antes de agregar flores.');
      return;
    }
    setGuardando(true);
    try {
      let image = itemForm.image;
      if (itemImageFile) {
        const slugParaFoto = itemForm.slug || slugDe(itemForm.name);
        setPaso('Subiendo foto…');
        image = await conTiempoLimite(
          uploadPriceItemImage(itemImageFile, editing.id, slugParaFoto, (etapa: EtapaSubida, pct) =>
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
        slug: itemForm.slug || slugDe(itemForm.name),
        name: itemForm.name.trim(),
        bunchPrice: precio.bunchPrice,
        ...(tallos && { stemsPerBunch: tallos }),
        ...(itemForm.size.trim() && { size: itemForm.size.trim() }),
        ...(image && { image }),
        ...(itemForm.catalogFlowerId && { catalogFlowerId: itemForm.catalogFlowerId }),
        ...(itemForm.categorySlug.trim() && { categorySlug: itemForm.categorySlug.trim() }),
        ...(itemForm.note.trim() && { note: itemForm.note.trim() }),
      };

      setSheetForm((p) => {
        const items = [...p.items];
        if (editingItemIndex != null) items[editingItemIndex] = item;
        else items.push(item);
        return { ...p, items };
      });

      toast.success('Flor lista. Falta guardar la hoja.');
      setVista('sheet');
    } catch (err) {
      console.error('[precios] falló el guardado de la flor:', err);
      const msg = (err as Error)?.message;
      toast.error(
        msg === 'STORAGE_LIMIT_REACHED'
          ? 'El almacenamiento está lleno. Elimina imágenes antes de subir nuevas.'
          : msg === 'TIMEOUT'
            ? 'La subida se quedó esperando al servidor. Revisá tu conexión y volvé a intentar.'
            : `No se pudo preparar la flor. ${SI_SIGUE}`,
        { duration: 8000 }
      );
    } finally {
      setGuardando(false);
      setPaso('');
    }
  };

  // ── La hoja: acá sí se escribe a Firestore ──────────────────────────────

  /** Guarda la hoja. Devuelve la hoja ya guardada (releída de la base), o `null` si
   *  no se pudo: "Guardar y salir" y "Guardar y publicar" siguen solo si hay hoja.
   *  `silencioso` omite el aviso de "guardada" cuando lo que viene es otro paso. */
  const guardarHoja = async (opts: { silencioso?: boolean } = {}): Promise<PriceSheet | null> => {
    if (!sheetForm.destination) {
      toast.error('Elegí para quién es la hoja');
      return null;
    }
    if (!sheetForm.title.trim()) {
      toast.error('El título es requerido');
      return null;
    }
    if (!sheetForm.dateStart || !sheetForm.dateEnd) {
      toast.error('Las fechas de inicio y fin son requeridas');
      return null;
    }
    if (sheetForm.dateEnd < sheetForm.dateStart) {
      toast.error('La fecha final es anterior a la inicial');
      return null;
    }
    setGuardando(true);
    try {
      const contenido = {
        title: sheetForm.title.trim(),
        dateStart: sheetForm.dateStart,
        dateEnd: sheetForm.dateEnd,
        description: sheetForm.description,
        items: sheetForm.items,
      };
      let id: string;
      let revalidated: boolean | null = null;
      if (editing) {
        id = editing.id;
        ({ revalidated } = await conTiempoLimite(
          updatePriceSheet(id, contenido, { viva: editing.status === 'published' })
        ));
        // El destino de una hoja en vivo se cambia por el diálogo de "mover",
        // que dice qué enlace se queda sin hoja. Acá solo hojas que no están vivas.
        if (editing.status !== 'published' && sheetForm.destination !== editing.destination) {
          await conTiempoLimite(changePriceSheetDestination(id, sheetForm.destination));
        }
      } else {
        id = await conTiempoLimite(createPriceSheet({ ...contenido, destination: sheetForm.destination }));
      }

      const guardada = await getPriceSheetById(id);
      if (!guardada) throw new Error('RELEER');
      setEditing(guardada);
      setSheetForm(formDe(guardada));
      setSavedForm(formDe(guardada));
      cargarHojas(false);

      if (opts.silencioso) return guardada;
      if (!editing) {
        toast.success('Guardada como borrador. Los clientes no la ven hasta que la publiques.', { duration: 6000 });
      } else if (revalidated === false) {
        toast('Guardada. El sitio puede tardar hasta 5 minutos en mostrar el cambio.', { duration: 6000 });
      } else toast.success(editing.status === 'published' ? 'Guardada. Ya se ve en el enlace.' : 'Hoja guardada');
      return guardada;
    } catch (err) {
      console.error('[precios] falló el guardado de la hoja:', err);
      toast.error(mensajeDeError(err, 'guardar la hoja'), { duration: 8000 });
      return null;
    } finally {
      setGuardando(false);
    }
  };

  const descartar = () => {
    setSheetForm(savedForm);
  };

  /** Un solo toque para lo más común: guardar la hoja y, sin soltarla, abrir la
   *  confirmación de publicar (que dice qué enlace queda y qué reemplaza). */
  const guardarYPublicar = async () => {
    const guardada = await guardarHoja({ silencioso: true });
    if (guardada) abrirDialogo({ tipo: 'publicar', sheet: guardada });
  };

  const duplicar = async (sheet: PriceSheet) => {
    try {
      await duplicatePriceSheet(sheet.id);
      toast.success(
        `Copia creada en borradores${sheet.destination ? ` (${destinationInfo(sheet.destination).label})` : ''}`
      );
      cargarHojas(false);
    } catch (err) {
      console.error('[precios] falló duplicar:', err);
      toast.error(mensajeDeError(err, 'duplicar la hoja'));
    }
  };

  // ── Diálogos: publicar, quitar, mover, eliminar ─────────────────────────

  const cerrarDialogo = () => {
    if (dialogoOcupado) return;
    setDialogo(null);
    setDialogoError('');
  };

  const abrirDialogo = (d: Dialogo) => {
    setDialogoError('');
    setDialogo(d);
  };

  /** Una acción del diálogo: muestra "ocupado", cierra al terminar y deja un
   *  error visible DENTRO del diálogo si falla (un toast quedaría detrás). */
  const correr = async (accion: () => Promise<void>, etiqueta: string) => {
    setDialogoOcupado(true);
    setDialogoError('');
    try {
      await accion();
      setDialogo(null);
    } catch (err) {
      console.error(`[precios] falló ${etiqueta}:`, err);
      setDialogoError(mensajeDeError(err, etiqueta));
    } finally {
      setDialogoOcupado(false);
    }
  };

  const tostadaDeResultado = (mensaje: string, r: PublishResult) => {
    if (r.revalidated === false) {
      toast(`${mensaje} El sitio puede tardar hasta 5 minutos en mostrarlo.`, { duration: 6000 });
    } else {
      toast.success(mensaje);
    }
  };

  /** Después de publicar/quitar/mover: lista fresca y, si la hoja abierta en el
   *  editor cambió de estado, también ella. */
  const refrescarTras = async (id: string) => {
    await cargarHojas(false);
    if (editing && editing.id === id) {
      const fresca = await getPriceSheetById(id);
      if (fresca) {
        setEditing(fresca);
        setSheetForm(formDe(fresca));
        setSavedForm(formDe(fresca));
      }
    }
  };

  const confirmarPublicar = (sheet: PriceSheet) =>
    correr(async () => {
      const plan = planPlacement(sheets, sheet, sheet.destination!, true);
      const r = await publishPriceSheet(sheet.id, { confirmaReemplazo: plan.replaces });
      const donde = destinationInfo(sheet.destination!).en;
      tostadaDeResultado(
        r.replacedIds.length > 0 ? `Publicada ${donde}. La anterior pasó a archivadas.` : `Publicada ${donde}.`,
        r
      );
      await refrescarTras(sheet.id);
    }, 'publicar la hoja');

  const confirmarQuitar = (sheet: PriceSheet) =>
    correr(async () => {
      const r = await unpublishPriceSheet(sheet.id);
      tostadaDeResultado(`Quitada ${destinationInfo(sheet.destination!).deLa}.`, r);
      await refrescarTras(sheet.id);
    }, 'quitar la hoja');

  const confirmarMover = (sheet: PriceSheet, destino: PriceDestination) =>
    correr(async () => {
      const plan = planPlacement(sheets, sheet, destino, false);
      const r = await changePriceSheetDestination(sheet.id, destino, { confirmaReemplazo: plan.replaces });
      tostadaDeResultado(`Movida ${destinationInfo(destino).a}.`, r);
      await refrescarTras(sheet.id);
    }, 'mover la hoja');

  const confirmarEliminar = (sheet: PriceSheet) =>
    correr(async () => {
      await deletePriceSheet(sheet);
      toast.success('Hoja eliminada');
      await cargarHojas(false);
    }, 'eliminar la hoja');

  // ── Render ──────────────────────────────────────────────────────────────

  const hoy = hoyLocal();

  const renderDialogo = () => {
    if (!dialogo) return null;

    if (dialogo.tipo === 'publicar') {
      const { sheet } = dialogo;
      const dest = sheet.destination!;
      const info = destinationInfo(dest);
      const plan = planPlacement(sheets, sheet, dest, true);
      const reemplazadas = plan.replaces
        .map((id) => sheets.find((s) => s.id === id))
        .filter((s): s is PriceSheet => !!s);
      const { errors, warnings: avisosDeHoja } = checkSheet(sheet, hoy);
      const warnings = [...availabilityWarnings(sheet, catalogFlowers), ...avisosDeHoja];
      const reemplaza = reemplazadas.length > 0;
      const etiqueta = reemplaza
        ? 'Reemplazar y publicar'
        : sheet.status === 'archived'
          ? `Volver a publicar ${info.en}`
          : `Publicar ${info.en}`;
      return (
        <ConfirmDialog
          open
          eyebrow="Publicar"
          title={
            reemplaza
              ? `Reemplazar la hoja publicada ${info.deLa}`
              : sheet.status === 'archived'
                ? `Volver a publicar la hoja ${info.hojaDe}`
                : `Publicar la hoja ${info.hojaDe}`
          }
          errores={errors.map((e) => e.text)}
          avisos={warnings.map((w) => w.text)}
          confirmLabel={etiqueta}
          busyLabel="Publicando…"
          busy={dialogoOcupado}
          error={dialogoError}
          // Desde el editor se puede mirar cómo queda antes de confirmar.
          secondaryLabel={vista === 'sheet' && editing?.id === sheet.id ? 'Ver cómo queda' : undefined}
          onSecondary={() => {
            setDialogo(null);
            setVerPrevia(true);
          }}
          onConfirm={() => confirmarPublicar(sheet)}
          onCancel={cerrarDialogo}
        >
          {reemplaza ? (
            <>
              <p>
                «{sheet.title}» ({flores(sheet.items.length)}) pasa a {urlVisible(dest)} y reemplaza a{' '}
                {reemplazadas.map((r) => `«${r.title}» (${flores(r.items.length)})`).join(' y ')}, que hoy{' '}
                {reemplazadas.length === 1 ? 'está' : 'están'} en ese enlace.
              </p>
              <p className="text-[14px] text-muted">
                {reemplazadas.length === 1 ? 'La anterior queda' : 'Las anteriores quedan'} en archivadas y se{' '}
                {reemplazadas.length === 1 ? 'puede' : 'pueden'} volver a publicar. Quien ya tiene el enlace ve la
                hoja nueva apenas publiques.
              </p>
            </>
          ) : (
            <>
              <p>
                «{sheet.title}» ({flores(sheet.items.length)}) va a salir en {urlVisible(dest)}. Hoy ese enlace no
                muestra ninguna hoja.
              </p>
              <p className="text-[14px] text-muted">Quien ya tiene el enlace la ve apenas publiques.</p>
            </>
          )}
        </ConfirmDialog>
      );
    }

    if (dialogo.tipo === 'quitar') {
      const { sheet } = dialogo;
      const dest = sheet.destination!;
      const info = destinationInfo(dest);
      return (
        <ConfirmDialog
          open
          eyebrow="Quitar"
          title={`Quitar la hoja ${info.hojaDe}`}
          confirmLabel={`Quitar ${info.deLa}`}
          busyLabel="Quitando…"
          busy={dialogoOcupado}
          error={dialogoError}
          onConfirm={() => confirmarQuitar(sheet)}
          onCancel={cerrarDialogo}
        >
          <p>
            {urlVisible(dest)} va a dejar de mostrar «{sheet.title}» y va a decir «{SIN_HOJA_TITULO}» hasta que
            publiques otra.
          </p>
          <p className="text-[14px] text-muted">La hoja pasa a archivadas, no se borra.</p>
        </ConfirmDialog>
      );
    }

    if (dialogo.tipo === 'mover') {
      const { sheet, destino } = dialogo;
      const origen = sheet.destination;
      const plan = planPlacement(sheets, sheet, destino, false);
      const ocupante = plan.replaces.length > 0 ? sheets.find((s) => s.id === plan.replaces[0]) : undefined;
      const opciones = PRICE_DESTINATIONS.filter((d) => d.code !== origen);
      const infoDestino = destinationInfo(destino);
      return (
        <ConfirmDialog
          open
          eyebrow={origen ? 'Mover' : 'Destino'}
          title={origen ? `Mover la hoja ${destinationInfo(origen).deLa} ${infoDestino.a}` : `Elegir el destino de «${sheet.title}»`}
          confirmLabel={origen ? `Mover ${infoDestino.a}` : `Publicar ${infoDestino.en}`}
          busyLabel={origen ? 'Moviendo…' : 'Publicando…'}
          busy={dialogoOcupado}
          error={dialogoError}
          onConfirm={() => confirmarMover(sheet, destino)}
          onCancel={cerrarDialogo}
        >
          <fieldset>
            <legend className="label text-muted">A dónde</legend>
            <div className="mt-2 flex flex-wrap gap-x-6">
              {opciones.map((d) => (
                <label key={d.code} className="flex min-h-11 cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="mover-a"
                    checked={destino === d.code}
                    onChange={() => setDialogo({ tipo: 'mover', sheet, destino: d.code })}
                  />
                  <span>{d.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <ul className="border-t border-line">
            {origen && (
              <li className="border-b border-line py-2.5 text-[14px] leading-snug">
                {urlVisible(origen)} se queda sin hoja.
              </li>
            )}
            <li className="border-b border-line py-2.5 text-[14px] leading-snug">
              {ocupante
                ? `${urlVisible(destino)} hoy muestra «${ocupante.title}»: esa pasa a archivadas y se muestra «${sheet.title}».`
                : `${urlVisible(destino)} muestra «${sheet.title}» desde ahora.`}
            </li>
            <li className="border-b border-line py-2.5 text-[14px] leading-snug">
              Los precios no cambian: siguen en dólares.
              {infoDestino.currency
                ? ` La referencia pasa a ${infoDestino.currency.name}.`
                : ' La hoja deja de mostrar moneda local.'}
            </li>
          </ul>
        </ConfirmDialog>
      );
    }

    if (dialogo.tipo === 'eliminar') {
      const { sheet } = dialogo;
      return (
        <ConfirmDialog
          open
          eyebrow="Eliminar"
          title={`Eliminar «${sheet.title}»`}
          confirmLabel="Eliminar para siempre"
          busyLabel="Eliminando…"
          busy={dialogoOcupado}
          error={dialogoError}
          onConfirm={() => confirmarEliminar(sheet)}
          onCancel={cerrarDialogo}
        >
          <p>
            Se borra la hoja y sus {flores(sheet.items.length)}. No se puede deshacer.
          </p>
        </ConfirmDialog>
      );
    }

    // salir con cambios sin guardar
    return (
      <ConfirmDialog
        open
        eyebrow="Cambios sin guardar"
        title="Hay cambios sin guardar"
        confirmLabel="Guardar y salir"
        busyLabel="Guardando…"
        busy={guardando}
        secondaryLabel="Salir sin guardar"
        onSecondary={volverALista}
        cancelLabel="Seguir editando"
        onConfirm={async () => {
          if (await guardarHoja()) volverALista();
          else setDialogo(null);
        }}
        onCancel={cerrarDialogo}
      >
        <p>
          Si salís ahora, se pierden los cambios de «{sheetForm.title || 'esta hoja'}».
        </p>
      </ConfirmDialog>
    );
  };

  if (cargando) {
    return <div className="py-16 text-center font-serif text-2xl font-light text-muted">Cargando precios…</div>;
  }

  if (errorCarga && sheets.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl py-10">
        <h1 className="font-serif text-3xl font-light text-ink">Precios</h1>
        <div className={`${AVISO} mt-8`}>
          No se pudieron cargar las hojas. Tus hojas no se borraron: es un problema de conexión. Revisá el internet y
          probá de nuevo.{' '}
          <button type="button" onClick={() => cargarHojas()} className="underline underline-offset-4">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (vista === 'item') {
    return (
      <ItemEditor
        form={itemForm}
        setForm={setItemForm}
        imagePreview={itemImagePreview || itemForm.image}
        onElegirFoto={elegirFotoItem}
        flowers={catalogFlowers}
        destination={sheetForm.destination}
        yaEnHoja={yaEnHoja}
        onElegirFlor={elegirFlorCatalogo}
        onElegirCategoria={elegirCategoria}
        onQuitarEnlace={() => setItemForm((p) => ({ ...p, catalogFlowerId: '', categorySlug: '', catalogSearch: '' }))}
        onGuardar={guardarItem}
        onCancelar={volverAHoja}
        guardando={guardando}
        paso={paso}
      />
    );
  }

  if (vista === 'pegar') {
    return (
      <PasteList
        items={sheetForm.items}
        flowers={catalogFlowers}
        destination={sheetForm.destination}
        onAplicar={aplicarLista}
        onCancelar={() => (pegarVuelveA === 'list' ? volverALista() : volverAHoja())}
        // Quien llegó desde "Crear la hoja de…" puede preferir cargar las flores de a una.
        onSaltar={pegarVuelveA === 'list' ? volverAHoja : undefined}
      />
    );
  }

  if (vista === 'sheet') {
    return (
      <>
        <SheetEditor
          form={sheetForm}
          setForm={setSheetForm}
          sheet={editing}
          catalogFlowers={catalogFlowers}
          vivasPorDestino={vivasPorDestino}
          dirty={dirty}
          guardando={guardando}
          onVolver={pedirVolver}
          onGuardar={() => guardarHoja()}
          onGuardarYPublicar={guardarYPublicar}
          onDescartar={descartar}
          onPublicar={() => editing && abrirDialogo({ tipo: 'publicar', sheet: { ...editing, ...sheetForm } })}
          onMover={() =>
            editing &&
            abrirDialogo({
              tipo: 'mover',
              sheet: editing,
              destino: PRICE_DESTINATIONS.find((d) => d.code !== editing.destination)!.code,
            })
          }
          onAgregarFlor={abrirNuevoItem}
          onPegar={() => {
            setPegarVuelveA('sheet');
            setVista('pegar');
          }}
          onVistaPrevia={() => setVerPrevia(true)}
          onCambiarPrecio={cambiarPrecio}
          onEditarItem={abrirItem}
          onMoverItem={moverItem}
          onQuitarItem={quitarItem}
        />
        {renderDialogo()}
        {verPrevia && (
          <VistaPrevia
            title={sheetForm.title}
            description={sheetForm.description}
            items={sheetForm.items}
            destination={sheetForm.destination}
            flowers={catalogFlowers}
            enVivo={editing?.status === 'published'}
            onCerrar={() => setVerPrevia(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-3xl">
        <LinksList
          sheets={sheets}
          onNueva={abrirNuevaHoja}
          onEditar={abrirHoja}
          onDuplicar={duplicar}
          onPublicar={(sheet) => abrirDialogo({ tipo: 'publicar', sheet })}
          onQuitar={(sheet) => abrirDialogo({ tipo: 'quitar', sheet })}
          onEliminar={(sheet) => abrirDialogo({ tipo: 'eliminar', sheet })}
        />
      </div>
      {renderDialogo()}
    </>
  );
}
