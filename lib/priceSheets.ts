import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getDb, getStorageInstance } from './firebase';
import { getStorageUsedBytes, adjustStorageUsage, STORAGE_LIMIT_BYTES } from './flowers';
import type { AvisoProgreso } from './flowers';
import { normalizeDestination, storedDestination, type PriceDestination } from './price-destinations';
import { PriceSheetError, checkSheet, hoyLocal, planPlacement, readItem } from './price-sheet-rules';

const COLLECTION = 'priceSheets';

// ── Tipos ────────────────────────────────────────────────────────────────

export interface PriceItem {
  slug: string;
  name: string;
  /** Largo de tallo de ESTE envío. Puede diferir del `stemLength` general de
   *  la ficha del catálogo a propósito (temporada corta o especial). */
  size?: string;
  /** Tallos por bunch (rosas 25, el resto 10). Ausente = sin indicar: no se
   *  sabe, varía, o se vende por peso (ej. Gypsophila, bunch de 250 g). La hoja
   *  pública no inventa un número: sin tallos no muestra precio por tallo. */
  stemsPerBunch?: number;
  /**
   * Precio del BUNCH en USD, que es lo que dicen las listas. El precio por tallo
   * se deriva (ver stemPrice en price-sheet-rules.ts) y nunca se guarda.
   * `null` = pendiente de confirmar.
   */
  bunchPrice: number | null;
  /** URL de la foto: de Firebase Storage o de /public, next/image sirve
   *  cualquiera de las dos igual. */
  image?: string;
  /**
   * Id del documento en la colección `flowers`, para enlazar a su ficha.
   * Antes era `catalogName` (match por texto contra el nombre); se cambió a
   * id porque el match por nombre ya rompió dos veces (una vez por un typo
   * en el catálogo, "Crysantemo" contra "Crisantemo"; otra por una categoría
   * mal asignada). Un id no se rompe si el nombre de la flor cambia después.
   */
  catalogFlowerId?: string;
  /** Si no hay ficha individual, se enlaza a la categoría. */
  categorySlug?: string;
  /**
   * Aclaración corta y visible junto al tallos/bunch: para cuando el dato no
   * es un número fijo (ej. Gypsophila se vende por peso, no por cantidad;
   * algunas garden roses vienen con menos tallos por bunch según la finca).
   */
  note?: string;
}

export type PriceSheetStatus = 'draft' | 'published' | 'archived';

