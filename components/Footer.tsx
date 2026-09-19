import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#2B1620] text-[#A69182] py-16 px-5 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-8 border-b border-[#A69485]/20 pb-10">
          <Link href="/" aria-label="Loleanthe — inicio">
            <Image src="/logo-wordmark-white.png" alt="Loleanthe" width={200} height={73} className="h-14 w-auto object-contain opacity-95" style={{ width: 'auto' }} />
          </Link>
          <nav className="flex flex-wrap justify-center gap-6 md:gap-7">
            {[
              { href: '/catalogo', label: 'Catálogo' },
              { href: '/#nosotros', label: 'La Diferencia' },
              { href: '/#contacto', label: 'Contacto' },
              { href: '/cotizacion', label: 'Cotizar' },
            ].map(({ href, label }) => (
              <Link key={label} href={href} className="font-body font-medium text-sm text-[#A69182] hover:text-[#9C7A3C] transition-colors">
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-7 text-center sm:text-left text-xs text-[#7A6B5D] tracking-wide">
          © {new Date().getFullYear()} Loleanthe — Flores exóticas de alta gama.
        </p>
      </div>
    </footer>
  );
}
