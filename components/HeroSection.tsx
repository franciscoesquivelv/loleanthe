'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.3}px)`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5EFE6] via-[#FAF7F2] to-[#FAF7F2]" />

      {/* Decorative circles */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-[#EDD5C5]/30 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#D4B896]/20 blur-3xl pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto">
        {/* Script intro */}
        <p
          className="font-script text-[#B08D6B] text-4xl md:text-5xl mb-4 opacity-0"
          style={{ animation: 'fadeInUp 1s ease 0.2s forwards' }}
        >
          Bienvenidos a
        </p>

        {/* Logo */}
        <div
          className="mb-8 opacity-0"
          style={{ animation: 'fadeInUp 1s ease 0.5s forwards' }}
        >
          <Image
            src="/logo.png"
            alt="Loleanthe Boutique"
            width={520}
            height={180}
            className="w-auto h-28 md:h-40 object-contain"
            priority
          />
        </div>

        {/* Ornamental divider */}
        <div
          className="ornament w-64 mb-8 opacity-0"
          style={{ animation: 'fadeInUp 1s ease 0.8s forwards' }}
        >
          <span className="text-[#B08D6B] text-xs tracking-[0.4em] uppercase font-display">Luxury Florals</span>
        </div>

        {/* Tagline */}
        <h1
          className="font-display text-4xl md:text-6xl lg:text-7xl font-light text-[#1A130A] leading-tight mb-6 opacity-0"
          style={{ animation: 'fadeInUp 1s ease 1s forwards' }}
        >
          Flores que trascienden
          <br />
          <em className="font-light italic text-[#B08D6B]">lo ordinario</em>
        </h1>

        <p
          className="text-[#7A6654] text-base md:text-lg max-w-xl leading-relaxed mb-10 opacity-0"
          style={{ animation: 'fadeInUp 1s ease 1.2s forwards' }}
        >
          Selección exclusiva de flores exóticas de alta gama — rosas de tallo largo, variedades únicas y arreglos premium que no encontrarás en ningún otro lugar.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center gap-4 opacity-0"
          style={{ animation: 'fadeInUp 1s ease 1.4s forwards' }}
        >
          <Link
            href="#catalogo"
            className="bg-[#1A130A] text-[#FAF7F2] px-8 py-4 font-display tracking-widest text-sm uppercase hover:bg-[#B08D6B] transition-all duration-500 min-w-[180px] text-center"
          >
            Ver Catálogo
          </Link>
          <Link
            href="#contacto"
            className="border border-[#B08D6B] text-[#B08D6B] px-8 py-4 font-display tracking-widest text-sm uppercase hover:bg-[#B08D6B] hover:text-[#FAF7F2] transition-all duration-500 min-w-[180px] text-center"
          >
            Solicitar Cotización
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0" style={{ animation: 'fadeInUp 1s ease 2s forwards' }}>
        <span className="font-display text-xs tracking-[0.3em] uppercase text-[#B08D6B]">Descubrir</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-[#B08D6B] to-transparent animate-pulse" />
      </div>

      {/* Bottom wave shape */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 20C480 40 240 80 0 40L0 80Z" fill="#FAF7F2" />
        </svg>
      </div>
    </section>
  );
}
