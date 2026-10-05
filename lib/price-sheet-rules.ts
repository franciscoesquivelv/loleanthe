// Reglas de negocio de las hojas de precios, en funciones puras: sin red, sin
// Firebase, sin reloj. El admin las usa para decir qué va a pasar ANTES de
// confirmar, y las acciones de lib/priceSheets.ts para aplicarlas, así que lo
// que la pantalla promete y lo que se escribe salen de la misma cuenta.
import type { PriceDestination } from './price-destinations';
import type { PriceSheet } from './priceSheets';

type Placement = Pick<PriceSheet, 'id' | 'status' | 'destination'>;

/**
 * Qué cambia en los enlaces si `hoja` queda (o se queda) viva en `destino`.
 *
 * - `replaces`: hojas hoy publicadas en ese destino que pasarían a archivadas.
 *   Más de una solo si el dato ya estaba roto (dos publicadas en el mismo
 *   destino): en ese caso se limpian todas, no solo una.
 * - `vacates`: destino que se queda sin hoja porque la que estaba ahí se mueve
 *   a otro. Solo existe al mover una hoja YA publicada.
 *
 * `publicando` distingue publicar un borrador o archivada (queda viva) de
 * mover solo el destino de una hoja que no está viva (no desplaza a nadie).
 */
export function planPlacement(
  hojas: Placement[],
  hoja: Placement,
  destino: PriceDestination,
  publicando: boolean
): { replaces: string[]; vacates: PriceDestination | null } {
  const quedaViva = publicando || hoja.status === 'published';
  const replaces = quedaViva
    ? hojas
        .filter((s) => s.id !== hoja.id && s.status === 'published' && s.destination === destino)
        .map((s) => s.id)
    : [];
  const vacates =
    !publicando && hoja.status === 'published' && hoja.destination && hoja.destination !== destino
      ? hoja.destination
      : null;
  return { replaces, vacates };
}

/** "YYYY-MM-DD" de hoy con la fecha LOCAL (no UTC: después de las 6 pm en
 *  Costa Rica, `toISOString()` ya diría mañana). Es lo único de este archivo
 *  que mira el reloj, y lo hace quien llama, no `checkSheet`. */
export function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Validación antes de publicar ─────────────────────────────────────────

export interface SheetIssue {
  code: string;
  text: string;
}

export interface SheetCheck {
  /** Bloquean: la hoja no se puede publicar con alguno. */
  errors: SheetIssue[];
  /** Se muestran y se confirman, pero no bloquean. */
  warnings: SheetIssue[];
}

type Checkable = Pick<PriceSheet, 'destination' | 'items' | 'dateStart' | 'dateEnd'>;

function lista(nombres: string[]): string {
  return nombres.length <= 3 ? nombres.join(', ') : `${nombres.slice(0, 3).join(', ')} y ${nombres.length - 3} más`;
}

/**
 * `hoy` llega como "YYYY-MM-DD" desde quien llama: la función no mira el reloj,
 * así se puede probar con cualquier fecha.
 */
export function checkSheet(hoja: Checkable, hoy: string): SheetCheck {
  const errors: SheetIssue[] = [];
  const warnings: SheetIssue[] = [];

  if (!hoja.destination) {
    errors.push({ code: 'SIN_DESTINO', text: 'Elegí para quién es la hoja.' });
  }
  if (hoja.items.length === 0) {
    errors.push({ code: 'SIN_FLORES', text: 'Agregá al menos una flor.' });
  }
  if (hoja.dateStart && hoja.dateEnd && hoja.dateEnd < hoja.dateStart) {
    errors.push({ code: 'FECHAS_INVERTIDAS', text: 'La fecha final es anterior a la inicial.' });
  }

  // `key={item.slug}` en la hoja pública mezcla dos tarjetas con el mismo slug.
  const vistos = new Set<string>();
  const repetidos = new Set<string>();
  for (const item of hoja.items) {
    if (vistos.has(item.slug)) repetidos.add(item.name);
    vistos.add(item.slug);
  }
  if (repetidos.size > 0) {
    errors.push({
      code: 'SLUG_REPETIDO',
      text: `Hay dos flores con el mismo nombre: ${lista([...repetidos])}. Cambiá una.`,
    });
  }

  const sinTallos = hoja.items.filter((i) => !Number.isInteger(i.stemsPerBunch) || i.stemsPerBunch < 1);
  if (sinTallos.length > 0) {
    errors.push({
      code: 'TALLOS_INVALIDOS',
      text: `Revisá los tallos por bunch de: ${lista(sinTallos.map((i) => i.name))}.`,
    });
  }

  const precioMalo = hoja.items.filter((i) => i.price != null && !(Number.isFinite(i.price) && i.price > 0));
  if (precioMalo.length > 0) {
    errors.push({
      code: 'PRECIO_INVALIDO',
      text: `El precio de ${lista(precioMalo.map((i) => i.name))} no es válido.`,
    });
  }

  const sinPrecio = hoja.items.filter((i) => i.price == null);
  if (sinPrecio.length > 0) {
    warnings.push({
      code: 'SIN_PRECIO',
      text: `${sinPrecio.length === 1 ? '1 flor sale' : `${sinPrecio.length} flores salen`} como «Precio a confirmar»: ${lista(sinPrecio.map((i) => i.name))}.`,
    });
  }
  if (hoja.dateEnd && hoja.dateEnd < hoy) {
    warnings.push({ code: 'VENCIDA', text: `Las fechas de esta hoja ya pasaron (hasta el ${hoja.dateEnd}).` });
  }

  return { errors, warnings };
}

// ── Errores de las acciones ──────────────────────────────────────────────

export type PriceSheetErrorCode =
  | 'HOJA_NO_ENCONTRADA'
  | 'SIN_DESTINO'
  | 'DESTINO_INVALIDO'
  | 'HOJA_INVALIDA'
  | 'REEMPLAZO_NO_CONFIRMADO'
  | 'NO_SE_PUEDE_BORRAR_PUBLICADA';

/** Error de dominio: el admin lo reconoce por `code` y dice qué pasó en español,
 *  en vez de mostrar un mensaje técnico. */
export class PriceSheetError extends Error {
  code: PriceSheetErrorCode;
  detail?: unknown;
  constructor(code: PriceSheetErrorCode, detail?: unknown) {
    super(code);
    this.name = 'PriceSheetError';
    this.code = code;
    this.detail = detail;
  }
}
