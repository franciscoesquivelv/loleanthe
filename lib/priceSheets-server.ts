import type { CountryCode } from './types';
import type { PriceItem, PriceSheet, PriceSheetStatus } from './priceSheets';

// Lectura pública de la hoja de precios ACTIVA desde el SERVIDOR (Server
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

function parsePriceItem(v: FsValue): PriceItem {
  const f = v.mapValue?.fields ?? {};
  const priceByCountryFields = f.priceByCountry?.mapValue?.fields ?? {};
  const priceByCountry: Partial<Record<CountryCode, number>> = {};
  for (const [code, val] of Object.entries(priceByCountryFields)) {
    const n = num(val);
    if (n != null) priceByCountry[code as CountryCode] = n;
  }
  return {
    slug: str(f.slug),
    name: str(f.name),
    size: f.size?.stringValue,
    stemsPerBunch: num(f.stemsPerBunch) ?? 0,
    price: num(f.price),
    priceByCountry: Object.keys(priceByCountry).length > 0 ? priceByCountry : undefined,
    image: f.image?.stringValue,
    catalogFlowerId: f.catalogFlowerId?.stringValue,
    categorySlug: f.categorySlug?.stringValue,
    note: f.note?.stringValue,
  };
}

function parsePriceSheetDoc(doc: FsDoc): PriceSheet {
  const f = doc.fields ?? {};
  return {
    id: doc.name.split('/').pop() ?? '',
    title: str(f.title),
    dateStart: str(f.dateStart),
    dateEnd: str(f.dateEnd),
    description: str(f.description),
    status: (f.status?.stringValue as PriceSheetStatus) ?? 'draft',
    items: arr(f.items).map(parsePriceItem),
    createdAt: f.createdAt?.timestampValue ?? '',
    updatedAt: f.updatedAt?.timestampValue ?? '',
    publishedAt: f.publishedAt?.timestampValue,
  };
}

/**
 * La hoja de precios que se le muestra a un visitante: la única con
 * `status === 'published'`. `null` si todavía no se publicó ninguna (por
 * ejemplo, recién desplegado el sistema y falta correr la migración).
 */
export async function getPublishedPriceSheetServer(): Promise<PriceSheet | null> {
  try {
    const res = await fetch(`${FIRESTORE_BASE}/priceSheets?pageSize=300`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const data: { documents?: FsDoc[] } = await res.json();
    const sheets = (data.documents ?? []).map(parsePriceSheetDoc);
    // Por diseño solo debería haber una `published` a la vez (lo aplica
    // publishPriceSheet en lib/priceSheets.ts, no estas reglas); si por
    // algún motivo hubiera más de una, se toma la más reciente en vez de
    // que la página se rompa.
    const published = sheets
      .filter((s) => s.status === 'published')
      .sort((a, b) => (a.publishedAt ?? '') < (b.publishedAt ?? '') ? 1 : -1);
    return published[0] ?? null;
  } catch {
    return null;
  }
}
