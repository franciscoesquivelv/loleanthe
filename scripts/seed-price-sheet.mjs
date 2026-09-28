// Migra la hoja de precios que hasta hoy vivía hardcodeada en
// app/precios/data.ts (PRICE_ITEMS/SHIPMENT_TITLE, ya borrados de ahí) a la
// colección `priceSheets`, para que sea editable desde el admin.
//
// No resube ninguna foto: las 9 imágenes actuales quedan donde están, en
// /public/images-dia-de-la-madre, y ese path funciona igual de bien que una
// URL de Storage (next/image sirve cualquiera de las dos).
//
// `catalogFlowerId` se resuelve UNA vez acá, contra el catálogo real, en vez
// de hacerlo en cada render por nombre (el mecanismo viejo, que ya rompió
// dos veces: un typo en el catálogo, una categoría mal asignada).
//
// Uso: node scripts/seed-price-sheet.mjs <ruta-al-service-account.json>
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const [, , serviceAccountPath] = process.argv;
if (!serviceAccountPath) {
  console.error('Uso: node scripts/seed-price-sheet.mjs <service-account.json>');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// TODO(Francisco): confirmar las fechas reales de esta temporada antes de
// correr el script. "YYYY-MM-DD", como las guarda el documento.
const DATE_START = '2026-10-01';
const DATE_END = '2026-12-31';

const TITLE = 'Temporada Octubre - Diciembre';
const DESCRIPTION =
  'Precios en dólares (USD). Rosas en bunch de 25 tallos, el resto de 10. ' +
  'La mayoría de estas variedades viene en distintos colores, escríbenos ' +
  'para ver la disponibilidad de la temporada.';

// Mismos 9 ítems que estaban en PRICE_ITEMS. `catalogName` es solo para esta
// migración (se resuelve a `catalogFlowerId` más abajo, no se guarda tal cual).
const ITEMS = [
  { slug: 'rosa', name: 'Rosa', size: '50 cm', stemsPerBunch: 25, price: 1.0, image: '/images-dia-de-la-madre/rosa.jpg', categorySlug: 'rosas' },
  { slug: 'rosa-garden', name: 'Rosa Garden', size: '50 cm', stemsPerBunch: 25, price: 3.18, image: '/images-dia-de-la-madre/rosa-garden.jpg', catalogName: "White O'hara", categorySlug: 'rosas-garden' },
  { slug: 'ranunculus', name: 'Ranunculus', size: '35 cm', stemsPerBunch: 10, price: 3.19, image: '/images-dia-de-la-madre/ranunculus.jpg', categorySlug: 'ranunculus' },
  { slug: 'crisantemo', name: 'Crisantemo', size: '70 cm', stemsPerBunch: 10, price: 2.05, image: '/images-dia-de-la-madre/crisantemo.jpg', catalogName: 'Crisantemo', categorySlug: 'fillers' },
  { slug: 'delphinium', name: 'Delphinium', size: '80 cm', stemsPerBunch: 10, price: 1.8, image: '/images-dia-de-la-madre/delphinium.jpg', catalogName: 'Delphinium Sea Waltz' },
  { slug: 'larkspur', name: 'Larkspur', size: '80 cm', stemsPerBunch: 10, price: 2.2, image: '/images-dia-de-la-madre/larkspur.jpg', catalogName: 'Larkspur', categorySlug: 'fillers' },
  { slug: 'hypericum', name: 'Hypericum', size: '60 cm', stemsPerBunch: 10, price: 1.28, image: '/images-dia-de-la-madre/hypericum.jpg', catalogName: 'Hypericum' },
  { slug: 'limonium', name: 'Limonium', size: '70 cm', stemsPerBunch: 10, price: 2.2, image: '/images-dia-de-la-madre/limonium.jpg', catalogName: 'Limonium', categorySlug: 'fillers' },
  // El precio es "el mismo de la gypso blanca": 12 / 10 tallos = 1.20.
  { slug: 'gypsophila', name: 'Gypsophila de colores', size: '60-80 cm', stemsPerBunch: 10, price: 1.2, image: '/images-dia-de-la-madre/gypsophila-colores.jpg', catalogName: 'Gypsophila Xlence' },
];

async function resolverCatalogFlowerId(items) {
  const snap = await db.collection('flowers').get();
  const porNombre = new Map(snap.docs.map((d) => [String(d.data().name ?? '').toLowerCase(), d.id]));

  return items.map(({ catalogName, ...item }) => {
    if (!catalogName) return item;
    const id = porNombre.get(catalogName.toLowerCase());
    if (!id) {
      console.warn(`  aviso: "${catalogName}" no calzó con ninguna flor del catálogo, "${item.name}" queda sin enlace directo`);
      return item;
    }
    return { ...item, catalogFlowerId: id };
  });
}

async function main() {
  const existentes = await db.collection('priceSheets').limit(1).get();
  if (!existentes.empty) {
    console.error('Ya existe al menos una hoja en `priceSheets`. Este script es para la migración inicial, no lo corras dos veces.');
    process.exit(1);
  }

  console.log('Resolviendo catalogFlowerId contra el catálogo real...');
  const items = await resolverCatalogFlowerId(ITEMS);

  const docRef = db.collection('priceSheets').doc();
  await docRef.set({
    title: TITLE,
    dateStart: DATE_START,
    dateEnd: DATE_END,
    description: DESCRIPTION,
    status: 'published',
    items,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    publishedAt: FieldValue.serverTimestamp(),
  });

  console.log(`\nListo. Hoja publicada: ${docRef.id} (${items.length} ítems).`);
}

main().catch((err) => {
  console.error('Error migrando la hoja de precios:', err);
  process.exit(1);
});
