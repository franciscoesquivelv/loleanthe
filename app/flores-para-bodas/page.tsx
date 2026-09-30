import type { Metadata } from 'next';
import FloresParaBodasClient from './FloresParaBodasClient';

const OG_IMAGE = { url: '/images/hero-dark.jpg', width: 1200, height: 630, alt: 'Loleanthe, flor ecuatoriana' };

const DESCRIPTION =
  'Flor ecuatoriana al por mayor para floristas de bodas y eventos en Costa Rica y Guatemala. Importada bajo pedido, de varias fincas. Cotizá tu boda.';

const FAQS = [
  {
    question: '¿Con cuánto tiempo debo pedir la flor para mi boda?',
    answer:
      'Nuestro ciclo de consolidación e importación toma entre 2 y 3 semanas. Para una boda conviene escribir con margen, sobre todo si alguna variedad puntual necesita un envío aparte.',
  },
  {
    question: '¿Puedo pedir colores o variedades que no están en el catálogo?',
    answer:
      'Sí. Si tu boda tiene una paleta específica, contanos qué necesitás en la cotización y lo conseguimos aunque no esté listado.',
  },
  {
    question: '¿Entregan en Costa Rica y en Guatemala?',
    answer: 'Sí, consolidamos e importamos para floristas en ambos países.',
  },
];

export const metadata: Metadata = {
  title: 'Flor al por Mayor para Bodas y Eventos | Costa Rica y Guatemala',
  description: DESCRIPTION,
  alternates: { canonical: '/flores-para-bodas' },
  openGraph: {
    title: 'Flor al por Mayor para Bodas y Eventos | Loleanthe',
    description: DESCRIPTION,
    url: '/flores-para-bodas',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flor al por Mayor para Bodas y Eventos | Loleanthe',
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Mayorista de flor importada para bodas y eventos',
  provider: { '@type': 'Organization', name: 'Loleanthe', url: 'https://loleanthe.com' },
  areaServed: [
    { '@type': 'Country', name: 'Costa Rica' },
    { '@type': 'Country', name: 'Guatemala' },
  ],
  audience: { '@type': 'BusinessAudience', audienceType: 'Floristas de bodas y eventos' },
  description:
    'Consolidación e importación bajo pedido de flor ecuatoriana (rosas, rosas garden, ranunculus y fillers) para floristas que arman bodas y eventos en Costa Rica y Guatemala.',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://loleanthe.com' },
    { '@type': 'ListItem', position: 2, name: 'Bodas y Eventos', item: 'https://loleanthe.com/flores-para-bodas' },
  ],
};

export default function FloresParaBodasPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <FloresParaBodasClient faqs={FAQS} />
    </>
  );
}
