import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#1C2A22] text-[#93a08c] py-16 px-5 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-8 border-b border-[#8E9C88]/20 pb-10">
          <Link href="/" aria-label="Loleanthe Boutique — inicio">
            <Image
              src="/logo.png"
              alt="Loleanthe Boutique"
              width={240}
              height={100}
              className="h-14 w-auto object-contain [filter:brightness(0)_invert(1)] opacity-95"
              style={{ width: 'auto' }}
            />
          </Link>
          <nav className="flex flex-wrap justify-center gap-6 md:gap-7">
            {[
              { href: '/catalogo', label: 'Catálogo' },
              { href: '/#nosotros', label: 'La Casa' },
              { href: '/#contacto', label: 'Contacto' },
              { href: '/cotizacion', label: 'Cotizar' },
            ].map(({ href, label }) => (
              <Link key={label} href={href} className="font-body font-medium text-sm text-[#93a08c] hover:text-[#C56E88] transition-colors">
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-7 text-center sm:text-left text-xs text-[#657064] tracking-wide">
          © {new Date().getFullYear()} Loleanthe Boutique — Flores exóticas de alta gama.
        </p>
      </div>
    </footer>
  );
}
