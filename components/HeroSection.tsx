import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative flex items-center justify-center min-h-[92vh] overflow-hidden bg-[#1C2A22] text-[#F7F8F4]">
      {/* Organic morphing "bubbles" behind the title */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="blob"
          style={{
            width: 'clamp(340px, 46vw, 680px)',
            height: 'clamp(340px, 46vw, 680px)',
            background: '#8A3B57',
            opacity: 0.3,
            filter: 'blur(64px)',
            animation: 'blobMorph 17s ease-in-out infinite, blobDrift 24s ease-in-out infinite',
          }}
        />
        <div
          className="blob"
          style={{
            width: 'clamp(240px, 34vw, 500px)',
            height: 'clamp(240px, 34vw, 500px)',
            background: '#48664F',
            opacity: 0.34,
            filter: 'blur(72px)',
            animation: 'blobMorph 23s ease-in-out infinite reverse, blobDrift2 31s ease-in-out infinite',
          }}
        />
      </div>

      {/* Centered content */}
      <div className="relative z-10 max-w-4xl mx-auto px-5 text-center">
        <h1 className="font-display text-[#F7F8F4] leading-[0.98] text-[clamp(50px,9.5vw,144px)] mb-7 opacity-0 animate-fadeInUp">
          Flores que no se repiten
        </h1>
        <p
          className="text-[#c3ccc0] text-base md:text-lg max-w-lg mx-auto mb-10 opacity-0 animate-fadeInUp"
          style={{ animationDelay: '.16s' }}
        >
          Selección exótica de alta gama, importada directamente. Tallo largo, larga duración, y arreglos diseñados a medida.
        </p>
        <Link
          href="/catalogo"
          className="group inline-flex items-center gap-3 bg-[#8A3B57] text-[#F7F8F4] px-9 py-4 font-body font-bold text-sm tracking-wide uppercase hover:bg-[#C56E88] hover:text-[#1C2A22] transition-all duration-500 opacity-0 animate-fadeInUp"
          style={{ animationDelay: '.3s' }}
        >
          Ver catálogo
          <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
        </Link>
      </div>
    </section>
  );
}
