'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MaskLines, Reveal } from './motion';

export default function Hero() {
  return (
    <section className="relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-ink">
      <div className="absolute inset-0 drift">
        <Image
          src="/images/hero-dark.jpg"
          alt="Peonías sobre fondo oscuro"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Dos capas: una general para asentar el blanco, otra al pie para el texto */}
      <div className="absolute inset-0 bg-ink/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />

      <div className="relative flex h-full flex-col justify-end px-6 pb-16 md:px-10 md:pb-20">
        <div className="mx-auto w-full max-w-[1500px]">
          <Reveal delay={400} y={14}>
            <p className="label mb-6 text-bone/70">Costa Rica · Guatemala</p>
          </Reveal>

          <MaskLines
            lines={['Flores', 'fuera de serie']}
            delay={550}
            stagger={130}
            className="font-serif text-bone"
            lineClassName="text-[clamp(52px,11vw,150px)] font-light leading-[0.92] tracking-[-0.02em]"
          />

          <div className="mt-10 flex flex-col gap-8 border-t border-bone/20 pt-8 md:flex-row md:items-end md:justify-between">
            <Reveal delay={950} y={18}>
              <p className="max-w-md text-[15px] leading-relaxed text-bone/75">
                Consolidamos flor ecuatoriana de varias fincas y la traemos bajo pedido
                para floristas, decoradores, hoteles y más.
              </p>
            </Reveal>

            <Reveal delay={1100} y={18}>
              <Link
                href="/catalogo"
                className="label group inline-flex items-center gap-4 text-bone"
              >
                Ver el catálogo
                <span className="h-px w-10 bg-bone transition-all duration-500 group-hover:w-16" />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="scroll-hint absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:block">
        <span className="block h-10 w-px bg-bone/40" />
      </div>
    </section>
  );
}
