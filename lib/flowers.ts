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
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
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

export function validateImageFiles(files: File[]): string | null {
  for (const file of files) {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return `"${file.name}" supera el límite de ${MAX_IMAGE_SIZE_MB} MB. Por favor optimiza la imagen antes de subirla.`;
    }
  }
  return null;
}

// ── Flowers CRUD ────────────────────────────────────────────────────────────

export async function getPublicFlowers(): Promise<Flower[]> {
  const db = getDb();
  // Simple query without compound index — filter archived client-side
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

export async function uploadFlowerImage(file: File, flowerId: string): Promise<string> {
  // Check storage limit before uploading
  const used = await getStorageUsedBytes();
  if (used + file.size > STORAGE_LIMIT_BYTES) {
    throw new Error('STORAGE_LIMIT_REACHED');
  }

  const storage = getStorageInstance();
  const fileRef = ref(storage, `flowers/${flowerId}/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);

  // Track usage
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
async function uploadImagesAtomic(files: File[], flowerId: string): Promise<string[]> {
  const results = await Promise.allSettled(
    files.map((file) => uploadFlowerImage(file, flowerId))
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
  imageFiles: File[]
): Promise<string> {
  const db = getDb();
  // Reservamos un id sin escribir el doc todavía.
  const docRef = doc(collection(db, COLLECTION));

  // Subimos las imágenes ANTES de crear el doc. Si una falla, se limpian las
  // demás y no se crea ningún doc fantasma.
  const imageUrls = await uploadImagesAtomic(imageFiles, docRef.id);

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
  newImageFiles?: File[]
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
    const newUrls = await uploadImagesAtomic(newImageFiles, id);
    updates.images = [...existing, ...newUrls];
  }

  await updateDoc(docRef, updates);
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
