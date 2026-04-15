'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuote } from '@/context/QuoteContext';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useQuote();
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isDark = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navTextClass = isDark
    ? 'text-white/80 hover:text-white'
    : 'text-[#2C1E10]/70 hover:text-[#B08D6B]';

  const cotizarClass = isDark
    ? 'border-white/60 text-white/80 hover:border-white hover:text-white'
    : 'border-[#B08D6B] text-[#B08D6B] hover:bg-[#B08D6B] hover:text-[#FAF7F2]';

  const hamburgerColor = isDark ? 'bg-white' : 'bg-[#2C1E10]';

  const anchor = (hash: string) => (isHome ? hash : `/${hash}`);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isDark ? 'bg-transparent py-5 md:py-6' : 'bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#D4B896]/30 py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-6 flex items-center justify-between">
        {/* Left nav — desktop only */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/catalogo" className={`font-display text-sm tracking-widest uppercase transition-colors hover-underline ${navTextClass}`}>
            Catálogo
          </Link>
          <Link href={anchor('#nosotros')} className={`font-display text-sm tracking-widest uppercase transition-colors hover-underline ${navTextClass}`}>
            Nosotros
          </Link>
        </nav>

        {/* Logo centered */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <Image
            src="/logo.png"
            alt="Loleanthe Boutique"
            width={200}
            height={70}
            className={`transition-all duration-500 object-contain ${isDark ? 'h-14 md:h-16 invert brightness-200' : 'h-10 md:h-12'}`}
            style={{ width: 'auto' }}
            priority
          />
        </Link>

        {/* Right nav — desktop only */}
        <div className="hidden md:flex items-center gap-8">
          <Link href={anchor('#contacto')} className={`font-display text-sm tracking-widest uppercase transition-colors hover-underline ${navTextClass}`}>
            Contacto
          </Link>
          <Link
            href="/cotizacion"
            className={`relative flex items-center gap-2 border px-4 py-2 font-display text-sm tracking-widest uppercase transition-all duration-300 ${cotizarClass}`}
          >
            Cotizar
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#B08D6B] text-[#FAF7F2] text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-sans font-semibold">
                {count}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile: cotizar badge + hamburger */}
        <div className="md:hidden flex items-center gap-3 ml-auto">
          {count > 0 && (
            <Link
              href="/cotizacion"
              className={`relative flex items-center font-display text-xs tracking-widest uppercase py-1.5 px-3 border transition-colors ${
                isDark ? 'border-white/50 text-white/80' : 'border-[#B08D6B] text-[#B08D6B]'
              }`}
            >
              Cotizar
              <span className="absolute -top-2 -right-2 bg-[#B08D6B] text-[#FAF7F2] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-sans font-semibold">
                {count}
              </span>
            </Link>
          )}
          <button
            className="flex flex-col gap-[5px] p-2 -mr-1 touch-manipulation"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            <span className={`block w-6 h-[1.5px] transition-all duration-300 ${hamburgerColor} ${menuOpen ? 'rotate-45 translate-y-[6.5px]' : ''}`} />
            <span className={`block w-6 h-[1.5px] transition-all duration-300 ${hamburgerColor} ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`block w-6 h-[1.5px] transition-all duration-300 ${hamburgerColor} ${menuOpen ? '-rotate-45 -translate-y-[6.5px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu — full screen overlay */}
      <div
        className={`md:hidden fixed inset-0 top-0 bg-[#FAF7F2] z-40 flex flex-col transition-all duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Close button area at top */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#EDE0CE]">
          <Link href="/" onClick={() => setMenuOpen(false)}>
            <Image
              src="/logo.png"
              alt="Loleanthe Boutique"
              width={160}
              height={56}
              className="h-10 w-auto object-contain"
              style={{ width: 'auto' }}
            />
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            className="flex flex-col gap-[5px] p-2 -mr-1"
            aria-label="Cerrar menú"
          >
            <span className="block w-6 h-[1.5px] bg-[#2C1E10] rotate-45 translate-y-[6.5px] transition-all duration-300" />
            <span className="block w-6 h-[1.5px] bg-[#2C1E10] opacity-0 transition-all duration-300" />
            <span className="block w-6 h-[1.5px] bg-[#2C1E10] -rotate-45 -translate-y-[6.5px] transition-all duration-300" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col flex-1 justify-center items-center gap-8 px-6">
          <Link
            href="/catalogo"
            className="font-display text-2xl tracking-widest uppercase text-[#2C1E10] hover:text-[#B08D6B] transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Catálogo
          </Link>
          <Link
            href={anchor('#nosotros')}
            className="font-display text-2xl tracking-widest uppercase text-[#2C1E10] hover:text-[#B08D6B] transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Nosotros
          </Link>
          <Link
            href={anchor('#contacto')}
            className="font-display text-2xl tracking-widest uppercase text-[#2C1E10] hover:text-[#B08D6B] transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Contacto
          </Link>

          <div className="w-16 h-px bg-[#D4B896] my-2" />

          <Link
            href="/cotizacion"
            className="bg-[#1A130A] text-[#FAF7F2] px-10 py-4 font-display tracking-widest text-sm uppercase hover:bg-[#B08D6B] transition-all duration-300 w-full text-center max-w-xs"
            onClick={() => setMenuOpen(false)}
          >
            Cotizar{count > 0 ? ` (${count})` : ''}
          </Link>
        </nav>

        {/* Bottom branding */}
        <div className="text-center pb-10">
          <p className="text-[#7A6654]/40 text-xs font-display tracking-widest uppercase">Luxury Florals</p>
        </div>
      </div>
    </header>
  );
}
