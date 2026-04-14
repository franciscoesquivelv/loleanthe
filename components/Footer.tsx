import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#1A130A] text-[#7A6654] py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Logo center */}
        <div className="flex flex-col items-center mb-12">
          <Image
            src="/logo.png"
            alt="Loleanthe Boutique"
            width={240}
            height={80}
            className="h-16 w-auto object-contain invert opacity-80 mb-6"
          />
          <div className="ornament max-w-xs w-full">
            <span className="text-[#B08D6B]/50 text-xs tracking-[0.3em] uppercase font-display">Luxury Florals</span>
          </div>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-8 mb-12">
          {[
            { href: '#catalogo', label: 'Catálogo' },
            { href: '#nosotros', label: 'Nosotros' },
            { href: '#contacto', label: 'Contacto' },
            { href: '/catalogo', label: 'Ver todo' },
            { href: '/cotizacion', label: 'Cotización' },
          ].map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className="font-display text-xs tracking-widest uppercase text-[#7A6654] hover:text-[#B08D6B] transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#B08D6B]/30 to-transparent mb-8" />

        <p className="text-center text-[#7A6654]/50 text-xs font-display tracking-wider">
          © {new Date().getFullYear()} Loleanthe Boutique — Luxury Florals. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
