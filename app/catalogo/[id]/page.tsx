import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicFlowersServer, getFlowerByIdServer } from '@/lib/flowers-server';
import { getCrossSell } from '@/lib/cross-sell';
import { getCategoryByLabel } from '@/lib/categories';
import { COUNTRIES } from '@/lib/types';
import FlowerDetailClient from './FlowerDetailClient';

// Cuando la flor no tiene foto propia, la ficha igual necesita una imagen de
// vista previa: sin esto, un enlace de WhatsApp o Twitter se ve roto.
const IMAGEN_POR_DEFECTO = '/images/hero-dark.jpg';

// Pre-genera una página estática por cada flor del catálogo (ISR). Con 0 flores
// no genera ninguna; en cuanto se cargue inventario, cada flor tiene su página.
export async function generateStaticParams() {
  const flowers = await getPublicFlowersServer();
  return flowers.map((f) => ({ id: f.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const flower = await getFlowerByIdServer(id);
  if (!flower || flower.archived) {
    return { title: 'Flor no encontrada' };
  }
  const description =
    flower.description ||
    `${flower.name}: flor premium de Loleanthe, disponible para cotización.`;
  // Redefinir `openGraph` o `twitter` en una ruta hija REEMPLAZA por completo
  // el objeto del layout, no lo combina campo por campo (verificado contra
  // node_modules/next/dist/docs/.../generate-metadata.md). Por eso cada campo
  // se repite acá explícito, con una imagen siempre presente.
  const ogImage = flower.images[0] || IMAGEN_POR_DEFECTO;
  return {
    title: flower.name,
    description,
    alternates: { canonical: `/catalogo/${flower.id}` },
    openGraph: {
      title: `${flower.name} | Loleanthe`,
      description,
      url: `/catalogo/${flower.id}`,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: flower.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${flower.name} | Loleanthe`,
      description,
      images: [ogImage],
    },
  };
}

export default async function FlowerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flower = await getFlowerByIdServer(id);
  if (!flower || flower.archived) notFound();

  const allFlowers = await getPublicFlowersServer();
  const related = getCrossSell(flower, allFlowers);
  const category = getCategoryByLabel(flower.category);

  // Mismos datos que ya se muestran en la ficha (ver `specs` en
  // FlowerDetailClient.tsx), pasados al schema para que un buscador los pueda
  // leer sin tener que interpretar el HTML.
  const additionalProperty = [
    flower.tier && { '@type': 'PropertyValue', name: 'Grado', value: flower.tier },
    flower.apertura && { '@type': 'PropertyValue', name: 'Apertura', value: flower.apertura },
    flower.stemLength && { '@type': 'PropertyValue', name: 'Largo de tallo', value: flower.stemLength },
    flower.headSize && { '@type': 'PropertyValue', name: 'Tamaño de cabeza', value: flower.headSize },
    flower.vaseLifeDays != null && {
      '@type': 'PropertyValue',
      name: 'Vida en florero',
      value: `${flower.vaseLifeDays} días`,
    },
  ].filter(Boolean);

  // Sin marcar (availableIn vacío o ausente) = disponible en los dos
  // mercados, mismo criterio que `isAvailableIn` en lib/types.ts.
  const paisesDisponibles =
    flower.availableIn && flower.availableIn.length > 0
      ? COUNTRIES.filter((c) => flower.availableIn!.includes(c.code))
      : COUNTRIES;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: flower.name,
    description: flower.description || undefined,
    image: flower.images.length > 0 ? flower.images : undefined,
    category: flower.category || undefined,
    brand: { '@type': 'Brand', name: 'Loleanthe' },
    ...(additionalProperty.length > 0 && { additionalProperty }),
    // Modelo por cotización: se expone disponibilidad y URL, sin precio público.
    offers: {
      '@type': 'Offer',
      availability: flower.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://loleanthe.com/catalogo/${flower.id}`,
      priceCurrency: 'USD',
      seller: { '@type': 'Organization', name: 'Loleanthe' },
      areaServed: paisesDisponibles.map((c) => ({ '@type': 'Country', name: c.label })),
    },
  };

  // Refleja la miga de pan real de FlowerDetailClient.tsx: Catálogo → (su
  // categoría, si la tiene) → el nombre de la flor.
  const breadcrumbItems = [
    { name: 'Catálogo', url: 'https://loleanthe.com/catalogo' },
    ...(category ? [{ name: category.label, url: `https://loleanthe.com/catalogo/${category.slug}` }] : []),
    { name: flower.name, url: `https://loleanthe.com/catalogo/${flower.id}` },
  ].map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: item.url,
  }));
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <FlowerDetailClient flower={flower} related={related} />
    </>
  );
}
