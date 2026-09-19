'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuote } from '@/context/QuoteContext';
import toast from 'react-hot-toast';
import type { Flower } from '@/lib/types';

interface Props {
  flower: Flower;
  priority?: boolean;
  detailHref?: string;
}

export default function FlowerCard({ flower, priority = false, detailHref }: Props) {
  const { addToQuote, isInQuote, removeFromQuote } = useQuote();
  const inQuote = isInQuote(flower.id);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inQuote) {
      removeFromQuote(flower.id);
      toast('Quitada de tu cotización');
    } else {
      addToQuote({ flowerId: flower.id, flowerName: flower.name, flowerImage: flower.images[0] });
      toast.success(`${flower.name} agregada`);
    }
  };

  const meta = [flower.apertura, flower.stemLength].filter(Boolean).join(' · ');

  const body = (
    <>
      <div className="relative aspect-[4/5] overflow-hidden bg-line">
        {flower.images.length > 0 ? (
          <Image
            src={flower.images[0]}
            alt={flower.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-serif text-2xl text-muted">LB</span>
          </div>
        )}

        {!flower.inStock && (
          <div className="absolute inset-0 flex items-end bg-ink/45 p-5">
            <span className="label text-bone">Agotado</span>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 px-5 py-5">
        <div className="min-w-0">
          <h3 className="font-serif text-xl font-light leading-tight text-ink">{flower.name}</h3>
          {meta && <p className="label mt-2 text-muted">{meta}</p>}
        </div>

        {flower.inStock && (
          <button
            onClick={toggle}
            className={`label shrink-0 border-b pb-0.5 transition-colors duration-300 ${
              inQuote ? 'border-ink text-ink' : 'border-transparent text-muted hover:border-ink hover:text-ink'
            }`}
          >
            {inQuote ? 'Agregada' : 'Cotizar'}
          </button>
        )}
      </div>
    </>
  );

  return detailHref ? (
    <Link href={detailHref} className="group block bg-paper">
      {body}
    </Link>
  ) : (
    <div className="group block bg-paper">{body}</div>
  );
}
