'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (imgRef.current) {
        imgRef.current.style.transform = `translateY(${window.scrollY * 0.2}px)`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image with parallax */}
      <div ref={imgRef} className="absolute inset-0 scale-110">
        <Image
          src="/images/hero-roses.png"
          alt="Loleanthe Boutique"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Mobile: stronger top-to-bottom + left gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A130A]/70 via-[#1A130A]/60 to-[#1A130A]/50 md:hidden" />
        <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-[#1A130A]/90 via-[#1A130A]/60 to-[#1A130A]/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 md:px-16 lg:px-24 max-w-3xl w-full md:w-auto">
        <p
          className="font-display text-xs tracking-[0.5em] uppercase text-[#D4B896] mb-4 md:mb-6 opacity-0"
          style={{ animation: 'fadeInUp 1s ease 0.3s forwards' }}
        >
          Luxury Florals
        </p>

        <h1
          className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light text-[#FAF7F2] leading-[1.08] mb-5 md:mb-8 opacity-0"
          style={{
            animation: 'fadeInUp 1s ease 0.5s forwards',
            textShadow: '0 2px 40px rgba(0,0,0,0.5), 0 1px 8px rgba(0,0,0,0.4)',
          }}
        >
          Flores premium<br />
          para arreglos <em className="italic text-[#D4B896]">irrepetibles</em>
        </h1>

        <p
          className="text-[#FAF7F2]/80 text-sm md:text-lg max-w-md leading-relaxed mb-8 md:mb-10 opacity-0"
          style={{ animation: 'fadeInUp 1s ease 0.8s forwards' }}
        >
          Selección exclusiva de flores exóticas de alta gama, importadas directamente con los más altos estándares de calidad y frescura.
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 opacity-0"
          style={{ animation: 'fadeInUp 1s ease 1s forwards' }}
        >
          <Link
            href="#catalogo"
            className="border border-[#D4B896] text-[#D4B896] px-8 py-4 font-display tracking-widest text-sm uppercase hover:bg-[#D4B896] hover:text-[#1A130A] transition-all duration-500 text-center"
          >
            Ver Catálogo
          </Link>
        </div>
      </div>

      {/* Scroll indicator — hidden on small phones */}
      <div className="hidden sm:flex absolute bottom-10 left-1/2 -translate-x-1/2 flex-col items-center gap-2 opacity-0" style={{ animation: 'fadeInUp 1s ease 1.5s forwards' }}>
        <span className="font-display text-xs tracking-[0.3em] uppercase text-[#D4B896]/60">Descubrir</span>
        <div className="w-px h-12 bg-gradient-to-b from-[#D4B896]/60 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
