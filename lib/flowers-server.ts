import type { Flower } from './types';

// Lectura pública del catálogo desde el SERVIDOR (Server Components), vía la API
// REST de Firestore. La lectura de `flowers` es pública en las Security Rules,
// así que no se necesita Admin SDK ni credenciales. Se cachea con ISR para que
// las flores salgan en el HTML (SEO + velocidad) y se reduzcan las lecturas.

const PROJECT_ID = 'loleanthe-2bf77';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const REVALIDATE_SECONDS = 300; // refresca el catálogo cada 5 min

interface FsValue {
  stringValue?: string;
  booleanValue?: boolean;
  timestampValue?: string;
  arrayValue?: { values?: FsValue[] };
}
interface FsDoc {
  name: string;
  fields?: Record<string, FsValue>;
}

function str(v?: FsValue): string {
  return v?.stringValue ?? '';
}
function bool(v?: FsValue): boolean {
  return v?.booleanValue ?? false;
}
function strArray(v?: FsValue): string[] {
  return (v?.arrayValue?.values ?? []).map((x) => x.stringValue ?? '');
}

function parseFlowerDoc(doc: FsDoc): Flower {
  const f = doc.fields ?? {};
  return {
    id: doc.name.split('/').pop() ?? '',
    name: str(f.name),
    description: str(f.description),
    images: strArray(f.images),
    inStock: bool(f.inStock),
    archived: bool(f.archived),
    category: f.category?.stringValue,
    createdAt: f.createdAt?.timestampValue ?? '',
    updatedAt: f.updatedAt?.timestampValue ?? '',
  };
}

export async function getPublicFlowersServer(): Promise<Flower[]> {
  try {
    const res = await fetch(`${FIRESTORE_BASE}/flowers?pageSize=300`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const data: { documents?: FsDoc[] } = await res.json();
    return (data.documents ?? [])
      .map(parseFlowerDoc)
      .filter((flower) => !flower.archived)
      // createdAt es un timestamp RFC3339, así que el orden por string = orden cronológico.
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch {
    return [];
  }
}
