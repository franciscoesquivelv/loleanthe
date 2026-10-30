import { getPublicFlowersServer } from '@/lib/flowers-server';
import { getTipoDeCambio } from '@/lib/exchange-rate';
import { getPublishedPriceSheetServer } from '@/lib/priceSheets-server';
import { destinationInfo, type PriceDestination } from '@/lib/price-destinations';
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from './data';
import NoSheet from './NoSheet';
import PriceSheetView from './PriceSheetView';

/**
 * Cuerpo de las tres rutas de precios. Cada `page.tsx` solo dice de qué
 * destino es: el destino nunca sale de la URL ni de un parámetro, así que
 * `/precios-gt` no puede mostrar la hoja de otro país.
 */
export default async function PricePage({ destination }: { destination: PriceDestination }) {
  const info = destinationInfo(destination);
  const [flowers, sheet, tipoDeCambio] = await Promise.all([
    getPublicFlowersServer(),
    getPublishedPriceSheetServer(destination),
    // La general no lleva moneda local: no hace falta pedir el cambio.
    info.currency ? getTipoDeCambio() : Promise.resolve(undefined),
  ]);

  if (!sheet) return <NoSheet destination={destination} />;

  return (
    <PriceSheetView
      items={sheet.items}
      flowers={flowers}
      title={sheet.title}
      description={sheet.description}
      destination={destination}
      whatsappNumber={WHATSAPP_NUMBER}
      whatsappDisplay={WHATSAPP_DISPLAY}
      tipoDeCambio={tipoDeCambio}
    />
  );
}
