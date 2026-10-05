import { fechaDelCambio, type TipoDeCambio } from '@/lib/exchange-rate';
import { destinationInfo, type PriceDestination } from '@/lib/price-destinations';

/**
 * "Referencia en colones: US$1 = ₡457, al 2 oct 2026." Siempre con la fecha de la
 * tasa. `null` en General, que no lleva moneda local. No repite "Precios en
 * dólares (USD)": eso ya lo dice la descripción de la hoja.
 */
export function notaMoneda(destination: PriceDestination, tc?: TipoDeCambio): string | null {
  const info = destinationInfo(destination);
  if (!info.currency || !tc) return null;
  const tasa = info.country === 'CR' ? String(Math.round(tc.crc)) : tc.gtq.toFixed(2);
  const fecha = fechaDelCambio(tc.fecha);
  return `Referencia en ${info.currency.name}: US$1 = ${info.currency.symbol}${tasa}${fecha ? `, al ${fecha}` : ''}.`;
}
