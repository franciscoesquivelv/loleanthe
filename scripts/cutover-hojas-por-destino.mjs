// Puesta en marcha de las hojas de precios por destino (2026-10). Dos pasos, con
// la fusión de los PR de por medio:
//
//   PASO 1, ANTES de fusionar: poner `destination = 'CR'` a la hoja viva. El código
//   viejo ignora el campo; el nuevo no muestra una hoja sin destino, así que sin
//   este paso /precios-cr diría "todavía no está publicada" al desplegar.
//
//   PASO 2, DESPUÉS del despliegue: crear como BORRADORES la hoja de Guatemala
//   (la lista "Precios tentativos Guate", 18 precios por bunch en USD) y la General
//   (copia de la de Costa Rica). Escribe en la forma nueva (`bunchPrice`): el admin
//   de antes del cambio no sabe abrirlas.
//
// Sin llave solo se puede ensayar: lee por la API pública de Firestore (las lecturas
// de `flowers` y `priceSheets` son públicas) e imprime lo que haría. Con
// `--apply` hace falta la llave de servicio, que se usa y se borra.
//
// Uso:
//   node scripts/cutover-hojas-por-destino.mjs --paso=destino                          ensayo
//   node scripts/cutover-hojas-por-destino.mjs --paso=destino <llave.json> --apply     lo hace
//   node scripts/cutover-hojas-por-destino.mjs --paso=borradores                       ensayo
//   node scripts/cutover-hojas-por-destino.mjs --paso=borradores <llave.json> --apply [--publicar-general]
//
// `--publicar-general` deja la General publicada (copia de la de Costa Rica) para que
// /precios siga mostrando lo mismo que mostraba hasta hoy, sin un hueco.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const paso = (args.find((a) => a.startsWith('--paso=')) ?? '').slice(7);
const APPLY = args.includes('--apply');
const PUBLICAR_GENERAL = args.includes('--publicar-general');
const keyPath = args.find((a) => a.endsWith('.json'));

if (!['destino', 'borradores'].includes(paso)) {
  console.error('Uso: node scripts/cutover-hojas-por-destino.mjs --paso=destino|borradores [<llave.json> --apply]');
  process.exit(1);
}
if (APPLY && !keyPath) {
  console.error('--apply necesita la llave de servicio (<llave.json>).');
  process.exit(1);
}

const PROJECT_ID = 'loleanthe-2bf77';
const REST = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ── Lectura pública (ensayo y apply comparten la misma foto del estado) ──────
const fsVal = (v) => {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(fsVal);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields ?? {}).map(([k, x]) => [k, fsVal(x)]));
  return null;
};
async function leer(coleccion) {
  const res = await fetch(`${REST}/${coleccion}?pageSize=300`);
  if (!res.ok) throw new Error(`Firestore respondió ${res.status} leyendo ${coleccion}`);
  const { documents = [] } = await res.json();
  return documents.map((d) => ({
    id: d.name.split('/').pop(),
    ...Object.fromEntries(Object.entries(d.fields ?? {}).map(([k, v]) => [k, fsVal(v)])),
  }));
}

const hojas = await leer('priceSheets');
const publicadas = hojas.filter((h) => h.status === 'published');

// ── Escritura (solo con --apply) ─────────────────────────────────────────────
let db = null;
let FieldValue = null;
if (APPLY) {
  const require = createRequire(new URL('../package.json', import.meta.url));
  const { initializeApp, cert } = require('firebase-admin/app');
  ({ FieldValue } = require('firebase-admin/firestore'));
  initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
  db = require('firebase-admin/firestore').getFirestore();
}

