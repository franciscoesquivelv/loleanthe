// Carga puntual del catálogo real (revisión del consejo, 2026-09-18).
// Uso: node scripts/seed-catalog.mjs <ruta-al-service-account.json> <carpeta-de-fotos>
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const [, , serviceAccountPath, photosDir] = process.argv;
if (!serviceAccountPath || !photosDir) {
  console.error('Uso: node scripts/seed-catalog.mjs <service-account.json> <carpeta-de-fotos>');
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
    slug: 'red-panther', name: 'Red Panther', category: 'Rosas', tier: 'Premium', apertura: 'Majestic',
    stemLength: '50-70cm', vaseLifeDays: 15, colors: ['#8B0000', '#C2185B'],
    description: 'Rojo profundo con jaspeado fucsia muy llamativo. Cabeza grande y duradera, aporta dramatismo y fuerza en diseños de alto impacto.',
  },
  {
    slug: 'explorer', name: 'Explorer', category: 'Rosas', tier: 'Grand', apertura: 'Majestic',
    stemLength: '50-80cm', vaseLifeDays: 15, colors: ['#8B0000'],
    description: 'Rojo aterciopelado de tallos gruesos y cabeza grande. Larga duración en florero que garantiza frescura y elegancia sostenida.',
  },
  {
    slug: 'playa-blanca', name: 'Playa Blanca', category: 'Rosas', tier: 'Grand', apertura: 'Royal',
    stemLength: '50-80cm', vaseLifeDays: 15, colors: ['#F5F0E6'],
    description: 'Blanco puro con apertura singular, similar a garden rose. Con abundante follaje, aporta frescura y sobriedad a arreglos exclusivos.',
  },
  {
    slug: 'mandarin-xpression', name: 'Mandarin Xpression', category: 'Rosas', tier: 'Premium', apertura: 'Majestic',
    stemLength: '50-70cm', vaseLifeDays: 13, colors: ['#F4845F'],
    description: 'Cabeza grande coral con centro verde distintivo. Su apertura equilibrada aporta contraste vibrante y singularidad en arreglos de lujo.',
  },
  {
    slug: 'pink-ohara', name: "Pink O'hara", category: 'Rosas', tier: 'Exotic', apertura: 'Majestic',
    stemLength: '50-70cm', vaseLifeDays: 13, colors: ['#F2B6C6'],
    description: 'Garden rose de rosa claro, apertura lenta y aroma a lavanda. Ideal para aportar sutileza perfumada en composiciones delicadas.',
  },
  {
    slug: 'tiara', name: 'Tiara', category: 'Rosas', tier: 'Exotic', apertura: 'Royal',
    stemLength: '50-70cm', vaseLifeDays: 13, colors: ['#B497B3'],
    description: 'Morado cremoso con bordes claros y aroma leve. Su tono antique, poco común, aporta sofisticación y exclusividad visual.',
  },
  {
    slug: 'wasabi', name: 'Wasabi', category: 'Rosas', tier: 'Exotic', apertura: 'Prime',
    stemLength: '50-70cm', vaseLifeDays: 13, colors: ['#D4E157'],
    description: 'Verde lima inusual con pétalos rizados y apertura en forma de corazón. Perfecta para diseños modernos y tropicales de alto nivel.',
  },
  {
    slug: 'white-ohara', name: "White O'hara", category: 'Rosas', tier: 'Exotic', apertura: 'Majestic',
    stemLength: '50-70cm', vaseLifeDays: 13, colors: ['#F7F3E8'],
    description: 'Garden rose blanco marfil con perfume frutal y de lavanda. Crece mucho en apertura, aportando romanticismo y elegancia.',
  },
  {
    slug: 'amandine', name: 'Amandine', category: 'Ranunculus', apertura: 'Prime',
    stemLength: '40-50cm', vaseLifeDays: 9,
    colors: ['#F48FB1', '#FFFFFF', '#E53935', '#4A0404', '#FF8A65', '#FFCDD2', '#FB8C00', '#FFF9C4', '#FDD835', '#795548'],
    description: 'Buena tolerancia al calor y botón grande. Aporta volumen y cobertura en composiciones refinadas sin perder frescura.',
  },
  {
    slug: 'elegance', name: 'Elegance', category: 'Ranunculus', apertura: 'Majestic',
    stemLength: '40-50cm', vaseLifeDays: 9,
    colors: ['#F8C8CC', '#FFFFFF', '#E53935', '#EC407A', '#6A1B4D', '#F48FB1', '#FDD835', '#FB8C00'],
    description: 'Flores grandes de estructura compacta. Aporta uniformidad sólida y presencia en composiciones sofisticadas.',
  },
  {
    slug: 'delphinium-sea-waltz', name: 'Delphinium Sea Waltz', category: 'Fillers', apertura: 'Classic',
    stemLength: '60-80cm', vaseLifeDays: 9, colors: ['#3F51B5'],
    description: 'Flor azul de tallo alto que aporta verticalidad. Perfecta para romper líneas horizontales y dar elegancia a diseños.',
  },
  {
    slug: 'hypericum', name: 'Hypericum', category: 'Fillers', apertura: 'Bouton',
    stemLength: '60-70cm', vaseLifeDays: 18,
    colors: ['#4A0404', '#E53935', '#EC407A', '#FF8A65', '#7CB342', '#FFF3E0'],
    description: 'Bayas ornamentales duraderas; aportan textura y puntos de color en arreglos.',
  },
  {
    slug: 'lisianthus', name: 'Lisianthus', category: 'Fillers', apertura: 'Royal',
    stemLength: '50-70cm', vaseLifeDays: 9,
    colors: ['#4527A0', '#D1C4E9', '#EC407A', '#FF8A65', '#FFFFFF', '#FFF9C4'],
    description: 'Flor suave que aporta volumen y puede ser usada como focal. Su versatilidad eleva tanto arreglos delicados como refinados.',
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
  console.log('\nListo — 13 flores cargadas.');
}

main().catch((err) => {
  console.error('Error cargando el catálogo:', err);
  process.exit(1);
});