export interface PriceSheet {
  id: string;
  title: string;
  /** "YYYY-MM-DD" */
  dateStart: string;
  /** "YYYY-MM-DD" */
  dateEnd: string;
  description: string;
  status: PriceSheetStatus;
  /**
   * En qué enlace sale esta hoja: /precios-cr, /precios-gt o /precios. `null`
   * solo en un borrador o archivada cargada antes de que existiera el campo, o
   * con el valor mal escrito; una hoja sin destino no sale en ningún enlace. La
   * publicada de antes de los destinos se lee como Costa Rica (ver
   * storedDestination).
   */
  destination: PriceDestination | null;
  items: PriceItem[];
  /** ISO. Firestore las guarda como Timestamp; al leer se pasan a texto. */
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/** Lo que el admin escribe de una hoja. `status`, `publishedAt` y `destination`
 *  no están: solo publicar, quitar y mover los tocan (ver más abajo). */
export type PriceSheetContent = Pick<PriceSheet, 'title' | 'dateStart' | 'dateEnd' | 'description' | 'items'>;

// ── Lectura (admin, todas las hojas) ───────────────────────────────────────

function aIso(v: unknown): string | undefined {
  if (v && typeof (v as { toDate?: unknown }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof v === 'string' ? v : undefined;
}

function leerHoja(id: string, d: DocumentData): PriceSheet {
  const publishedAt = aIso(d.publishedAt);
  const status: PriceSheetStatus = d.status ?? 'draft';
  return {
    id,
    title: d.title ?? '',
    dateStart: d.dateStart ?? '',
    dateEnd: d.dateEnd ?? '',
    description: d.description ?? '',
    status,
    destination: storedDestination(d.destination, status),
    items: Array.isArray(d.items) ? d.items.map((i) => readItem(i)) : [],
    createdAt: aIso(d.createdAt) ?? '',
    updatedAt: aIso(d.updatedAt) ?? '',
    ...(publishedAt && { publishedAt }),
  };
}

export async function getAllPriceSheets(): Promise<PriceSheet[]> {
  const db = getDb();
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => leerHoja(d.id, d.data()));
}

export async function getPriceSheetById(id: string): Promise<PriceSheet | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return leerHoja(snap.id, snap.data());
}

/**
 * Avisa al sitio que las hojas publicadas cambiaron, para que se vea ya y no
 * en hasta 5 min (ISR). Devuelve si funcionó: `fetch` solo lanza por falta de
 * red, una respuesta 500 pasa como éxito si no se mira `res.ok`. El admin usa
 * el resultado para no prometer "se actualiza en el momento" cuando no pasó.
 */
export async function revalidarPrecios(): Promise<boolean> {
  try {
    const res = await fetch('/api/revalidar-precios', { method: 'POST' });
    return res.ok;
  } catch (err) {
    console.error('[priceSheets] no se pudo revalidar de inmediato:', err);
    return false;
  }
}

// ── Imágenes ────────────────────────────────────────────────────────────
// Reusa `getStorageUsedBytes`/`adjustStorageUsage`/`STORAGE_LIMIT_BYTES` de
// lib/flowers.ts a propósito: `_meta/storage` mide el bucket completo, un
// contador aparte para esta colección quedaría desincronizado del límite real.

export async function uploadPriceItemImage(
  file: File,
  sheetId: string,
  itemSlug: string,
  avisar?: AvisoProgreso
): Promise<string> {
  avisar?.('cuota');
  const used = await getStorageUsedBytes();
  if (used + file.size > STORAGE_LIMIT_BYTES) {
    throw new Error('STORAGE_LIMIT_REACHED');
  }

  const storage = getStorageInstance();
  const fileRef = ref(storage, `priceSheets/${sheetId}/${itemSlug}-${Date.now()}_${file.name}`);

  avisar?.('subiendo', 0);
  await new Promise<void>((resolve, reject) => {
    const tarea = uploadBytesResumable(fileRef, file, { contentType: file.type });
    tarea.on(
      'state_changed',
      (snap) => {
        const pct = snap.totalBytes > 0 ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0;
        avisar?.('subiendo', pct);
      },
      reject,
      resolve
    );
  });

  avisar?.('url');
  const url = await getDownloadURL(fileRef);

  avisar?.('contador');
  await adjustStorageUsage(file.size);

  return url;
}

// ── CRUD de la hoja ─────────────────────────────────────────────────────

export async function createPriceSheet(
  data: PriceSheetContent & { destination: PriceDestination }
): Promise<string> {
  // Sin valor por defecto a propósito: un default haría que una lista nueva de
  // Guatemala se publique bajo Costa Rica por no mirar el campo.
  if (!normalizeDestination(data.destination)) throw new PriceSheetError('DESTINO_INVALIDO');
  const db = getDb();
  const docRef = doc(collection(db, COLLECTION));
  await setDoc(docRef, {
    ...data,
    status: 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Guarda el contenido de una hoja. NO acepta `status`, `publishedAt` ni
 * `destination`: de eso se encargan `publishPriceSheet`, `unpublishPriceSheet`
 * y `changePriceSheetDestination`, que mantienen la regla de una sola hoja
 * publicada por destino. Si la hoja está viva, el cambio (precio, nota, foto)
 * tiene que verse ya: se revalida.
 */
export async function updatePriceSheet(
  id: string,
  data: Partial<PriceSheetContent>,
  opts: { viva: boolean }
): Promise<{ revalidated: boolean | null }> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
  return { revalidated: opts.viva ? await revalidarPrecios() : null };
}

/**
 * Copia título, fechas, descripción y todos los ítems (mismas URLs de foto,
 * sin resubir nada) a un borrador nuevo con el MISMO destino. El título queda
 * igual: el admin ya distingue al borrador de la hoja viva, y un "(copia)" en
 * el título habría salido tal cual en la página del cliente al publicar.
 *
 * Es la manera de que recargar precios cada 2 o 3 meses no implique volver a
 * escribir cada flor desde cero: se duplica la temporada anterior y se ajustan
 * los precios que cambiaron. Copiar a otro país no se ofrece: cada hoja se arma
 * desde cero a propósito, copiar precios de Costa Rica a Guatemala es justo el
 * error.
 */
export async function duplicatePriceSheet(id: string): Promise<string> {
  const original = await getPriceSheetById(id);
  if (!original) throw new PriceSheetError('HOJA_NO_ENCONTRADA');
  if (!original.destination) throw new PriceSheetError('SIN_DESTINO');
  return createPriceSheet({
    title: original.title,
    dateStart: original.dateStart,
    dateEnd: original.dateEnd,
    description: original.description,
    items: original.items,
    destination: original.destination,
  });
}

export interface PublishResult {
  destination: PriceDestination | null;
  /** Hojas que pasaron a archivadas al publicar. */
  replacedIds: string[];
  /** `true` el sitio ya lo muestra, `false` puede tardar hasta 5 min, `null` no hizo falta. */
  revalidated: boolean | null;
}

async function hojasPublicadas(): Promise<Pick<PriceSheet, 'id' | 'status' | 'destination'>[]> {
  const db = getDb();
  // Una sola consulta por status y se filtra por destino en memoria: así
  // también aparecen las publicadas sin destino (viejas) en vez de esconderse.
  const snap = await getDocs(query(collection(db, COLLECTION), where('status', '==', 'published')));
  return snap.docs.map((d) => ({
    id: d.id,
    status: 'published' as const,
    destination: storedDestination(d.data().destination, 'published'),
  }));
}

function exigirConfirmados(replaces: string[], confirmados: string[] | undefined) {
  if (replaces.some((rid) => !(confirmados ?? []).includes(rid))) {
    throw new PriceSheetError('REEMPLAZO_NO_CONFIRMADO', { replaces });
  }
}

/**
 * Publica una hoja (borrador, o archivada que se vuelve a publicar) en SU
 * destino. Archiva solo la que esté publicada en ese mismo destino, en un
 * batch: nunca quedan 0 ni 2 en un destino, y las hojas de los otros destinos
 * ni se tocan. La regla "una publicada por destino" se aplica ACÁ y no en
 * Firestore Rules: una regla no puede consultar "¿hay otro doc con
 * status=published?" sin leer todos los documentos.
 *
 * Lee la hoja fresca de Firestore, no la de la pantalla (que puede estar
 * desactualizada), y exige que quien llama diga qué hojas vio que se archivan
 * (`confirmaReemplazo`): si la pantalla no mostró alguna, no se archiva en
 * silencio.
 */
export async function publishPriceSheet(
  id: string,
  opts: { confirmaReemplazo?: string[] } = {}
): Promise<PublishResult> {
  const db = getDb();
  const hoja = await getPriceSheetById(id);
  if (!hoja) throw new PriceSheetError('HOJA_NO_ENCONTRADA');
  if (hoja.status === 'published') return { destination: hoja.destination, replacedIds: [], revalidated: null };
  if (!hoja.destination) throw new PriceSheetError('SIN_DESTINO');

  const { errors } = checkSheet(hoja, hoyLocal());
  if (errors.length > 0) throw new PriceSheetError('HOJA_INVALIDA', errors);

  const { replaces } = planPlacement(await hojasPublicadas(), hoja, hoja.destination, true);
  exigirConfirmados(replaces, opts.confirmaReemplazo);

  const batch = writeBatch(db);
  for (const rid of replaces) {
    batch.update(doc(db, COLLECTION, rid), { status: 'archived', updatedAt: serverTimestamp() });
  }
  batch.update(doc(db, COLLECTION, id), {
    status: 'published',
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();

  return { destination: hoja.destination, replacedIds: replaces, revalidated: await revalidarPrecios() };
}

/** Pasa una hoja publicada a archivada, sin reemplazarla: el enlace queda sin
 *  hoja y muestra el aviso. Es la forma de apagar un destino; "eliminar" no
 *  existe para una hoja viva. */
export async function unpublishPriceSheet(id: string): Promise<PublishResult> {
  const db = getDb();
  const hoja = await getPriceSheetById(id);
  if (!hoja) throw new PriceSheetError('HOJA_NO_ENCONTRADA');
  if (hoja.status !== 'published') return { destination: hoja.destination, replacedIds: [], revalidated: null };
  await updateDoc(doc(db, COLLECTION, id), { status: 'archived', updatedAt: serverTimestamp() });
  return { destination: hoja.destination, replacedIds: [], revalidated: await revalidarPrecios() };
}

/**
 * Cambia el destino de una hoja.
 *
 * - Borrador o archivada: es solo un dato, no desplaza a nadie y no se revalida.
 * - Publicada: en un batch archiva a la que ocupa el destino de llegada y mueve
 *   la hoja. El destino de origen queda sin hoja (muestra el aviso) y la
 *   pantalla lo tiene que decir antes de confirmar (`vacates`).
 */
export async function changePriceSheetDestination(
  id: string,
  destino: PriceDestination,
  opts: { confirmaReemplazo?: string[] } = {}
): Promise<PublishResult> {
  if (!normalizeDestination(destino)) throw new PriceSheetError('DESTINO_INVALIDO');
  const db = getDb();
  const hoja = await getPriceSheetById(id);
  if (!hoja) throw new PriceSheetError('HOJA_NO_ENCONTRADA');
  if (hoja.destination === destino) return { destination: destino, replacedIds: [], revalidated: null };

  if (hoja.status !== 'published') {
    await updateDoc(doc(db, COLLECTION, id), { destination: destino, updatedAt: serverTimestamp() });
    return { destination: destino, replacedIds: [], revalidated: null };
  }

  const { replaces } = planPlacement(await hojasPublicadas(), hoja, destino, false);
  exigirConfirmados(replaces, opts.confirmaReemplazo);

  const batch = writeBatch(db);
  for (const rid of replaces) {
    batch.update(doc(db, COLLECTION, rid), { status: 'archived', updatedAt: serverTimestamp() });
  }
  batch.update(doc(db, COLLECTION, id), { destination: destino, updatedAt: serverTimestamp() });
  await batch.commit();

  return { destination: destino, replacedIds: replaces, revalidated: await revalidarPrecios() };
}

/** Bloqueada también en firestore.rules; este chequeo evita el viaje de red
 *  y da un mensaje claro en vez de un "permission-denied" críptico. */
export async function deletePriceSheet(sheet: Pick<PriceSheet, 'id' | 'status'>): Promise<void> {
  if (sheet.status === 'published') {
    throw new PriceSheetError('NO_SE_PUEDE_BORRAR_PUBLICADA');
  }
  const db = getDb();
  await deleteDoc(doc(db, COLLECTION, sheet.id));
}
