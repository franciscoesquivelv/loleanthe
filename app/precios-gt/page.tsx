import { priceMetadata } from '../precios/price-metadata';
import PricePage from '../precios/PricePage';

// Enlace directo que Francisco comparte con clientes, no una sección del sitio:
// no va en el nav (ver components/Header.tsx y Footer.tsx), no se lista en el
// sitemap y no se indexa. Muestra la hoja publicada de su destino y nada más.
export const generateMetadata = () => priceMetadata('GT');

export default function PreciosGuatemalaPage() {
  return <PricePage destination="GT" />;
}
