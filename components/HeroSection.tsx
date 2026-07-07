import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative min-h-[94vh] flex items-end overflow-hidden bg-[#1C2A22] text-[#F7F8F4]">
      {/* Real photograph */}
      <Image
        src="/images/hero-roses.png"
        alt="Rosas premium de tallo largo — Loleanthe Boutique"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[60%_40%] [animation:kenburns_22s_ease-out_forwards]"
      />
      {/* Botanical-green colour grade — subtle, keeps the rose visible */}
      <div className="absolute inset-0 bg-[#26382C] mix-blend-multiply opacity-[.16]" />
      {/* Legibility tint — darken the bottom-left (type + nav), reveal the rose top-right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top right, rgba(13,21,16,.94) 0%, rgba(16,26,20,.58) 30%, rgba(18,28,22,.12) 58%, rgba(18,28,22,0) 100%), linear-gradient(to bottom, rgba(15,24,18,.5) 0%, rgba(15,24,18,0) 15%)',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-6 pb-[9vh]">
        <div className="max-w-3xl">
          <h1
            className="font-display font-extrabold leading-[0.9] text-[clamp(50px,9vw,132px)] mb-6 opacity-0 animate-fadeInUp"
            style={{ textShadow: '0 2px 44px rgba(0,0,0,.35)' }}
          >
            Flores que no<br />se repiten
          </h1>
          <p
            className="max-w-md text-[#dde4da] text-base md:text-lg mb-8 opacity-0 animate-fadeInUp"
            style={{ animationDelay: '.18s', textShadow: '0 1px 22px rgba(0,0,0,.45)' }}
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
    </section>
  );
}
