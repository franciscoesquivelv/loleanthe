'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useQuote } from '@/context/QuoteContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { Flower } from '@/lib/types';
import { getCategoryByLabel } from '@/lib/categories';

export default function FlowerDetailClient({ flower }: { flower: Flower }) {
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
          <nav className="mb-8 text-xs font-display tracking-widest uppercase text-[#5C6960]">
            <Link href="/catalogo" className="hover:text-[#8A3B57] transition-colors">Catálogo</Link>
            <span className="mx-2">/</span>
            {category && (
              <>
                <Link href={`/catalogo/${category.slug}`} className="hover:text-[#8A3B57] transition-colors">{category.label}</Link>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-[#1C2A22]">{flower.name}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Gallery */}
            <div>
              <div className="relative aspect-[3/4] overflow-hidden bg-[#E7E8E0]">
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
                    <span className="font-script text-5xl text-[#8A3B57]">LB</span>
                  </div>
                )}
                {!flower.inStock && (
                  <div className="absolute inset-0 bg-[#1C2A22]/50 backdrop-blur-[2px] flex items-center justify-center">
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
                      className={`relative w-16 h-20 overflow-hidden border transition-all ${i === currentImg ? 'border-[#8A3B57]' : 'border-transparent opacity-60 hover:opacity-100'}`}
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
                <p className="font-display text-xs tracking-[0.3em] uppercase text-[#8A3B57] mb-3">
                  {flower.category}
                </p>
              )}
              <h1 className="font-display text-4xl md:text-5xl font-light text-[#1C2A22] leading-tight mb-5">
                {flower.name}
              </h1>

              <span className={`text-xs tracking-widest uppercase font-display mb-6 ${flower.inStock ? 'text-[#8A3B57]' : 'text-[#5C6960]'}`}>
                {flower.inStock ? 'Disponible' : 'Sin stock'}
              </span>

              {flower.description && (
                <p className="text-[#5C6960] leading-relaxed mb-8">{flower.description}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                <button
                  onClick={requestQuote}
                  className="flex-1 bg-[#1C2A22] text-[#E7E8E0] py-4 font-display tracking-widest text-sm uppercase hover:bg-[#8A3B57] transition-all duration-500"
                >
                  Solicitar cotización
                </button>
                <button
                  onClick={toggleQuote}
                  className={`flex-1 py-4 font-display tracking-widest text-sm uppercase border transition-all duration-300 ${
                    inQuote
                      ? 'border-[#8A3B57] bg-[#8A3B57] text-white'
                      : 'border-[#8A3B57] text-[#8A3B57] hover:bg-[#8A3B57] hover:text-white'
                  }`}
                >
                  {inQuote ? '✓ En cotización' : '+ Agregar a cotización'}
                </button>
              </div>

              <Link
                href="/catalogo"
                className="mt-8 font-display text-sm tracking-widest uppercase text-[#5C6960] hover:text-[#8A3B57] transition-colors hover-underline self-start"
              >
                ← Volver al catálogo
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
