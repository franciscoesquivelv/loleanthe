import Image from 'next/image';
import Link from 'next/link';

const LINKS = [
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/precios', label: 'Precios' },
  { href: '/#origen', label: 'Origen' },
  { href: '/cotizacion', label: 'Cotizar' },
];

export default function Footer() {
  return (
    <footer className="bg-ink px-6 pb-12 text-bone md:px-10">
      <div className="mx-auto max-w-[1500px] border-t border-bone/15 pt-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <Link href="/" aria-label="Loleanthe, inicio">
            <Image
              src="/logo-wordmark-white.png"
              alt="Loleanthe"
              width={200}
              height={73}
              className="h-12 w-auto object-contain md:h-14"
              style={{ width: 'auto' }}
            />
          </Link>

          <nav className="flex flex-wrap gap-8">
            {LINKS.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className="label text-bone/70 transition-opacity duration-300 hover:opacity-100 hover:text-bone"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-bone/10 pt-6 text-[11px] text-bone/40 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} Loleanthe</p>
          <p>Flor ecuatoriana consolidada · Costa Rica y Guatemala</p>
        </div>
      </div>
    </footer>
  );
}