// ═════════════════════════════════════════════════════════════════════════════
if (paso === 'destino') {
  const sinDestino = publicadas.filter((h) => !h.destination);
  const conDestino = publicadas.filter((h) => h.destination);
  console.log(`Hojas publicadas: ${publicadas.length} (${conDestino.length} con destino, ${sinDestino.length} sin destino).`);
  for (const h of conDestino) console.log(`  ya tiene destino: «${h.title}» -> ${h.destination}`);
  if (sinDestino.length === 0) {
    console.log('Nada que hacer: ninguna hoja publicada le falta el destino.');
    process.exit(0);
  }
  if (sinDestino.length > 1) {
    console.error('Hay más de una hoja publicada sin destino: no se adivina cuál es la de Costa Rica. Se revisa a mano.');
    process.exit(1);
  }
  const [h] = sinDestino;
  console.log(`\n«${h.title}» (${h.id}, ${h.items?.length ?? 0} flores): destination = 'CR'`);
  console.log(`  flores: ${(h.items ?? []).map((i) => i.name).join(', ')}`);
  if (!APPLY) {
    console.log('\nENSAYO: no se escribió nada.');
    process.exit(0);
  }
  await db.collection('priceSheets').doc(h.id).update({ destination: 'CR', updatedAt: FieldValue.serverTimestamp() });
  console.log('\nListo: destination = CR. El sitio de hoy no cambia (ignora el campo); ya se puede fusionar.');
  process.exit(0);
}

// ═════════════════════════════════════════════════════════════════════════════
// paso === 'borradores'
const TITULO = 'Temporada Octubre - Diciembre';
const DATE_START = '2026-10-01';
const DATE_END = '2026-12-31';

// Imágenes que ya usa la hoja de Costa Rica para las categorías.
const IMG = {
  rosas: '/images-dia-de-la-madre/rosa.jpg',
  'rosas-garden': '/images-dia-de-la-madre/rosa-garden.jpg',
  ranunculus: '/images-dia-de-la-madre/ranunculus.jpg',
};

// La lista de Guatemala, tal como llegó (precio por BUNCH, USD). `flor` es el nombre
// exacto en el catálogo; `categoria` enlaza a la categoría completa. Los tallos son
// un SUPUESTO (iguales a Costa Rica) que la dueña tiene que confirmar; sin `stems`
// se vende por peso.
const LISTA_GT = [
  { name: 'Rosas', categoria: 'rosas', bunch: 20, stems: 25 },
  { name: 'Garden roses', categoria: 'rosas-garden', bunch: 35, stems: 25 },
  { name: 'Ranúnculos', categoria: 'ranunculus', bunch: 17, stems: 10 },
  { name: 'Crisantemo', flor: 'Crisantemo', bunch: 16, stems: 10 },
  { name: 'Delphinium', flor: 'Delphinium Sea Waltz', bunch: 11, stems: 10 },
  { name: 'Larkspur', flor: 'Larkspur', bunch: 11, stems: 10 },
  { name: 'Hypericum', flor: 'Hypericum', bunch: 11, stems: 10 },
  { name: 'Limonium', flor: 'Limonium', bunch: 11, stems: 10 },
  { name: 'Gypsophila', flor: 'Gypsophila Xlence', bunch: 5.8, note: 'Se vende por peso, bunch de 250 g, no por cantidad fija.' },
  { name: 'Solidago', flor: 'Solidago Golden Glory', bunch: 5.8, stems: 10 },
  { name: 'Stock', flor: 'Stock', bunch: 11.35, stems: 10 },
  { name: 'Ruscus', flor: 'Ruscus', bunch: 5.8, stems: 10 },
  { name: 'Eryngium', flor: 'Eryngium', bunch: 11.35, stems: 10 },
  { name: 'Clavel', flor: 'Clavel', bunch: 12, stems: 10 },
  { name: 'Campana de Irlanda', flor: 'Campana de Irlanda', bunch: 8.5, stems: 10 },
  { name: 'Calas', flor: 'Calas', bunch: 18, stems: 10 },
  { name: 'Amaranthus', flor: 'Amaranthus', bunch: 12.2, stems: 10 },
  { name: 'Alstromeria', flor: 'Alstromeria', bunch: 12.2, stems: 10 }, // como en el catálogo (decisión de la dueña)
];

const slugify = (n) =>
  n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const flores = await leer('flowers');
const porNombre = new Map(flores.map((f) => [f.name, f]));

