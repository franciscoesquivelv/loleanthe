import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/motion';
import { WHATSAPP_NUMBER, WHATSAPP_DISPLAY } from '@/app/precios/data';

// Precios NO va acá: es un enlace que Francisco manda directo por país
// (/precios-cr, /precios-gt), no una sección pública del sitio.
const LINKS = [
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/flores-para-bodas', label: 'Bodas y Eventos' },
  { href: '/#origen', label: 'Origen' },
  { href: '/cotizacion', label: 'Cotizar' },
];

const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, quiero cotizar flor al por mayor')}`;
const NAV_LINK_CLASS = 'label text-bone/70 transition-opacity duration-300 hover:opacity-100 hover:text-bone';

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
              <Link key={label} href={href} className={NAV_LINK_CLASS}>
                {label}
              </Link>
            ))}
            <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className={NAV_LINK_CLASS}>
              WhatsApp {WHATSAPP_DISPLAY}
            </a>
          </nav>
        </div>

        <Reveal>
          <div
            aria-hidden="true"
            className="relative mt-20 aspect-[1315/478] w-[clamp(280px,60vw,900px)] select-none md:mt-28"
          >
            <Image src="/logo-wordmark-white.png" alt="" fill className="object-contain object-left" />
          </div>
        </Reveal>

        <div className="mt-14 flex flex-col gap-3 border-t border-bone/10 pt-6 text-[11px] text-bone/40 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} Loleanthe</p>
          <p>Flor ecuatoriana consolidada · Costa Rica y Guatemala</p>
        </div>
      </div>
    </footer>
  );
}
