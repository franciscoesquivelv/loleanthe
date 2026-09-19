'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FlowerCard from '@/components/FlowerCard';
import { useQuote } from '@/context/QuoteContext';
import { useRouter } from 'next/navigation';
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
      toast('Eliminada de tu cotización');
    } else {
      addToQuote({ flowerId: flower.id, flowerName: flower.name, flowerImage: flower.images[0] });
      toast.success(`${flower.name} agregada a tu cotización`);
    }
  };

  const requestQuote = () => {
    if (!inQuote) {
      addToQuote({ flowerId: flower.id, flowerName: flower.name, flowerImage: flower.images[0] });
    }
    router.push('/cotizacion');
  };

  return (
    <>
      <Header />
      <main className="pt-24 md:pt-32 pb-16 md:pb-24 min-h-screen">
        <div className="max-w-6xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="mb-8 text-xs font-display tracking-widest uppercase text-[#6B5D50]">
            <Link href="/catalogo" className="hover:text-[#9C7A3C] transition-colors">Catálogo</Link>
            <span className="mx-2">/</span>
            {category && (
              <>
                <Link href={`/catalogo/${category.slug}`} className="hover:text-[#9C7A3C] transition-colors">{category.label}</Link>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-[#2B1620]">{flower.name}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Gallery */}
            <div>
              <div className="relative aspect-[3/4] overflow-hidden bg-[#EDE4D8]">
                {flower.images.length > 0 ? (
                  <Image
                    src={flower.images[currentImg]}
                    alt={flower.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-script text-5xl text-[#9C7A3C]">LB</span>
                  </div>
                )}
                {!flower.inStock && (
                  <div className="absolute inset-0 bg-[#2B1620]/50 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="font-display text-white tracking-[0.3em] uppercase text-sm border border-white px-4 py-2">
                      Sin Stock
                    </span>
                  </div>
                )}
              </div>
              {flower.images.length > 1 && (
                <div className="flex gap-3 mt-3">
                  {flower.images.map((img, i) => (
                    <button
                      key={img}
                      onClick={() => setCurrentImg(i)}
                      className={`relative w-16 h-20 overflow-hidden border transition-all ${i === currentImg ? 'border-[#9C7A3C]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      aria-label={`Ver imagen ${i + 1} de ${flower.name}`}
                    >
                      <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              {flower.category && (
                <p className="font-display text-xs tracking-[0.3em] uppercase text-[#9C7A3C] mb-3">
                  {flower.category}{flower.tier ? ` · ${flower.tier}` : ''}
                </p>
              )}
              <h1 className="font-display text-4xl md:text-5xl font-light text-[#2B1620] leading-tight mb-5">
                {flower.name}
              </h1>

              <span className={`text-xs tracking-widest uppercase font-display mb-6 ${flower.inStock ? 'text-[#9C7A3C]' : 'text-[#6B5D50]'}`}>
                {flower.inStock ? 'Disponible' : 'Sin stock'}
              </span>

              {(flower.apertura || flower.stemLength || flower.vaseLifeDays != null) && (
                <div className="flex flex-wrap gap-6 mt-6 pb-6 border-b border-[#DDD2C2]">
                  {flower.apertura && (
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-[#6B5D50] mb-1">Apertura</p>
                      <p className="font-display text-sm text-[#2B1620]">{flower.apertura}</p>
                    </div>
                  )}
                  {flower.stemLength && (
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-[#6B5D50] mb-1">Largo del tallo</p>
                      <p className="font-display text-sm text-[#2B1620]">{flower.stemLength}</p>
                    </div>
                  )}
                  {flower.vaseLifeDays != null && (
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-[#6B5D50] mb-1">Vida en florero</p>
                      <p className="font-display text-sm text-[#2B1620]">{flower.vaseLifeDays} días</p>
                    </div>
                  )}
                </div>
              )}

              {flower.description && (
                <p className="text-[#6B5D50] leading-relaxed mt-6 mb-2">{flower.description}</p>
              )}

              {flower.colors && flower.colors.length > 0 && (
                <div className="flex items-center gap-2 mb-8">
                  <span className="text-[10px] tracking-widest uppercase text-[#6B5D50] mr-1">Colores</span>
                  {flower.colors.map((c, i) => (
                    <span key={i} className="w-5 h-5 rounded-full border border-[#DDD2C2]" style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                <button
                  onClick={requestQuote}
                  className="flex-1 bg-[#2B1620] text-[#EDE4D8] py-4 font-display tracking-widest text-sm uppercase hover:bg-[#9C7A3C] transition-all duration-500"
                >
                  Solicitar cotización
                </button>
                <button
                  onClick={toggleQuote}
                  className={`flex-1 py-4 font-display tracking-widest text-sm uppercase border transition-all duration-300 ${
                    inQuote
                      ? 'border-[#9C7A3C] bg-[#9C7A3C] text-white'
                      : 'border-[#9C7A3C] text-[#9C7A3C] hover:bg-[#9C7A3C] hover:text-white'
                  }`}
                >
                  {inQuote ? '✓ En cotización' : '+ Agregar a cotización'}
                </button>
              </div>

              <Link
                href="/catalogo"
                className="mt-8 font-display text-sm tracking-widest uppercase text-[#6B5D50] hover:text-[#9C7A3C] transition-colors hover-underline self-start"
              >
                ← Volver al catálogo
              </Link>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-16 md:mt-24 pt-12 md:pt-16 border-t border-[#DDD2C2]">
              <div className="text-center mb-8 md:mb-10">
                <p className="font-display italic text-[#9C7A3C] text-xl md:text-2xl mb-2">Combina bien con</p>
                <h2 className="font-display text-2xl md:text-3xl text-[#2B1620]">Completa tu arreglo</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {related.map((f) => (
                  <FlowerCard key={f.id} flower={f} detailHref={`/catalogo/${f.id}`} />
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
