'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuote } from '@/context/QuoteContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { Flower } from '@/lib/types';

interface Props {
  flower: Flower;
  priority?: boolean;
}

export default function FlowerCard({ flower, priority = false }: Props) {
  const [currentImg, setCurrentImg] = useState(0);
  const [hovered, setHovered] = useState(false);
  const { addToQuote, isInQuote, removeFromQuote } = useQuote();
  const router = useRouter();
  const inQuote = isInQuote(flower.id);

  const handleQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inQuote) {
      removeFromQuote(flower.id);
      toast('Eliminada de tu cotización');
    } else {
      addToQuote({
        flowerId: flower.id,
        flowerName: flower.name,
        flowerImage: flower.images[0],
      });
      toast.success(`${flower.name} agregada a tu cotización`);
    }
  };

  const handleQuoteNav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inQuote) {
      addToQuote({
        flowerId: flower.id,
        flowerName: flower.name,
        flowerImage: flower.images[0],
      });
    }
    router.push('/cotizacion');
  };

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev + 1) % flower.images.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev - 1 + flower.images.length) % flower.images.length);
  };

  return (
    <div
      className="flower-card group relative bg-white overflow-hidden cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: '1px' }}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F2EDE4]">
        {flower.images.length > 0 ? (
          <Image
            src={flower.images[currentImg]}
            alt={flower.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#EDE0CE]">
            <span className="font-script text-4xl text-[#B08D6B]">LB</span>
          </div>
        )}

        {/* Image navigation arrows — only on md+ */}
        {flower.images.length > 1 && hovered && (
          <>
            <button
              onClick={prevImg}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1A130A]/60 backdrop-blur-sm text-white items-center justify-center hover:bg-[#B08D6B] transition-colors z-10"
              aria-label="Imagen anterior"
            >
              ‹
            </button>
            <button
              onClick={nextImg}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1A130A]/60 backdrop-blur-sm text-white items-center justify-center hover:bg-[#B08D6B] transition-colors z-10"
              aria-label="Siguiente imagen"
            >
              ›
            </button>
          </>
        )}

        {/* Mobile image swipe dots */}
        {flower.images.length > 1 && (
          <div className="absolute bottom-14 md:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {flower.images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrentImg(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImg ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}

        {/* Out of stock overlay */}
        {!flower.inStock && (
          <div className="absolute inset-0 bg-[#1A130A]/50 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="font-display text-white tracking-[0.3em] uppercase text-sm border border-white px-4 py-2">
              Sin Stock
            </span>
          </div>
        )}

        {/* Gradient overlay:
            Mobile — always visible so action buttons are readable
            Desktop — only on hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-[#1A130A]/80 via-transparent to-transparent z-10
          opacity-100 md:opacity-0 md:transition-opacity md:duration-300
          ${hovered ? 'md:opacity-100' : ''}
        `} />

        {/* Action buttons:
            Mobile — always visible at bottom
            Desktop — slide up on hover */}
        {flower.inStock && (
          <div className={`absolute bottom-0 left-0 right-0 p-3 md:p-4 z-20 flex flex-col gap-2
            md:transition-all md:duration-300
            ${hovered ? 'md:translate-y-0 md:opacity-100' : 'md:translate-y-4 md:opacity-0'}
          `}>
            <button
              onClick={handleQuoteNav}
              className="w-full bg-[#FAF7F2] text-[#1A130A] font-display tracking-widest text-xs uppercase py-3 hover:bg-[#B08D6B] hover:text-white transition-all duration-300 active:bg-[#B08D6B] active:text-white"
            >
              Solicitar Cotización
            </button>
            <button
              onClick={handleQuote}
              className={`w-full font-display tracking-widest text-xs uppercase py-3 border transition-all duration-300 active:opacity-80 ${
                inQuote
                  ? 'border-[#B08D6B] bg-[#B08D6B] text-white'
                  : 'border-white/70 text-white hover:border-[#B08D6B] hover:text-[#B08D6B]'
              }`}
            >
              {inQuote ? '✓ En cotización' : '+ Agregar a cotización'}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 md:p-4 border-t border-[#EDE0CE]">
        <h3 className="font-display text-base md:text-lg text-[#1A130A] font-medium leading-tight">{flower.name}</h3>
        {flower.description && (
          <p className="text-[#7A6654] text-xs mt-1 leading-relaxed line-clamp-2">{flower.description}</p>
        )}
        <div className="flex items-center justify-between mt-2 md:mt-3">
          <span className={`text-xs tracking-widest uppercase font-display ${flower.inStock ? 'text-[#B08D6B]' : 'text-[#7A6654]'}`}>
            {flower.inStock ? 'Disponible' : 'Sin stock'}
          </span>
          {/* Desktop only — on mobile the action bar is always visible above */}
          {!hovered && flower.inStock && (
            <button
              onClick={handleQuote}
              className={`hidden md:block text-xs tracking-wider font-display uppercase transition-colors ${inQuote ? 'text-[#B08D6B]' : 'text-[#7A6654] hover:text-[#B08D6B]'}`}
            >
              {inQuote ? '✓ En cotización' : '+ Cotizar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
