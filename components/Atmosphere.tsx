'use client';

import Image from 'next/image';
import { MaskLines, Parallax } from './motion';

export default function Atmosphere() {
  return (
    <section className="relative h-[80svh] min-h-[460px] w-full overflow-hidden bg-ink">
      {/* La imagen se extiende por encima y por debajo del corte para que el
          desplazamiento lento nunca descubra los bordes. */}
      <Parallax speed={0.16} className="absolute inset-x-0 -top-[18%] h-[136%]">
        <div className="relative h-full w-full">
          <Image
            src="/images/atmos-dark.jpg"
            alt="Bodegón floral sobre fondo oscuro"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </Parallax>

      <div className="absolute inset-0 bg-ink/45" />

      <div className="relative flex h-full items-center px-6 md:px-10">
        <div className="mx-auto w-full max-w-[1500px]">
          <MaskLines
            lines={['No tenemos bodega.', 'Cada pedido se consolida', 'y llega en dos o tres semanas.']}
            stagger={120}
            className="font-serif text-bone"
            lineClassName="max-w-4xl text-[clamp(28px,4.6vw,62px)] font-light leading-[1.12] tracking-[-0.015em]"
          />
        </div>
      </div>
    </section>
  );
}
