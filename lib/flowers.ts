import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  increment,
  writeBatch,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getMetadata,
} from 'firebase/storage';
import { getDb, getStorageInstance } from './firebase';
import type { Flower } from './types';

const COLLECTION = 'flowers';
const MAX_IMAGE_SIZE_MB = 2;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const STORAGE_LIMIT_BYTES = 4.5 * 1024 * 1024 * 1024; // 4.5 GB

// ── Storage usage tracking ──────────────────────────────────────────────────

async function getStorageUsedBytes(): Promise<number> {
  const db = getDb();
  const snap = await getDoc(doc(db, '_meta', 'storage'));
  if (!snap.exists()) return 0;
  return (snap.data().usedBytes as number) ?? 0;
}

async function adjustStorageUsage(deltaBytes: number): Promise<void> {
  const db = getDb();
  await setDoc(
    doc(db, '_meta', 'storage'),
    { usedBytes: increment(deltaBytes) },
    { merge: true }
  );
}

export async function getStorageInfo(): Promise<{ usedBytes: number; limitBytes: number; nearLimit: boolean }> {
  const usedBytes = await getStorageUsedBytes();
  return {
    usedBytes,
    limitBytes: STORAGE_LIMIT_BYTES,
    nearLimit: usedBytes >= STORAGE_LIMIT_BYTES,
  };
}

// ── Validation ──────────────────────────────────────────────────────────────

/**
 * Tipos que acepta la regla de Storage. Tienen que coincidir EXACTAMENTE con
 * `storage.rules`: si no, el archivo pasa la validación del navegador y lo
 * rechaza el servidor, que es mucho más difícil de diagnosticar.
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateImageFiles(files: File[]): string | null {
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      // El caso típico: fotos de iPhone en HEIC. Chrome no las decodifica, así
      // que el compresor tampoco puede convertirlas y hay que avisar acá.
      const esHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
      return esHeic
        ? `"${file.name}" está en HEIC, el formato del iPhone, y no se puede subir. En Fotos, exportala como JPG (Archivo → Exportar → JPEG) o mandátela por WhatsApp, que la convierte sola.`
        : `"${file.name}" es de tipo ${file.type || 'desconocido'}. Solo se aceptan JPG, PNG, WebP y GIF.`;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return `"${file.name}" supera el límite de ${MAX_IMAGE_SIZE_MB} MB. Por favor optimiza la imagen antes de subirla.`;
    }
  }
  return null;
}

// ── Flowers CRUD ────────────────────────────────────────────────────────────

export async function getPublicFlowers(): Promise<Flower[]> {
  const db = getDb();
  // Simple query without compound index, filter archived client-side
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Flower))
    .filter((f) => !f.archived);
}

export async function getAllFlowers(): Promise<Flower[]> {
  const db = getDb();
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Flower));
}

export async function getFlowerById(id: string): Promise<Flower | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Flower;
}

/** Etapas de una subida, para poder mostrar en qué paso va y dónde se traba. */
export type EtapaSubida = 'cuota' | 'subiendo' | 'url' | 'contador';
export type AvisoProgreso = (etapa: EtapaSubida, porcentaje?: number) => void;

