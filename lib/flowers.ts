import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { getDb, getStorageInstance } from './firebase';
import type { Flower } from './types';

const COLLECTION = 'flowers';

export async function getPublicFlowers(): Promise<Flower[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION),
    where('archived', '==', false),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Flower));
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
  const storage = getStorageInstance();
  const fileRef = ref(storage, `flowers/${flowerId}/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export async function deleteFlowerImage(url: string): Promise<void> {
  try {
    const storage = getStorageInstance();
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch {
    // Ignore if file doesn't exist
  }
}

export async function createFlower(
  data: Omit<Flower, 'id' | 'createdAt' | 'updatedAt'>,
  imageFiles: File[]
): Promise<string> {
  const db = getDb();
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    images: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const imageUrls = await Promise.all(
    imageFiles.map((file) => uploadFlowerImage(file, docRef.id))
  );

  await updateDoc(docRef, { images: imageUrls, updatedAt: serverTimestamp() });
  return docRef.id;
}

export async function updateFlower(
  id: string,
  data: Partial<Omit<Flower, 'id' | 'createdAt'>>,
  newImageFiles?: File[]
): Promise<void> {
  const db = getDb();
  const updates: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };

  if (newImageFiles && newImageFiles.length > 0) {
    const newUrls = await Promise.all(
      newImageFiles.map((file) => uploadFlowerImage(file, id))
    );
    const existing = data.images || [];
    updates.images = [...existing, ...newUrls];
  }

  await updateDoc(doc(db, COLLECTION, id), updates);
}

export async function deleteFlower(id: string, images: string[]): Promise<void> {
  const db = getDb();
  await Promise.all(images.map(deleteFlowerImage));
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function setFlowerArchived(id: string, archived: boolean): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTION, id), { archived, updatedAt: serverTimestamp() });
}

export async function setFlowerStock(id: string, inStock: boolean): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTION, id), { inStock, updatedAt: serverTimestamp() });
}
