import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * Invalida el caché de las tres rutas de precios apenas se publica una hoja
 * nueva desde el admin (lib/priceSheets.ts, publishPriceSheet).
 *
 * Por qué existe: sin esto, `getPublishedPriceSheetServer` (lib/priceSheets-
 * server.ts) solo se refresca cada 5 min (su `next: { revalidate }`, la
 * misma ISR que ya usa el catálogo). Publicar es un momento raro y
 * deliberado, cada 2 o 3 meses, y es justo cuando Francisco va a entrar a
 * revisar el sitio en vivo: un desfase de hasta 5 minutos ahí se lee como
 * "no funcionó", no como caché.
 */
export async function POST() {
  try {
    revalidatePath('/precios');
    revalidatePath('/precios-cr');
    revalidatePath('/precios-gt');
    return NextResponse.json({ ok: true });
  } catch (err) {
    // No es crítico: si esto falla, la hoja igual quedó publicada en
    // Firestore, solo tarda hasta 5 min en verse (ISR) en vez de al instante.
    console.error('[revalidar-precios] falló:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
