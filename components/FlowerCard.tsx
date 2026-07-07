'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuote } from '@/context/QuoteContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { Flower } from '@/lib/types';

interface Props {
  flower: Flower;
  priority?: boolean;
  detailHref?: string;
}

export default function FlowerCard({ flower, priority = false, detailHref }: Props) {
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
      addToQuote({ flowerId: flower.id, flowerName: flower.name, flowerImage: flower.images[0] });
      toast.success(`${flower.name} agregada a tu cotización`);
    }
  };

  const handleQuoteNav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inQuote) {
      addToQuote({ flowerId: flower.id, flowerName: flower.name, flowerImage: flower.images[0] });
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
      className="group relative bg-[#F7F8F4] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(28,42,34,0.16)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#dfe1d8]">
        {flower.images.length > 0 ? (
          <Image
            src={flower.images[currentImg]}
            alt={flower.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#d5d8cd]">
            <span className="font-display font-bold text-3xl text-[#8E9C88]">LB</span>
          </div>
        )}

        {flower.images.length > 1 && hovered && (
          <>
            <button onClick={prevImg} className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1C2A22]/60 backdrop-blur-sm text-white items-center justify-center hover:bg-[#8A3B57] transition-colors z-10" aria-label="Imagen anterior">‹</button>
            <button onClick={nextImg} className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1C2A22]/60 backdrop-blur-sm text-white items-center justify-center hover:bg-[#8A3B57] transition-colors z-10" aria-label="Siguiente imagen">›</button>
          </>
        )}

        {flower.images.length > 1 && (
          <div className="absolute bottom-14 md:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {flower.images.map((img, i) => (
              <button key={img} onClick={(e) => { e.stopPropagation(); setCurrentImg(i); }} className={`h-1.5 rounded-full transition-all ${i === currentImg ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`} aria-label={`Imagen ${i + 1}`} />
            ))}
          </div>
        )}

        {!flower.inStock && (
          <div className="absolute inset-0 bg-[#1C2A22]/55 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="font-body font-bold text-white tracking-[0.2em] uppercase text-xs border border-white px-4 py-2">Sin Stock</span>
          </div>
        )}

        <div className={`absolute inset-0 bg-gradient-to-t from-[#12201A]/85 via-transparent to-transparent z-10 opacity-100 md:opacity-0 md:transition-opacity md:duration-300 ${hovered ? 'md:opacity-100' : ''}`} />

        {flower.inStock && (
          <div className={`absolute bottom-0 left-0 right-0 p-3 md:p-4 z-20 flex flex-col gap-2 md:transition-all md:duration-300 ${hovered ? 'md:translate-y-0 md:opacity-100' : 'md:translate-y-4 md:opacity-0'}`}>
            <button onClick={handleQuoteNav} className="w-full bg-[#F7F8F4] text-[#1C2A22] font-body font-bold tracking-wide text-xs uppercase py-3 hover:bg-[#8A3B57] hover:text-white transition-all duration-300">
              Solicitar Cotización
            </button>
            <button onClick={handleQuote} className={`w-full font-body font-bold tracking-wide text-xs uppercase py-3 border transition-all duration-300 ${inQuote ? 'border-[#8A3B57] bg-[#8A3B57] text-white' : 'border-white/70 text-white hover:border-[#C56E88] hover:text-[#C56E88]'}`}>
              {inQuote ? '✓ En cotización' : '+ Agregar a cotización'}
            </button>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#dfe1d8]">
        <h3 className="font-display font-bold text-lg text-[#1C2A22] leading-tight">
          {detailHref ? (
            <Link href={detailHref} className="hover:text-[#8A3B57] transition-colors">{flower.name}</Link>
          ) : (
            flower.name
          )}
        </h3>
        {flower.description && (
          <p className="text-[#5C6960] text-xs mt-1 leading-relaxed line-clamp-2">{flower.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className={`font-body font-bold text-[11px] tracking-wide uppercase ${flower.inStock ? 'text-[#8A3B57]' : 'text-[#5C6960]'}`}>
            {flower.inStock ? 'Disponible' : 'Sin stock'}
          </span>
          {!hovered && flower.inStock && (
            <button onClick={handleQuote} className={`hidden md:block font-body font-bold text-[11px] tracking-wide uppercase transition-colors ${inQuote ? 'text-[#8A3B57]' : 'text-[#5C6960] hover:text-[#8A3B57]'}`}>
              {inQuote ? '✓ En cotización' : '+ Cotizar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
