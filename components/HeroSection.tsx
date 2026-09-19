import Link from 'next/link';
import Pollen from './Pollen';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#F7F1E8] text-[#2B1620]">
      <div className="grid md:grid-cols-2 md:h-[90vh]">
        {/* Photo side — top on mobile, right on desktop */}
        <div className="relative order-1 md:order-2 h-[38vh] sm:h-[46vh] md:h-[90vh]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/flor-filler-web.jpg')" }}
          />
          {/* Blend the photo into the white ground (bottom on mobile, left on desktop) */}
          <div
            className="absolute inset-0 md:hidden"
            style={{ background: 'linear-gradient(to bottom, transparent 58%, #F7F1E8 100%)' }}
          />
          <div
            className="absolute inset-0 hidden md:block"
            style={{ background: 'linear-gradient(to right, #F7F1E8 0%, transparent 22%)' }}
          />
        </div>

        {/* Text side — bottom on mobile, left on desktop */}
        <div className="relative z-10 order-2 md:order-1 flex items-center px-6 sm:px-10 md:px-14 lg:px-20 py-14 sm:py-16 md:py-0">
          <div className="max-w-xl">
            <h1 className="font-display text-[#2B1620] leading-[0.98] text-[clamp(42px,8vw,104px)] mb-5 md:mb-7 opacity-0 animate-fadeInUp">
              Flores fuera de serie
            </h1>
            <p
              className="text-[#4A2C35] text-[15px] sm:text-base md:text-lg max-w-md mb-8 md:mb-10 opacity-0 animate-fadeInUp"
              style={{ animationDelay: '.16s' }}
            >
              Variedades exóticas importadas directamente: tallos largos, larga duración y tamaños que no vas a encontrar en otro lugar. Cada arreglo, hecho a tu medida.
            </p>
            <Link
              href="/catalogo"
              className="group inline-flex items-center gap-3 bg-[#9C7A3C] text-[#FBF7F0] px-8 py-4 font-body font-bold text-sm tracking-wide uppercase hover:bg-[#9C7A3C] hover:text-[#2B1620] transition-all duration-500 opacity-0 animate-fadeInUp"
              style={{ animationDelay: '.3s' }}
            >
              Ver catálogo
              <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Living golden pollen field over the whole hero, behind the text */}
      <Pollen />
    </section>
  );
}
