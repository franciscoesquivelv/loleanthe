import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import CatalogPreview from '@/components/CatalogPreview';
import BenefitsSection from '@/components/BenefitsSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import { getPublicFlowersServer } from '@/lib/flowers-server';

export default async function Home() {
  const flowers = await getPublicFlowersServer();
  return (
    <>
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
