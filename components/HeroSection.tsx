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
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A130A]/90 via-[#1A130A]/60 to-[#1A130A]/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-8 md:px-16 lg:px-24 max-w-3xl">
        <p
          className="font-display text-xs tracking-[0.5em] uppercase text-[#D4B896] mb-6 opacity-0"
          style={{ animation: 'fadeInUp 1s ease 0.3s forwards' }}
        >
          Luxury Florals
        </p>

        <h1
          className="font-display text-5xl md:text-7xl lg:text-8xl font-light text-[#FAF7F2] leading-[1.05] mb-8 opacity-0"
          style={{
            animation: 'fadeInUp 1s ease 0.5s forwards',
            textShadow: '0 2px 40px rgba(0,0,0,0.5), 0 1px 8px rgba(0,0,0,0.4)',
          }}
        >
          Flores que<br />
          trascienden<br />
          <em className="italic text-[#D4B896]">lo ordinario</em>
        </h1>

        <p
          className="text-[#FAF7F2]/70 text-base md:text-lg max-w-md leading-relaxed mb-10 opacity-0"
          style={{ animation: 'fadeInUp 1s ease 0.8s forwards' }}
        >
          Seleccion exclusiva de flores exoticas de alta gama, importadas directamente con los mas altos estandares de calidad y frescura.
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 opacity-0"
          style={{ animation: 'fadeInUp 1s ease 1s forwards' }}
        >
          <Link
            href="#catalogo"
            className="border border-[#D4B896] text-[#D4B896] px-8 py-4 font-display tracking-widest text-sm uppercase hover:bg-[#D4B896] hover:text-[#1A130A] transition-all duration-500 text-center w-fit"
          >
            Ver Catalogo
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0" style={{ animation: 'fadeInUp 1s ease 1.5s forwards' }}>
        <span className="font-display text-xs tracking-[0.3em] uppercase text-[#D4B896]/60">Descubrir</span>
        <div className="w-px h-12 bg-gradient-to-b from-[#D4B896]/60 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
