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

  // Only the homepage has a dark hero — all other pages have light backgrounds
  const isHome = pathname === '/';

  // On home: transparent until scroll. On other pages: always act as "scrolled"
  const isDark = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navTextClass = isDark
    ? 'text-white/80 hover:text-white'
    : 'text-[#2C1E10]/70 hover:text-[#B08D6B]';

  const cotizarClass = isDark
    ? 'border-white/60 text-white/80 hover:border-white hover:text-white'
    : 'border-[#B08D6B] text-[#B08D6B] hover:bg-[#B08D6B] hover:text-[#FAF7F2]';

  const hamburgerColor = isDark ? 'bg-white' : 'bg-[#2C1E10]';

  // Anchor links: on homepage use #section, on other pages use /#section
  const anchor = (hash: string) => (isHome ? hash : `/${hash}`);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isDark ? 'bg-transparent py-6' : 'bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#D4B896]/30 py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Left nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/catalogo" className={`font-display text-sm tracking-widest uppercase transition-colors hover-underline ${navTextClass}`}>
            Catalogo
          </Link>
          <Link href={anchor('#nosotros')} className={`font-display text-sm tracking-widest uppercase transition-colors hover-underline ${navTextClass}`}>
            Nosotros
          </Link>
        </nav>

        {/* Logo — white (inverted) over dark hero, dark on light pages */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <Image
            src="/logo.png"
            alt="Loleanthe Boutique"
            width={200}
            height={70}
            className={`transition-all duration-500 object-contain ${isDark ? 'h-16 invert brightness-200' : 'h-12'}`}
            style={{ width: 'auto' }}
            priority
          />
        </Link>

        {/* Right nav */}
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

        {/* Mobile menu button */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 ml-auto"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={`block w-6 h-[1px] transition-all duration-300 ${hamburgerColor} ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-[1px] transition-all duration-300 ${hamburgerColor} ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-[1px] transition-all duration-300 ${hamburgerColor} ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden absolute top-full left-0 right-0 bg-[#FAF7F2]/98 backdrop-blur-md border-t border-[#D4B896]/30 transition-all duration-300 ${menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <nav className="flex flex-col items-center gap-6 py-8">
          <Link href="/catalogo" className="font-display text-base tracking-widest uppercase text-[#2C1E10]/70" onClick={() => setMenuOpen(false)}>Catalogo</Link>
          <Link href={anchor('#nosotros')} className="font-display text-base tracking-widest uppercase text-[#2C1E10]/70" onClick={() => setMenuOpen(false)}>Nosotros</Link>
          <Link href={anchor('#contacto')} className="font-display text-base tracking-widest uppercase text-[#2C1E10]/70" onClick={() => setMenuOpen(false)}>Contacto</Link>
          <Link href="/cotizacion" className="border border-[#B08D6B] text-[#B08D6B] px-6 py-2 font-display text-sm tracking-widest uppercase" onClick={() => setMenuOpen(false)}>
            Cotizar {count > 0 && `(${count})`}
          </Link>
        </nav>
      </div>
    </header>
  );
}
