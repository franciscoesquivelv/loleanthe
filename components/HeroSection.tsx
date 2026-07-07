import Link from 'next/link';
import Pollen from './Pollen';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#F4F4EF] text-[#1C2A22]">
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
            style={{ background: 'linear-gradient(to bottom, transparent 58%, #F4F4EF 100%)' }}
          />
          <div
            className="absolute inset-0 hidden md:block"
            style={{ background: 'linear-gradient(to right, #F4F4EF 0%, transparent 22%)' }}
          />
        </div>

        {/* Text side — bottom on mobile, left on desktop */}
        <div className="relative z-10 order-2 md:order-1 flex items-center px-6 sm:px-10 md:px-14 lg:px-20 py-14 sm:py-16 md:py-0">
          <div className="max-w-xl">
            <h1 className="font-display text-[#1C2A22] leading-[0.98] text-[clamp(42px,8vw,104px)] mb-5 md:mb-7 opacity-0 animate-fadeInUp">
              Flores fuera de serie
            </h1>
            <p
              className="text-[#3B4A41] text-[15px] sm:text-base md:text-lg max-w-md mb-8 md:mb-10 opacity-0 animate-fadeInUp"
              style={{ animationDelay: '.16s' }}
            >
              Variedades exóticas importadas directamente: tallos largos, larga duración y tamaños que no vas a encontrar en otro lugar. Cada arreglo, hecho a tu medida.
            </p>
            <Link
              href="/catalogo"
              className="group inline-flex items-center gap-3 bg-[#8A3B57] text-[#F7F8F4] px-8 py-4 font-body font-bold text-sm tracking-wide uppercase hover:bg-[#C56E88] hover:text-[#1C2A22] transition-all duration-500 opacity-0 animate-fadeInUp"
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
