import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDb } from './firebase';
import type { QuoteItem } from './types';

export interface DatosSolicitud {
  name: string;
  email: string;
  phone: string;
  buyerType?: string;
  volume?: string;
  message: string;
}

/**
 * Manda la solicitud por DOS caminos independientes y a la vez:
 *
 *   1. El aviso por correo, que corre en el servidor y no depende de las
 *      reglas de Firestore ni de la sesión del visitante.
 *   2. El registro en Firestore, que es lo que alimenta el panel de admin.
 *
 * Basta con que UNO funcione para dar la solicitud por recibida. Hasta hoy el
 * único camino era Firestore, y cuando sus reglas rechazaban la escritura la
 * solicitud se perdía entera sin que nadie se enterara. Un cliente que escribe
 * no se puede perder porque falló una de las dos mitades.
 *
 * Devuelve qué camino funcionó, para poder registrarlo.
 */
export async function enviarSolicitud(
  datos: DatosSolicitud,
  flores: QuoteItem[],
  origen: 'cotizacion' | 'contacto'
): Promise<{ correo: boolean; registro: boolean }> {
  const [correo, registro] = await Promise.allSettled([
    fetch('/api/notificar-solicitud', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...datos, flowers: flores, origen }),
    }).then((res) => {
      // `fetch` no rechaza ante un 4xx o 5xx, hay que mirarlo a mano.
      if (!res.ok) throw new Error(`notificacion_${res.status}`);
    }),
    addDoc(collection(getDb(), 'inquiries'), {
      ...datos,
      flowers: flores,
      createdAt: serverTimestamp(),
      status: 'pending',
    }),
  ]);

  if (correo.status === 'rejected') {
    console.error('[solicitud] no se pudo mandar el aviso por correo:', correo.reason);
  }
  if (registro.status === 'rejected') {
    console.error('[solicitud] no se pudo guardar en Firestore:', registro.reason);
  }

  const ok = { correo: correo.status === 'fulfilled', registro: registro.status === 'fulfilled' };
  if (!ok.correo && !ok.registro) {
    throw new Error('AMBOS_CAMINOS_FALLARON');
  }
  return ok;
}
