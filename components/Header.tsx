'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuote } from '@/context/QuoteContext';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useQuote();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#D4B896]/30 py-3'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Left nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#catalogo" className="font-display text-sm tracking-widest uppercase text-[#2C1E10]/70 hover:text-[#B08D6B] transition-colors hover-underline">
            Catálogo
          </Link>
          <Link href="#nosotros" className="font-display text-sm tracking-widest uppercase text-[#2C1E10]/70 hover:text-[#B08D6B] transition-colors hover-underline">
            Nosotros
          </Link>
        </nav>

        {/* Logo center */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <Image
            src="/logo.png"
            alt="Loleanthe Boutique"
            width={200}
            height={70}
            className={`transition-all duration-500 object-contain ${scrolled ? 'h-12' : 'h-16'}`}
            style={{ width: 'auto' }}
            priority
          />
        </Link>

        {/* Right nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#contacto" className="font-display text-sm tracking-widest uppercase text-[#2C1E10]/70 hover:text-[#B08D6B] transition-colors hover-underline">
            Contacto
          </Link>
          <Link
            href="/cotizacion"
            className="relative flex items-center gap-2 border border-[#B08D6B] text-[#B08D6B] px-4 py-2 font-display text-sm tracking-widest uppercase hover:bg-[#B08D6B] hover:text-[#FAF7F2] transition-all duration-300"
          >
            Cotizar
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#B08D6B] text-[#FAF7F2] text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-sans font-semibold">
                {count}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 ml-auto"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={`block w-6 h-[1px] bg-[#2C1E10] transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-[1px] bg-[#2C1E10] transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-[1px] bg-[#2C1E10] transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden absolute top-full left-0 right-0 bg-[#FAF7F2]/98 backdrop-blur-md border-t border-[#D4B896]/30 transition-all duration-300 ${menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <nav className="flex flex-col items-center gap-6 py-8">
          <Link href="#catalogo" className="font-display text-base tracking-widest uppercase text-[#2C1E10]/70" onClick={() => setMenuOpen(false)}>Catálogo</Link>
          <Link href="#nosotros" className="font-display text-base tracking-widest uppercase text-[#2C1E10]/70" onClick={() => setMenuOpen(false)}>Nosotros</Link>
          <Link href="#contacto" className="font-display text-base tracking-widest uppercase text-[#2C1E10]/70" onClick={() => setMenuOpen(false)}>Contacto</Link>
          <Link href="/cotizacion" className="border border-[#B08D6B] text-[#B08D6B] px-6 py-2 font-display text-sm tracking-widest uppercase" onClick={() => setMenuOpen(false)}>
            Cotizar {count > 0 && `(${count})`}
          </Link>
        </nav>
      </div>
    </header>
  );
}
