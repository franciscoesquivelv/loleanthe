'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FlowerCard from '@/components/FlowerCard';
import { MaskLines, Reveal } from '@/components/motion';
import { useQuote } from '@/context/QuoteContext';
import toast from 'react-hot-toast';
import type { Flower } from '@/lib/types';
import { getCategoryByLabel } from '@/lib/categories';

export default function FlowerDetailClient({ flower, related = [] }: { flower: Flower; related?: Flower[] }) {
  const [currentImg, setCurrentImg] = useState(0);
  const category = getCategoryByLabel(flower.category);
  const { addToQuote, isInQuote, removeFromQuote } = useQuote();
  const router = useRouter();
  const inQuote = isInQuote(flower.id);

  const toggleQuote = () => {
    if (inQuote) {
      removeFromQuote(flower.id);
      toast('Quitada de tu cotización');
    } else {
      addToQuote({ flowerId: flower.id, flowerName: flower.name, flowerImage: flower.images[0] });
      toast.success(`${flower.name} agregada`);
    }
  };

  const requestQuote = () => {
    if (!inQuote) {
      addToQuote({ flowerId: flower.id, flowerName: flower.name, flowerImage: flower.images[0] });
    }
    router.push('/cotizacion');
  };

  const specs = [
    flower.tier && { label: 'Grado', value: flower.tier },
    flower.apertura && { label: 'Apertura', value: flower.apertura },
    flower.stemLength && { label: 'Largo de tallo', value: flower.stemLength },
    flower.vaseLifeDays != null && { label: 'Vida en florero', value: `${flower.vaseLifeDays} días` },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-bone px-6 pb-24 pt-32 md:px-10 md:pb-40 md:pt-40">
        <div className="mx-auto max-w-[1500px]">
          <nav className="label mb-12 flex flex-wrap items-center gap-3 text-muted md:mb-16">
            <Link href="/catalogo" className="transition-opacity hover:opacity-60">Catálogo</Link>
            {category && (
              <>
                <span aria-hidden>/</span>
                <Link href={`/catalogo/${category.slug}`} className="transition-opacity hover:opacity-60">
                  {category.label}
                </Link>
              </>
            )}
            <span aria-hidden>/</span>
            <span className="text-ink">{flower.name}</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
            {/* Galería */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <Reveal y={20}>
                <div className="relative aspect-[4/5] overflow-hidden bg-line">
                  {flower.images.length > 0 ? (
                    <Image
                      src={flower.images[currentImg]}
                      alt={flower.name}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="font-serif text-4xl text-muted">LB</span>
                    </div>
                  )}
                  {!flower.inStock && (
                    <div className="absolute inset-0 flex items-end bg-ink/45 p-6">
                      <span className="label text-bone">Agotado</span>
                    </div>
                  )}
                </div>

                {flower.images.length > 1 && (
                  <div className="mt-3 flex gap-3">
                    {flower.images.map((img, i) => (
                      <button
                        key={img}
                        onClick={() => setCurrentImg(i)}
                        aria-label={`Ver imagen ${i + 1} de ${flower.name}`}
                        className={`relative h-20 w-16 overflow-hidden transition-opacity duration-300 ${
                          i === currentImg ? 'opacity-100' : 'opacity-45 hover:opacity-80'
                        }`}
                      >
                        <Image src={img} alt="" fill sizes="64px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </Reveal>
            </div>

            {/* Información */}
            <div>
              <Reveal>
                <p className="label mb-6 text-muted">
                  {flower.category}
                  {flower.inStock ? ' · Disponible' : ' · Agotado'}
                </p>
              </Reveal>

              <MaskLines
                lines={[flower.name]}
                className="font-serif text-ink"
                lineClassName="text-[clamp(38px,5.5vw,72px)] font-light leading-[1.02] tracking-[-0.02em]"
              />

              {flower.description && (
                <Reveal delay={200}>
                  <p className="mt-8 max-w-lg text-[15px] leading-relaxed text-muted">{flower.description}</p>
                </Reveal>
              )}

              {/* Ficha técnica, lo que un florista usa para cotizarle a su cliente */}
              {specs.length > 0 && (
                <Reveal delay={260}>
                  <dl className="mt-14 border-t border-line">
                    {specs.map((s) => (
                      <div key={s.label} className="flex items-baseline justify-between gap-6 border-b border-line py-5">
                        <dt className="label text-muted">{s.label}</dt>
                        <dd className="font-serif text-lg font-light text-ink">{s.value}</dd>
                      </div>
                    ))}
                    {flower.colors && flower.colors.length > 0 && (
                      <div className="flex items-center justify-between gap-6 border-b border-line py-5">
                        <dt className="label text-muted">Colores</dt>
                        <dd className="flex gap-2">
                          {flower.colors.map((c, i) => (
                            <span
                              key={i}
                              className="h-4 w-4 rounded-full ring-1 ring-line"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                </Reveal>
              )}

              <Reveal delay={320}>
                <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-5">
                  <button onClick={requestQuote} className="label group inline-flex items-center gap-4 text-ink">
                    Pedir cotización
                    <span className="h-px w-10 bg-ink transition-all duration-500 group-hover:w-16" />
                  </button>
                  <button
                    onClick={toggleQuote}
                    className={`label border-b pb-1 transition-colors duration-300 ${
                      inQuote ? 'border-ink text-ink' : 'border-transparent text-muted hover:border-ink hover:text-ink'
                    }`}
                  >
                    {inQuote ? 'Agregada a tu lista' : 'Agregar a la lista'}
                  </button>
                </div>
              </Reveal>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-28 border-t border-line pt-16 md:mt-40">
              <Reveal>
                <p className="label mb-10 text-muted">Combina bien con</p>
              </Reveal>
              <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((f, i) => (
                  <Reveal key={f.id} delay={i * 70} y={28}>
                    <FlowerCard flower={f} detailHref={`/catalogo/${f.id}`} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
