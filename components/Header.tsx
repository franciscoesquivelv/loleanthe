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
  const atTop = isHome && !scrolled;
  // Hero ground is white → use the dark-on-light nav scheme everywhere.
  const isDark = false;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const linkClass = isDark
    ? 'text-[#EDE4D8]/85 hover:text-[#9C7A3C]'
    : 'text-[#2A211C]/75 hover:text-[#9C7A3C]';
  const hamburger = isDark ? 'bg-[#FBF7F0]' : 'bg-[#2A211C]';
  const anchor = (hash: string) => (isHome ? hash : `/${hash}`);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        atTop ? 'bg-transparent py-5 md:py-6' : 'bg-[#F7F1E8]/95 backdrop-blur-md border-b border-[#A69485]/25 py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-6 flex items-center justify-between">
        {/* Logo left */}
        <Link href="/" className="shrink-0 leading-none" aria-label="Loleanthe — inicio">
          <Image
            src={isDark ? '/logo-wordmark-white.png' : '/logo-wordmark.png'}
            alt="Loleanthe"
            width={200}
            height={73}
            priority
            className="w-auto h-11 md:h-14 object-contain transition-all duration-500"
            style={{ width: 'auto' }}
          />
        </Link>

        {/* Desktop nav right */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/catalogo" className={`font-body font-medium text-sm tracking-wide transition-colors ${linkClass}`}>Catálogo</Link>
          <Link href={anchor('#nosotros')} className={`font-body font-medium text-sm tracking-wide transition-colors ${linkClass}`}>La Diferencia</Link>
          <Link href={anchor('#contacto')} className={`font-body font-medium text-sm tracking-wide transition-colors ${linkClass}`}>Contacto</Link>
          <Link
            href="/cotizacion"
            className="relative flex items-center gap-2 bg-[#9C7A3C] text-[#FBF7F0] px-5 py-2.5 font-body font-bold text-sm tracking-wide hover:bg-[#9C7A3C] hover:text-[#2B1620] transition-all duration-300"
          >
            Cotizar
            {count > 0 && (
              <span className="bg-[#FBF7F0] text-[#9C7A3C] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{count}</span>
            )}
          </Link>
        </nav>

        {/* Mobile: cotizar + hamburger */}
        <div className="md:hidden flex items-center gap-3">
          {count > 0 && (
            <Link href="/cotizacion" className="relative flex items-center bg-[#9C7A3C] text-[#FBF7F0] font-body font-bold text-xs tracking-wide py-2 px-3">
              Cotizar
              <span className="absolute -top-1.5 -right-1.5 bg-[#FBF7F0] text-[#9C7A3C] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{count}</span>
            </Link>
          )}
          <button
            className="flex flex-col gap-[5px] p-2 -mr-1 touch-manipulation"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            <span className={`block w-6 h-[1.5px] transition-all duration-300 ${hamburger} ${menuOpen ? 'rotate-45 translate-y-[6.5px]' : ''}`} />
            <span className={`block w-6 h-[1.5px] transition-all duration-300 ${hamburger} ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`block w-6 h-[1.5px] transition-all duration-300 ${hamburger} ${menuOpen ? '-rotate-45 -translate-y-[6.5px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu — full-screen pine overlay */}
      <div
        className={`md:hidden fixed inset-0 top-0 bg-[#2B1620] z-40 flex flex-col transition-all duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#A69485]/20">
          <Link href="/" onClick={() => setMenuOpen(false)}>
            <Image src="/logo-wordmark-white.png" alt="Loleanthe" width={200} height={73} className="h-11 w-auto object-contain" style={{ width: 'auto' }} />
          </Link>
          <button onClick={() => setMenuOpen(false)} className="flex flex-col gap-[5px] p-2 -mr-1" aria-label="Cerrar menú">
            <span className="block w-6 h-[1.5px] bg-[#FBF7F0] rotate-45 translate-y-[6.5px]" />
            <span className="block w-6 h-[1.5px] bg-[#FBF7F0] opacity-0" />
            <span className="block w-6 h-[1.5px] bg-[#FBF7F0] -rotate-45 -translate-y-[6.5px]" />
          </button>
        </div>

        <nav className="flex flex-col flex-1 justify-center items-center gap-8 px-6">
          {[
            { href: '/catalogo', label: 'Catálogo' },
            { href: anchor('#nosotros'), label: 'La Diferencia' },
            { href: anchor('#contacto'), label: 'Contacto' },
          ].map(({ href, label }) => (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)} className="font-display font-bold text-3xl text-[#FBF7F0] hover:text-[#9C7A3C] transition-colors">
              {label}
            </Link>
          ))}
          <div className="w-16 h-px bg-[#A69485]/40 my-2" />
          <Link
            href="/cotizacion"
            onClick={() => setMenuOpen(false)}
            className="bg-[#9C7A3C] text-[#FBF7F0] px-10 py-4 font-body font-bold tracking-wide text-sm hover:bg-[#9C7A3C] hover:text-[#2B1620] transition-all duration-300 w-full text-center max-w-xs"
          >
            Cotizar{count > 0 ? ` (${count})` : ''}
          </Link>
        </nav>
      </div>
    </header>
  );
}