export async function uploadFlowerImage(
  file: File,
  flowerId: string,
  avisar?: AvisoProgreso
): Promise<string> {
  avisar?.('cuota');
  const used = await getStorageUsedBytes();
  if (used + file.size > STORAGE_LIMIT_BYTES) {
    throw new Error('STORAGE_LIMIT_REACHED');
  }

  const storage = getStorageInstance();
  const fileRef = ref(storage, `flowers/${flowerId}/${Date.now()}_${file.name}`);

  // Resumable en vez de `uploadBytes`: da eventos de progreso, así una subida
  // lenta desde el celular se ve avanzar en vez de parecer colgada, y si se
  // traba se sabe en qué porcentaje. `uploadBytes` no avisa nada hasta el final.
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

export async function deleteFlowerImage(url: string): Promise<void> {
  const storage = getStorageInstance();
  const fileRef = ref(storage, url);
  try {
    // Leemos el tamaño real del archivo ANTES de borrarlo para decrementar el
    // contador de cuota con el valor correcto. Sin esto el contador solo crecía
    // (nunca se persistía el tamaño por imagen) y terminaba bloqueando subidas.
    const meta = await getMetadata(fileRef);
    await deleteObject(fileRef);
    await adjustStorageUsage(-(meta.size ?? 0));
  } catch {
    // El archivo no existe o no se pudo leer: nada que borrar ni descontar.
  }
}

// Sube todas las imágenes de un lote. Si alguna falla, borra las que SÍ se
// subieron (y revierte su parte del contador) y relanza el error, para no dejar
// archivos huérfanos en Storage ni un doc a medio crear.
async function uploadImagesAtomic(
  files: File[],
  flowerId: string,
  avisar?: AvisoProgreso
): Promise<string[]> {
  const results = await Promise.allSettled(
    files.map((file) => uploadFlowerImage(file, flowerId, avisar))
  );

  const uploaded = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map((r) => r.value);

  const failed = results.find((r) => r.status === 'rejected') as
    | PromiseRejectedResult
    | undefined;

  if (failed) {
    await Promise.all(uploaded.map((url) => deleteFlowerImage(url)));
    throw failed.reason;
  }

  return uploaded;
}

export async function createFlower(
  data: Omit<Flower, 'id' | 'createdAt' | 'updatedAt'>,
  imageFiles: File[],
  avisar?: AvisoProgreso
): Promise<string> {
  const db = getDb();
  // Reservamos un id sin escribir el doc todavía.
  const docRef = doc(collection(db, COLLECTION));

  // Subimos las imágenes ANTES de crear el doc. Si una falla, se limpian las
  // demás y no se crea ningún doc fantasma.
  const imageUrls = await uploadImagesAtomic(imageFiles, docRef.id, avisar);

  await setDoc(docRef, {
    ...data,
    images: imageUrls,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateFlower(
  id: string,
  data: Partial<Omit<Flower, 'id' | 'createdAt'>>,
  newImageFiles?: File[],
  avisar?: AvisoProgreso
): Promise<void> {
  const db = getDb();
  const docRef = doc(db, COLLECTION, id);
  const updates: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };

  if (newImageFiles && newImageFiles.length > 0) {
    // Base de imágenes previas: usamos las que pasa el caller; si no las pasó,
    // leemos las reales del doc para NUNCA borrarlas por accidente.
    let existing: string[];
    if (data.images !== undefined) {
      existing = data.images;
    } else {
      const snap = await getDoc(docRef);
      existing = (snap.exists() ? (snap.data().images as string[] | undefined) : undefined) ?? [];
    }
    const newUrls = await uploadImagesAtomic(newImageFiles, id, avisar);
    updates.images = [...existing, ...newUrls];
  }

  await updateDoc(docRef, updates);
}

/**
 * Aplica el mismo cambio a varias flores en una sola escritura.
 *
 * Marcar 24 flores a mano son 24 aperturas de formulario y 24 guardados, cada
 * uno con su recarga completa del catálogo. Un batch lo deja en una operación.
 *
 * Las reglas de Firestore no necesitan cambios: en un `update`,
 * `request.resource.data` es el documento YA fusionado, no el parche, y las
 * flores existentes traen name, description, inStock, archived e images.
 */
export async function bulkUpdateFlowers(
  ids: string[],
  patch: Partial<Pick<Flower, 'category' | 'availableIn' | 'inStock' | 'archived'>>
): Promise<void> {
  if (ids.length === 0) return;
  // Un batch de Firestore admite 500 operaciones. Cortar acá evita un fallo
  // opaco el día que el catálogo crezca.
  if (ids.length > 450) {
    throw new Error('DEMASIADAS_FLORES');
  }

  const db = getDb();
  const batch = writeBatch(db);
  for (const id of ids) {
    batch.update(doc(db, COLLECTION, id), { ...patch, updatedAt: serverTimestamp() });
  }

  try {
    await batch.commit();
  } catch (err) {
    // El batch es atómico: si un solo documento viola las reglas falla todo el
    // lote con un único error que no dice cuál fue. Los ids ayudan a acotarlo.
    console.error('[bulkUpdateFlowers] falló el lote', { ids, patch, err });
    throw err;
  }
}

export async function deleteFlower(id: string, images: string[]): Promise<void> {
  const db = getDb();
  // Borramos el doc PRIMERO; luego, best-effort, las imágenes. Así un fallo al
  // borrar archivos no deja un doc apuntando a imágenes inexistentes.
  await deleteDoc(doc(db, COLLECTION, id));
  await Promise.all(images.map((url) => deleteFlowerImage(url)));
}

export async function setFlowerArchived(id: string, archived: boolean): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTION, id), { archived, updatedAt: serverTimestamp() });
}

export async function setFlowerStock(id: string, inStock: boolean): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTION, id), { inStock, updatedAt: serverTimestamp() });
}
