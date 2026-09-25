import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

/**
 * Limpia el valor de la variable de entorno.
 *
 * Al cargar las variables en Vercel es facilísimo dejar un salto de línea o un
 * espacio al final, y Firebase no lo perdona: el valor entra tal cual en la
 * configuración y todo lo que dependa de él falla de forma opaca. Ya pasó dos
 * veces en este proyecto. Con `projectId` sucio, Firestore devolvía 503 y el
 * catálogo salía vacío. Con `storageBucket` sucio, el SDK arma la dirección
 * contra un host inválido, la petición NUNCA sale a la red, y subir una foto se
 * queda en "0%" para siempre sin un solo error en consola.
 *
 * Limpiar acá es la única defensa que no depende de que nadie se acuerde.
 */
const limpio = (v?: string) => (v ?? '').trim();

const firebaseConfig = {
  apiKey: limpio(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || 'placeholder',
  authDomain: limpio(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: limpio(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: limpio(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: limpio(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: limpio(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

function initApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(firebaseConfig);
}

export function getDb() {
  return getFirestore(initApp());
}

export function getStorageInstance() {
  return getStorage(initApp());
}

export function getAuthInstance() {
  return getAuth(initApp());
}
