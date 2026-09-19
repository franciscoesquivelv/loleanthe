'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuote } from '@/context/QuoteContext';

const NAV = [
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/#origen', label: 'Origen' },
  { href: '/#contacto', label: 'Contacto' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useQuote();
  const pathname = usePathname();

  const isHome = pathname === '/';
  // Sobre el hero oscuro el nav va en claro; en cuanto se pasa, se invierte.
  const overHero = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.75);
    onScroll();
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

  const fg = overHero ? 'text-bone' : 'text-ink';

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,padding] duration-700 ${
          overHero
            ? 'bg-transparent border-b border-transparent py-6'
            : 'bg-bone/90 backdrop-blur-md border-b border-line py-4'
        }`}
      >
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 md:px-10">
          <Link href="/" aria-label="Loleanthe — inicio" className="shrink-0 leading-none">
            <Image
              src={overHero ? '/logo-wordmark-white.png' : '/logo-wordmark.png'}
              alt="Loleanthe"
              width={200}
              height={73}
              priority
              className="h-10 w-auto object-contain md:h-12"
              style={{ width: 'auto' }}
            />
          </Link>

          <nav className="hidden items-center gap-12 md:flex">
            {NAV.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className={`label transition-opacity duration-300 hover:opacity-55 ${fg}`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/cotizacion"
              className={`label border-b pb-1 transition-opacity duration-300 hover:opacity-55 ${fg} ${
                overHero ? 'border-bone/50' : 'border-ink/40'
              }`}
            >
              Cotizar{count > 0 ? ` (${count})` : ''}
            </Link>
          </nav>

          <button
            onClick={() => setMenuOpen(true)}
            className={`label md:hidden ${fg}`}
            aria-label="Abrir menú"
          >
            Menú{count > 0 ? ` (${count})` : ''}
          </button>
        </div>
      </header>

      {/* Menú móvil a pantalla completa */}
      <div
        className={`fixed inset-0 z-[60] bg-ink transition-opacity duration-500 md:hidden ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <Image
            src="/logo-wordmark-white.png"
            alt="Loleanthe"
            width={200}
            height={73}
            className="h-10 w-auto object-contain"
            style={{ width: 'auto' }}
          />
          <button onClick={() => setMenuOpen(false)} className="label text-bone" aria-label="Cerrar menú">
            Cerrar
          </button>
        </div>

        <nav className="mt-16 flex flex-col gap-2 px-6">
          {NAV.map(({ href, label }, i) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="border-b border-line-dark py-5 font-serif text-4xl font-light text-bone"
              style={{
                transition: 'opacity .6s ease, transform .6s ease',
                transitionDelay: `${menuOpen ? 120 + i * 70 : 0}ms`,
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? 'none' : 'translateY(18px)',
              }}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/cotizacion"
            onClick={() => setMenuOpen(false)}
            className="border-b border-line-dark py-5 font-serif text-4xl font-light text-bone"
            style={{
              transition: 'opacity .6s ease, transform .6s ease',
              transitionDelay: `${menuOpen ? 120 + NAV.length * 70 : 0}ms`,
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? 'none' : 'translateY(18px)',
            }}
          >
            Cotizar{count > 0 ? ` (${count})` : ''}
          </Link>
        </nav>
      </div>
    </>
  );
}
