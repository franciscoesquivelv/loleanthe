import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { PRICE_DESTINATIONS } from '@/lib/price-destinations';

/**
 * Invalida el caché de las rutas de precios apenas cambia algo publicado desde
 * el admin (lib/priceSheets.ts: publicar, quitar, mover, editar una hoja viva).
 *
 * Por qué existe: sin esto, `getPublishedPriceSheetServer` (lib/priceSheets-
 * server.ts) solo se refresca cada 5 min (su `next: { revalidate }`, la
 * misma ISR que ya usa el catálogo). Publicar es un momento raro y
 * deliberado, y es justo cuando Francisco va a entrar a revisar el sitio en
 * vivo: un desfase de hasta 5 minutos ahí se lee como "no funcionó", no como
 * caché.
 *
 * Siempre invalida las rutas de TODOS los destinos, no solo la del afectado:
 * las rutas comparten una misma lectura de la colección, y invalidar de más
 * cuesta unas lecturas en un momento raro, mientras que invalidar de menos
 * deja una hoja recién publicada sin verse. La lista sale de
 * PRICE_DESTINATIONS, así un destino nuevo no se puede olvidar acá.
 */
export async function POST() {
  try {
    for (const { route } of PRICE_DESTINATIONS) revalidatePath(route);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // No es crítico: si esto falla, la hoja igual quedó guardada en Firestore,
    // solo tarda hasta 5 min en verse (ISR) en vez de al instante. El admin lo
    // sabe por el 500 y se lo dice a quien publicó.
    console.error('[revalidar-precios] falló:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
