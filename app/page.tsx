import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Collection from '@/components/Collection';
import Atmosphere from '@/components/Atmosphere';
import Origen from '@/components/Origen';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import { getPublicFlowersServer } from '@/lib/flowers-server';

// Datos estructurados para Google + motores de IA (GEO/AEO).
// Organization (no LocalBusiness/Florist): mayorista B2B sin tienda física,
// sirve a Costa Rica y Guatemala — no aplica el schema de negocio local.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Loleanthe',
  description:
    'Consolidamos flor ecuatoriana de varias fincas y la importamos bajo pedido para floristas, decoradores y hoteles en Costa Rica y Guatemala.',
  url: 'https://loleanthe.com',
  image: 'https://loleanthe.com/images/hero-dark.jpg',
  areaServed: [
    { '@type': 'Country', name: 'Costa Rica' },
    { '@type': 'Country', name: 'Guatemala' },
  ],
};

export default async function Home() {
  const flowers = await getPublicFlowersServer();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Header />
      <main>
        <Hero />
        <Collection initialFlowers={flowers} />
        <Atmosphere />
        <Origen />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
