import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative flex items-center justify-center min-h-[92vh] overflow-hidden bg-[#E7E8E0] text-[#1C2A22]">
      {/* Background photograph */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/flor-filler-web.jpg')" }}
        aria-hidden="true"
      />
      {/* Soft stone wash — unifies the photo with the palette and keeps text legible */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(rgba(231,232,224,0.52) 0%, rgba(228,230,221,0.68) 100%)' }}
        aria-hidden="true"
      />

      {/* Moving organic "bubbles" */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="blob"
          style={{
            width: 'clamp(320px, 44vw, 640px)',
            height: 'clamp(320px, 44vw, 640px)',
            background: '#8A3B57',
            opacity: 0.26,
            filter: 'blur(60px)',
            animation: 'blobMorph 14s ease-in-out infinite, blobDrift 18s ease-in-out infinite',
          }}
        />
        <div
          className="blob"
          style={{
            width: 'clamp(240px, 34vw, 500px)',
            height: 'clamp(240px, 34vw, 500px)',
            background: '#47654F',
            opacity: 0.24,
            filter: 'blur(70px)',
            animation: 'blobMorph 19s ease-in-out infinite reverse, blobDrift2 23s ease-in-out infinite',
          }}
        />
      </div>

      {/* Centered content */}
      <div className="relative z-10 max-w-4xl mx-auto px-5 text-center">
        <h1 className="font-display text-[#1C2A22] leading-[0.98] text-[clamp(50px,9.5vw,144px)] mb-7 opacity-0 animate-fadeInUp">
          Flores que no se repiten
        </h1>
        <p
          className="text-[#3B4A41] text-base md:text-lg max-w-lg mx-auto mb-10 opacity-0 animate-fadeInUp"
          style={{ animationDelay: '.16s' }}
        >
          Selección exótica de alta gama, importada directamente. Tallo largo, larga duración, y arreglos diseñados a medida.
        </p>
        <Link
          href="/catalogo"
          className="group inline-flex items-center gap-3 bg-[#8A3B57] text-[#F7F8F4] px-9 py-4 font-body font-bold text-sm tracking-wide uppercase hover:bg-[#1C2A22] transition-all duration-500 opacity-0 animate-fadeInUp"
          style={{ animationDelay: '.3s' }}
        >
          Ver catálogo
          <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
        </Link>
      </div>
    </section>
  );
}
