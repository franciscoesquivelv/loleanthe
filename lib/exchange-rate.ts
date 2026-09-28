/**
 * Tipo de cambio de USD a colones (Costa Rica) y quetzales (Guatemala) para
 * mostrar en las hojas de precios por país, como referencia aproximada junto
 * al precio en dólares, que es el precio real.
 *
 * Se pide a una API pública sin llave (open.er-api.com) con ISR de 24 horas,
 * igual que el catálogo se cachea con `next: { revalidate }`. Si la API falla
 * o tarda, cae a un valor de respaldo fijo en vez de romper la página: mejor
 * un número un poco viejo que una hoja de precios que no carga.
 */

const REVALIDATE_SECONDS = 60 * 60 * 24; // 24 horas: el cambio no se mueve tanto como para justificar más.

// Respaldo si la API no responde. Verificado a mano el 2026-09-28; si hace
// mucho que no se actualiza, conviene revisar que siga siendo razonable.
const RESPALDO = { CRC: 505, GTQ: 7.75 } as const;
const FECHA_RESPALDO = '2026-09-28';

export interface TipoDeCambio {
  crc: number;
  gtq: number;
  fecha: string;
  esRespaldo: boolean;
}

export async function getTipoDeCambio(): Promise<TipoDeCambio> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`open.er-api.com respondió ${res.status}`);
    const data = await res.json();
    const crc = data?.rates?.CRC;
    const gtq = data?.rates?.GTQ;
    if (typeof crc !== 'number' || typeof gtq !== 'number') {
      throw new Error('la respuesta no trae CRC o GTQ');
    }
    const fecha = typeof data?.time_last_update_utc === 'string'
      ? data.time_last_update_utc
      : new Date().toISOString();
    return { crc, gtq, fecha, esRespaldo: false };
  } catch (err) {
    console.error('[exchange-rate] no se pudo obtener el tipo de cambio, usando respaldo:', err);
    return { crc: RESPALDO.CRC, gtq: RESPALDO.GTQ, fecha: FECHA_RESPALDO, esRespaldo: true };
  }
}

/** Redondea a la unidad, sin decimales: ni el colón ni el quetzal se cotizan
 *  con centavos en un contexto de mayoreo, y agrega ruido visual. */
export function formatoLocal(usd: number, tasa: number, simbolo: string): string {
  const monto = Math.round(usd * tasa);
  return `${simbolo}${monto.toLocaleString('es-CR')}`;
}
