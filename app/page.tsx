import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import CatalogPreview from '@/components/CatalogPreview';
import BenefitsSection from '@/components/BenefitsSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import { getPublicFlowersServer } from '@/lib/flowers-server';

// Datos estructurados para Google + motores de IA (GEO/AEO).
// NOTA: completar telephone, address y openingHours con los datos reales del
// negocio para habilitar rich results de negocio local y Google Business Profile.
const floristJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Florist',
  name: 'Loleanthe Boutique',
  description:
    'Flores exóticas de alta gama. Rosas y flores premium con tallos largos y larga duración, ideales para arreglos únicos e irrepetibles.',
  url: 'https://loleanthe.com',
  image: 'https://loleanthe.com/images/hero-roses.png',
  priceRange: '$$$',
  areaServed: { '@type': 'Country', name: 'El Salvador' },
};

export default async function Home() {
  const flowers = await getPublicFlowersServer();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(floristJsonLd) }}
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
