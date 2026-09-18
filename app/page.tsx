import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import CatalogPreview from '@/components/CatalogPreview';
import BenefitsSection from '@/components/BenefitsSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import { getPublicFlowersServer } from '@/lib/flowers-server';

// Datos estructurados para Google + motores de IA (GEO/AEO).
// Organization (no LocalBusiness/Florist): mayorista B2B sin tienda física,
// sirve a Costa Rica y Guatemala — no aplica el schema de negocio local.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Loleanthe Boutique',
  description:
    'Flores exóticas de alta gama. Rosas y flores premium con tallos largos y larga duración, ideales para arreglos únicos e irrepetibles.',
  url: 'https://loleanthe.com',
  image: 'https://loleanthe.com/images/hero-roses.jpg',
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
        <HeroSection />
        <CatalogPreview initialFlowers={flowers} />
        <BenefitsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
