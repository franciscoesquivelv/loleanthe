import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import CatalogPreview from '@/components/CatalogPreview';
import BenefitsSection from '@/components/BenefitsSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <CatalogPreview />
        <BenefitsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
