'use client';

import { useEffect, useState } from 'react';
import PriceSheetView from '@/app/precios/PriceSheetView';
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from '@/app/precios/data';
import { getTipoDeCambio, type TipoDeCambio } from '@/lib/exchange-rate';
import { destinationInfo, urlVisible, type PriceDestination } from '@/lib/price-destinations';
import type { PriceItem } from '@/lib/priceSheets';
import type { Flower } from '@/lib/types';
import { ACCION } from './ui';

/**
 * La hoja tal como la ve el cliente, con lo que hay en el formulario AHORA
 * (guardado o no). Es el mismo componente de las páginas públicas, no una
 * imitación: si algo se ve raro acá, se ve raro allá.
 *
 * Es una capa sobre el editor, no otra ruta: el formulario sigue como estaba al
 * cerrarla. No escribe nada.
 */
export default function VistaPrevia({
  title,
  description,
  items,
  destination,
  flowers,
  enVivo,
  onCerrar,
}: {
  title: string;
  description: string;
  items: PriceItem[];
  destination: PriceDestination | null;
  flowers: Flower[];
  /** `true` si la hoja ya está publicada: lo que se ve es lo que los clientes ven (más lo sin guardar). */
  enVivo: boolean;
  onCerrar: () => void;
}) {
  const destino = destination ?? 'GENERAL';
  const info = destinationInfo(destino);
  const [tipoDeCambio, setTipoDeCambio] = useState<TipoDeCambio | undefined>();

  useEffect(() => {
    if (!info.currency) return;
    let vigente = true;
    getTipoDeCambio().then((tc) => vigente && setTipoDeCambio(tc));
    return () => {
      vigente = false;
    };
  }, [info.currency]);

  useEffect(() => {
    const cerrarConEsc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', cerrarConEsc);
    return () => {
      document.body.style.overflow = antes;
      window.removeEventListener('keydown', cerrarConEsc);
    };
  }, [onCerrar]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Vista previa de la hoja" className="fixed inset-0 z-[70] overflow-y-auto bg-bone">
      <PriceSheetView
        items={items}
        flowers={flowers}
        title={title.trim() || 'Sin título'}
        description={description}
        destination={destino}
        whatsappNumber={WHATSAPP_NUMBER}
        whatsappDisplay={WHATSAPP_DISPLAY}
        tipoDeCambio={tipoDeCambio}
      />
      <div className="sticky bottom-0 z-[80] border-t border-line bg-paper">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3 md:px-10">
          <p className="label text-muted">
            Vista previa · {urlVisible(destino)} ·{' '}
            {enVivo ? 'así se ve ahora, más lo que no guardaste' : 'todavía no está publicada'}
          </p>
          <button type="button" onClick={onCerrar} className={ACCION} autoFocus>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
