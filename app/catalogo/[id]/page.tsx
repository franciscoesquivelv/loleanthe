import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicFlowersServer, getFlowerByIdServer } from '@/lib/flowers-server';
import FlowerDetailClient from './FlowerDetailClient';

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
    `${flower.name} — flor premium de Loleanthe Boutique, disponible para cotización.`;
  return {
    title: flower.name,
    description,
    alternates: { canonical: `/catalogo/${flower.id}` },
    openGraph: {
      title: `${flower.name} | Loleanthe Boutique`,
      description,
      url: `/catalogo/${flower.id}`,
      type: 'website',
      images: flower.images.length > 0 ? [{ url: flower.images[0], alt: flower.name }] : undefined,
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

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: flower.name,
    description: flower.description || undefined,
    image: flower.images.length > 0 ? flower.images : undefined,
    category: flower.category || undefined,
    brand: { '@type': 'Brand', name: 'Loleanthe Boutique' },
    // Modelo por cotización: se expone disponibilidad y URL, sin precio público.
    offers: {
      '@type': 'Offer',
      availability: flower.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://loleanthe.com/catalogo/${flower.id}`,
      priceCurrency: 'USD',
      seller: { '@type': 'Organization', name: 'Loleanthe Boutique' },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <FlowerDetailClient flower={flower} />
    </>
  );
}