const itemsGT = LISTA_GT.map((r) => {
  const f = r.flor ? porNombre.get(r.flor) : null;
  if (r.flor && !f) throw new Error(`No está en el catálogo: "${r.flor}"`);
  return {
    slug: slugify(r.name),
    name: r.name,
    bunchPrice: r.bunch,
    ...(r.stems && { stemsPerBunch: r.stems }),
    ...(f?.images?.[0] && { image: f.images[0] }),
    ...(r.categoria && { image: IMG[r.categoria], categorySlug: r.categoria }),
    ...(f && { catalogFlowerId: f.id }),
    ...(r.note && { note: r.note }),
  };
});

// General = copia de la hoja viva de Costa Rica, en la forma nueva (bunchPrice).
// En el ensayo, si todavía no se le puso el destino (paso 1), se usa la única hoja
// publicada como si fuera la de Costa Rica, solo para poder ver el resultado.
const cr = publicadas.find((h) => h.destination === 'CR') ?? (!APPLY ? publicadas.find((h) => !h.destination) : undefined);
if (cr && !cr.destination) console.log('(ensayo) La hoja viva todavía no tiene destino: se usa como si fuera la de Costa Rica.');
if (!cr) {
  console.error('No hay una hoja de Costa Rica publicada con destino (¿ya se hizo --paso=destino y se desplegó?).');
  process.exit(1);
}
const aBunch = (i) => {
  // eslint-disable-next-line no-unused-vars
  const { price, priceByCountry, ...resto } = i;
  const bunchPrice =
    typeof i.bunchPrice === 'number' ? i.bunchPrice : price != null && i.stemsPerBunch ? Math.round(price * i.stemsPerBunch * 100) / 100 : null;
  return { ...resto, bunchPrice };
};
const itemsGeneral = (cr.items ?? []).map(aBunch);

const nuevas = [
  {
    destination: 'GT',
    title: TITULO,
    description: 'Precios en dólares (USD). Rosas en bunch de 25 tallos, el resto de 10. Precios tentativos: los confirmamos al cotizar.',
    items: itemsGT,
    publicar: false,
  },
  { destination: 'GENERAL', title: TITULO, description: cr.description ?? '', items: itemsGeneral, publicar: PUBLICAR_GENERAL },
];

for (const h of nuevas) {
  const ya = hojas.find((x) => x.destination === h.destination && x.status !== 'archived' && x.title === h.title && x.id);
  console.log(`\n${h.destination}  «${h.title}»  (${h.items.length} flores)  ${h.publicar ? 'SE PUBLICA' : 'borrador'}${ya ? `   AVISO: ya existe una hoja ${ya.status} igual (${ya.id}), se salta` : ''}`);
  for (const i of h.items) {
    const porTallo = i.stemsPerBunch && i.bunchPrice != null ? `${(i.bunchPrice / i.stemsPerBunch).toFixed(2)}/tallo` : 'por peso';
    console.log(
      `  ${i.name.padEnd(24)} $${String(i.bunchPrice).padEnd(6)} ${String(i.stemsPerBunch ?? '-').padStart(3)} tallos  ${porTallo.padEnd(12)} ${i.catalogFlowerId ? 'flor' : i.categorySlug ? 'categoría' : 'sin enlace'}`
    );
  }
  h.saltar = !!ya;
}

if (!APPLY) {
  console.log('\nENSAYO: no se creó nada. Con la llave y --apply se crean.');
  process.exit(0);
}

for (const h of nuevas) {
  if (h.saltar) continue;
  const ref = db.collection('priceSheets').doc();
  await ref.set({
    title: h.title,
    dateStart: DATE_START,
    dateEnd: DATE_END,
    description: h.description,
    status: h.publicar ? 'published' : 'draft',
    destination: h.destination,
    items: h.items,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    ...(h.publicar && { publishedAt: FieldValue.serverTimestamp() }),
  });
  console.log(`Creada ${h.publicar ? 'y publicada' : 'como borrador'}: ${h.destination} ${ref.id}`);
}
console.log('\nListo. Los borradores se revisan y se publican desde el admin (Precios).');
