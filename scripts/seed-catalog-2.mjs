// Segunda tanda del catálogo real (2026-09-18) — las 11 variedades restantes
// que el consejo no marcó para reconsiderar (se excluyeron Bluez, Frutteto,
// Antonia Garden, Kahala, Limonium, Butterfly y Larkspur — ver memoria de Marcus).
// Uso: node scripts/seed-catalog-2.mjs <ruta-al-service-account.json> <carpeta-de-fotos>
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const [, , serviceAccountPath, photosDir] = process.argv;
if (!serviceAccountPath || !photosDir) {
  console.error('Uso: node scripts/seed-catalog-2.mjs <service-account.json> <carpeta-de-fotos>');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'loleanthe-2bf77.firebasestorage.app',
});

const db = getFirestore();
const bucket = getStorage().bucket();

const FLOWERS = [
  {
    slug: 'pink-xpression', name: 'Pink Xpression', category: 'Rosas', tier: 'Premium', apertura: 'Prime',
    stemLength: '50-80cm', vaseLifeDays: 13, colors: ['#EC1E7A'],
    description: 'Rosa uniforme con pétalos rizados y perfume delicado. Su tono claro constante y duradero brinda armonía en composiciones elegantes.',
  },
  {
    slug: 'bikini', name: 'Bikini', category: 'Rosas', tier: 'Grand', apertura: 'Prime',
    stemLength: '50-70cm', vaseLifeDays: 13, colors: ['#FDD835'],
    description: 'Amarillo brillante de gran apertura. Genera un punto focal vibrante y energético, perfecto para composiciones luminosas y expresivas.',
  },
  {
    slug: 'gotcha', name: 'Gotcha', category: 'Rosas', tier: 'Grand', apertura: 'Majestic',
    stemLength: '50-80cm', vaseLifeDays: 15, colors: ['#E6007E'],
    description: 'Fucsia intenso con botón grande y apertura amplia. Su fuerza visual aporta contraste vibrante en arreglos modernos y sofisticados.',
  },
  {
    slug: 'pink-floyd', name: 'Pink Floyd', category: 'Rosas', tier: 'Grand', apertura: 'Royal',
    stemLength: '50-80cm', vaseLifeDays: 13, colors: ['#D6006D'],
    description: 'Fucsia vibrante con perfume y tallos gruesos. Su apertura clásica y durabilidad la hacen destacar en composiciones de gran impacto.',
  },
  {
    slug: 'sweet-unique', name: 'Sweet Unique', category: 'Rosas', tier: 'Grand', apertura: 'Royal',
    stemLength: '50-70cm', vaseLifeDays: 15, colors: ['#F06BA8'],
    description: 'Bicolor crema con rosado en degradado. Su tono lila estable genera transiciones suaves y elegantes en composiciones refinadas.',
  },
  {
    slug: 'hearts', name: 'Hearts', category: 'Rosas', tier: 'Exotic', apertura: 'Royal',
    stemLength: '50-70cm', vaseLifeDays: 13, colors: ['#7A0C1E'],
    description: 'Rojo oscuro con apertura que asemeja un corazón. Genera un foco intenso y elegante, ideal para arreglos apasionados y lujosos.',
  },
  {
    slug: 'magic-times', name: 'Magic Times', category: 'Rosas', tier: 'Exotic', apertura: 'Prime',
    stemLength: '50-70cm', vaseLifeDays: 13, colors: ['#F8E8D8', '#E85C8A'],
    description: 'Bicolor jaspeado de crema a frambuesa. Su tonalidad única añade exclusividad y un acento distintivo en arreglos premium.',
  },
  {
    slug: 'phoenix', name: 'Phoenix', category: 'Rosas', tier: 'Exotic', apertura: 'Prime',
    stemLength: '50-70cm', vaseLifeDays: 11, colors: ['#F4A860'],
    description: 'Durazno con matices anaranjados y pétalos que evocan garden rose. Aporta calidez elegante y textura singular a composiciones cálidas.',
  },
  {
    slug: 'tycoon', name: 'Tycoon', category: 'Rosas', tier: 'Exotic', apertura: 'Royal',
    stemLength: '50-70cm', vaseLifeDays: 11, colors: ['#E8A317'],
    description: 'Amarillo mostaza radiante con pétalos firmes. Su luminosidad intensa añade contraste sofisticado en composiciones de gran tamaño.',
  },
  {
    slug: 'gypsophila-xlence', name: 'Gypsophila Xlence', category: 'Fillers', apertura: 'Bouton',
    stemLength: '60-80cm', vaseLifeDays: 18, colors: ['#F48FB1', '#FFFFFF', '#81D4FA', '#FFF59D'],
    description: 'Relleno blanco de gran volumen y duración. Base ideal para dar textura y realce a arreglos amplios y premium.',
  },
  {
    slug: 'solidago-golden-glory', name: 'Solidago Golden Glory', category: 'Fillers', apertura: 'Bouton',
    stemLength: '60-70cm', vaseLifeDays: 9, colors: ['#FDD835'],
    description: 'Amarillo intenso en racimos; bueno para aportar luminosidad y contraste cálido.',
  },
];

async function uploadPhoto(slug, docId) {
  const filePath = path.join(photosDir, `${slug}.jpg`);
  const destPath = `flowers/${docId}/${slug}.jpg`;
  const token = randomUUID();
  await bucket.upload(filePath, {
    destination: destPath,
    metadata: {
      contentType: 'image/jpeg',
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destPath)}?alt=media&token=${token}`;
}

async function main() {
  for (const flower of FLOWERS) {
    const docRef = db.collection('flowers').doc();
    process.stdout.write(`Subiendo ${flower.name}... `);
    const imageUrl = await uploadPhoto(flower.slug, docRef.id);

    const { slug, ...data } = flower;
    void slug;
    await docRef.set({
      ...data,
      images: [imageUrl],
      inStock: true,
      archived: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`OK (${docRef.id})`);
  }
  console.log(`\nListo — ${FLOWERS.length} flores más cargadas.`);
}

main().catch((err) => {
  console.error('Error cargando el catálogo:', err);
  process.exit(1);
});
