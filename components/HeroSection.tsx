import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative bg-[#1C2A22] text-[#F7F8F4] overflow-hidden">
      {/* Top scrim so the white nav stays legible over the bright photo */}
      <div
        className="absolute top-0 inset-x-0 h-40 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(16,25,19,.72) 0%, rgba(16,25,19,.28) 55%, rgba(16,25,19,0) 100%)' }}
      />

      <div className="grid md:grid-cols-[1.05fr_0.95fr] md:h-[88vh]">
        {/* Photograph — top on mobile, right on desktop */}
        <div className="relative order-1 md:order-2 h-[44vh] md:h-full">
          <Image
            src="/images/hero-roses.png"
            alt="Rosa premium de tallo largo — Loleanthe Boutique"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 48vw"
            className="object-cover object-center [animation:kenburns_24s_ease-out_forwards]"
          />
        </div>

        {/* Content on the pine panel */}
        <div className="relative order-2 md:order-1 flex items-center px-5 sm:px-8 md:px-12 lg:px-20 py-16 md:py-0">
          <div className="max-w-xl">
            <h1 className="font-display font-extrabold leading-[0.92] text-[clamp(44px,5.6vw,92px)] mb-6 opacity-0 animate-fadeInUp">
              Flores que no se repiten
            </h1>
            <p
              className="max-w-md text-[#c3ccc0] text-base md:text-lg mb-8 opacity-0 animate-fadeInUp"
              style={{ animationDelay: '.18s' }}
            >
              Selección exótica de alta gama, importada directamente. Tallo largo, larga duración, y arreglos diseñados a medida.
            </p>
            <Link
              href="/catalogo"
              className="group inline-flex items-center gap-3 bg-[#8A3B57] text-[#F7F8F4] px-8 py-4 font-body font-bold text-sm tracking-wide uppercase hover:bg-[#C56E88] hover:text-[#1C2A22] transition-all duration-500 opacity-0 animate-fadeInUp"
              style={{ animationDelay: '.34s' }}
            >
              Ver catálogo
              <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
