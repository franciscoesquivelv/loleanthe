import type { PriceItem, PriceSheet, PriceSheetStatus } from './priceSheets';
import { normalizeDestination, type PriceDestination } from './price-destinations';
import { readItem } from './price-sheet-rules';

// Lectura pública de la hoja de precios ACTIVA de un destino desde el SERVIDOR (Server
// Components), vía la API REST de Firestore, mismo patrón que
// lib/flowers-server.ts. La lectura de `priceSheets` es pública en las
// Security Rules, así que no se necesita Admin SDK ni credenciales.

const PROJECT_ID = 'loleanthe-2bf77';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Backstop del caché: la acción Publicar del admin llama a
// /api/revalidar-precios para que el cambio se vea al instante. Este
// `revalidate` es solo la red de seguridad si esa llamada falla.
const REVALIDATE_SECONDS = 300;

interface FsValue {
  stringValue?: string;
  booleanValue?: boolean;
  timestampValue?: string;
  integerValue?: string;
  doubleValue?: number;
  nullValue?: null;
  mapValue?: { fields?: Record<string, FsValue> };
  arrayValue?: { values?: FsValue[] };
}
interface FsDoc {
  name: string;
  fields?: Record<string, FsValue>;
}

function str(v?: FsValue): string {
  return v?.stringValue ?? '';
}
function num(v?: FsValue): number | null {
  if (v?.doubleValue != null) return v.doubleValue;
  if (v?.integerValue != null) return Number(v.integerValue);
  return null;
}
function arr(v?: FsValue): FsValue[] {
  return v?.arrayValue?.values ?? [];
}

/** Pasa el valor de la REST de Firestore a un objeto plano y deja que `readItem`
 *  (el mismo que usa el admin) arme el ítem: así los dos leen igual, también la
 *  forma vieja con `price` por tallo. Cada campo del ítem TIENE que listarse acá. */
function parsePriceItem(v: FsValue): PriceItem {
  const f = v.mapValue?.fields ?? {};
  return readItem({
    slug: f.slug?.stringValue,
    name: f.name?.stringValue,
    size: f.size?.stringValue,
    stemsPerBunch: num(f.stemsPerBunch),
    price: num(f.price),
    bunchPrice: num(f.bunchPrice),
    image: f.image?.stringValue,
    catalogFlowerId: f.catalogFlowerId?.stringValue,
    categorySlug: f.categorySlug?.stringValue,
    note: f.note?.stringValue,
  });
}

// Cada campo nuevo del documento TIENE que sumarse acá: este parser es a mano
// (REST, sin SDK) y un campo que falte llega vacío a la página sin ningún
// error. Ya pasó con `note`, y `destination` es el que más duele olvidar.
function parsePriceSheetDoc(doc: FsDoc): PriceSheet {
  const f = doc.fields ?? {};
  return {
    id: doc.name.split('/').pop() ?? '',
    title: str(f.title),
    dateStart: str(f.dateStart),
    dateEnd: str(f.dateEnd),
    description: str(f.description),
    status: (f.status?.stringValue as PriceSheetStatus) ?? 'draft',
    destination: normalizeDestination(f.destination?.stringValue),
    items: arr(f.items).map(parsePriceItem),
    createdAt: f.createdAt?.timestampValue ?? '',
    updatedAt: f.updatedAt?.timestampValue ?? '',
    publishedAt: f.publishedAt?.timestampValue,
  };
}

/**
 * La hoja que se le muestra a un visitante de UN destino: la `published` de
 * ese destino. `null` solo si la consulta funcionó y no hay ninguna (el enlace
 * muestra el aviso de "todavía no está publicada").
 *
 * El destino es argumento obligatorio y sin valor por defecto: ninguna ruta
 * puede "olvidarse" de pasarlo y recibir la hoja más reciente de cualquier
 * país. Una hoja sin destino válido no sale en ningún enlace.
 *
 * Si Firestore falla, LANZA en vez de devolver `null`. Antes se disfrazaba de
 * "no hay hoja" y, con ISR, una falla pasajera reemplazaba una página buena
 * por el aviso durante hasta 5 minutos para todos los visitantes. Lanzando,
 * Next conserva la última versión buena y reintenta.
 */
export async function getPublishedPriceSheetServer(destination: PriceDestination): Promise<PriceSheet | null> {
  const res = await fetch(`${FIRESTORE_BASE}/priceSheets?pageSize=300`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`[priceSheets] Firestore respondió ${res.status}`);
  const data: { documents?: FsDoc[] } = await res.json();

  // Por diseño hay una sola `published` por destino (lo aplica
  // publishPriceSheet en lib/priceSheets.ts, no las reglas). Si por una carrera
  // o una edición en la consola hubiera más de una, gana la más reciente en
  // vez de que la página se rompa, y se deja el aviso en el log.
  const candidatas = (data.documents ?? [])
    .map(parsePriceSheetDoc)
    .filter((s) => s.status === 'published' && s.destination === destination)
    .sort(
      (a, b) =>
        (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '') ||
        b.updatedAt.localeCompare(a.updatedAt) ||
        a.id.localeCompare(b.id)
    );
  if (candidatas.length > 1) {
    console.error(`[priceSheets] ${candidatas.length} hojas publicadas en ${destination}; se muestra la más reciente`);
  }
  return candidatas[0] ?? null;
}
