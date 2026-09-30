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
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getDb, getStorageInstance } from './firebase';
import { getStorageUsedBytes, adjustStorageUsage, STORAGE_LIMIT_BYTES } from './flowers';
import type { AvisoProgreso } from './flowers';
import type { CountryCode } from './types';

const COLLECTION = 'priceSheets';

// ── Tipos ────────────────────────────────────────────────────────────────

export interface PriceItem {
  slug: string;
  name: string;
  /** Largo de tallo de ESTE envío. Puede diferir del `stemLength` general de
   *  la ficha del catálogo a propósito (temporada corta o especial). */
  size?: string;
  /** Tallos por bunch: rosas 25, el resto 10. */
  stemsPerBunch: number;
  /** Precio por tallo en USD. `null` = pendiente de confirmar. */
  price: number | null;
  /**
   * Precio por tallo distinto para CR o GT (flete, aranceles). Solo se pone
   * la entrada del país que difiere de `price`; el que no aparece acá usa
   * `price` tal cual. Ver `priceFor` más abajo.
   */
  priceByCountry?: Partial<Record<CountryCode, number>>;
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
  items: PriceItem[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/** Precio por tallo para un país dado: el override si existe, si no el general. */
export function priceFor(item: PriceItem, country?: CountryCode): number | null {
  if (country && item.priceByCountry?.[country] != null) {
    return item.priceByCountry[country]!;
  }
  return item.price;
}

// ── Lectura (admin, todas las hojas) ───────────────────────────────────────

export async function getAllPriceSheets(): Promise<PriceSheet[]> {
  const db = getDb();
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PriceSheet));
}

export async function getPriceSheetById(id: string): Promise<PriceSheet | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as PriceSheet;
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
  data: Omit<PriceSheet, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'publishedAt'>
): Promise<string> {
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

export async function updatePriceSheet(
  id: string,
  data: Partial<Omit<PriceSheet, 'id' | 'createdAt'>>
): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() });

  // Best-effort, igual que en publishPriceSheet: si la hoja editada ya
  // estaba publicada, el cambio (precio, nota, foto) tiene que verse ya, no
  // en hasta 5 min (ISR). Revalidar una hoja que sigue en borrador no hace
  // daño, las rutas públicas igual muestran la que esté published.
  try {
    await fetch('/api/revalidar-precios', { method: 'POST' });
  } catch (err) {
    console.error('[updatePriceSheet] no se pudo revalidar de inmediato:', err);
  }
}

/**
 * Copia título, fechas, descripción y todos los ítems (mismas URLs de foto,
 * sin resubir nada) a un borrador nuevo. Es la manera de que recargar
 * precios cada 2 o 3 meses no implique volver a escribir cada flor desde
 * cero: se duplica la temporada anterior y se ajustan los precios que
 * cambiaron.
 */
export async function duplicatePriceSheet(id: string): Promise<string> {
  const original = await getPriceSheetById(id);
  if (!original) throw new Error('HOJA_NO_ENCONTRADA');
  return createPriceSheet({
    title: `${original.title} (copia)`,
    dateStart: original.dateStart,
    dateEnd: original.dateEnd,
    description: original.description,
    items: original.items,
  });
}

/**
 * Publica una hoja: archiva la que esté publicada hoy (si hay alguna) y
 * marca esta como `published`, en un solo batch. La regla "un solo published
 * a la vez" se aplica ACÁ, no en Firestore Rules: no se puede consultar
 * "¿hay otro doc con status=published?" desde una regla sin leer todos los
 * documentos, y con un solo operador no vale esa complejidad.
 */
export async function publishPriceSheet(id: string): Promise<void> {
  const db = getDb();
  const q = query(collection(db, COLLECTION), where('status', '==', 'published'));
  const snap = await getDocs(q);

  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    if (d.id !== id) batch.update(d.ref, { status: 'archived', updatedAt: serverTimestamp() });
  });
  batch.update(doc(db, COLLECTION, id), {
    status: 'published',
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();

  // Best-effort: si la revalidación falla, la hoja igual quedó publicada,
  // solo tarda hasta 5 min en verse (ISR) en vez de al instante.
  try {
    await fetch('/api/revalidar-precios', { method: 'POST' });
  } catch (err) {
    console.error('[publishPriceSheet] no se pudo revalidar de inmediato:', err);
  }
}

/** Bloqueada también en firestore.rules; este chequeo evita el viaje de red
 *  y da un mensaje claro en vez de un "permission-denied" críptico. */
export async function deletePriceSheet(sheet: Pick<PriceSheet, 'id' | 'status'>): Promise<void> {
  if (sheet.status === 'published') {
    throw new Error('NO_SE_PUEDE_BORRAR_PUBLICADA');
  }
  const db = getDb();
  await deleteDoc(doc(db, COLLECTION, sheet.id));
}
