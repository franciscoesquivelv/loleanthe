// Reglas de negocio de las hojas de precios, en funciones puras: sin red, sin
// Firebase, sin reloj. El admin las usa para decir qué va a pasar ANTES de
// confirmar, y las acciones de lib/priceSheets.ts para aplicarlas, así que lo
// que la pantalla promete y lo que se escribe salen de la misma cuenta.
import type { PriceDestination } from './price-destinations';
import type { PriceItem, PriceSheet } from './priceSheets';

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

// ── El precio de un ítem: por bunch ───────────────────────────────────────
//
// La fuente de verdad es el precio del BUNCH, que es lo que dicen las listas y
// lo que se muestra en grande. El precio por tallo se DERIVA y nunca se guarda:
// dos verdades era justo el problema. Con el precio por tallo guardado,
// Stock y Eryngium ($11.35 el bunch de 10, o sea $1.135 por tallo) no cabían
// en dos decimales, quien redondeaba a $1.14 publicaba $11.40, y cambiar los
// tallos de un ítem movía su precio sin que nadie lo decidiera.

const aDosDecimales = (n: number) => Math.round(n * 100) / 100;

/**
 * Arma un ítem desde lo guardado (SDK del admin o REST del servidor): un solo
 * lugar para los dos, así no pueden leer distinto.
 *
 * - Acepta la forma vieja (`price` por tallo): la convierte a bunch con la misma
 *   cuenta que hacía la hoja pública (`price x tallos`, a centavos), así lo que
 *   ve el cliente no cambia.
 * - Devuelve solo los campos que existen y nunca un `undefined`: Firestore lo
 *   rechaza al escribir. Descarta lo que quede de versiones viejas.
 * - `stemsPerBunch` ausente = se vende por peso, sin cantidad fija.
 */
export function readItem(raw: Record<string, unknown>): PriceItem {
  const texto = (v: unknown) => (typeof v === 'string' && v !== '' ? v : undefined);
  const tallos = Number(raw.stemsPerBunch);
  const stemsPerBunch = Number.isInteger(tallos) && tallos >= 1 ? tallos : undefined;
  let bunchPrice: number | null = null;
  if (typeof raw.bunchPrice === 'number') bunchPrice = raw.bunchPrice;
  else if (typeof raw.price === 'number' && stemsPerBunch) bunchPrice = aDosDecimales(raw.price * stemsPerBunch);
  const size = texto(raw.size);
  const image = texto(raw.image);
  const catalogFlowerId = texto(raw.catalogFlowerId);
  const categorySlug = texto(raw.categorySlug);
  const note = texto(raw.note);
  return {
    slug: texto(raw.slug) ?? '',
    name: texto(raw.name) ?? '',
    bunchPrice,
    ...(stemsPerBunch && { stemsPerBunch }),
    ...(size && { size }),
    ...(image && { image }),
    ...(catalogFlowerId && { catalogFlowerId }),
    ...(categorySlug && { categorySlug }),
    ...(note && { note }),
  };
}

/** Precio por tallo, derivado. `null` sin precio o sin cantidad fija de tallos. */
export function stemPrice(item: Pick<PriceItem, 'bunchPrice' | 'stemsPerBunch'>): number | null {
  return item.bunchPrice != null && item.stemsPerBunch ? item.bunchPrice / item.stemsPerBunch : null;
}

/** El precio por tallo listo para mostrar. `approx` cuando redondeado a centavos
 *  ya no multiplica de vuelta al bunch (11.35 / 10 = 1.135 se muestra "≈ $1.14"). */
export function stemPriceLabel(
  item: Pick<PriceItem, 'bunchPrice' | 'stemsPerBunch'>
): { text: string; approx: boolean } | null {
  const sp = stemPrice(item);
  if (sp == null) return null;
  const redondeado = aDosDecimales(sp);
  const exacto = Math.abs(redondeado * item.stemsPerBunch! - item.bunchPrice!) < 0.005;
  return { text: redondeado.toFixed(2), approx: !exacto };
}

export type ParsedMoney = { ok: true; value: number | null } | { ok: false; error: string };

/**
 * Lo que se escribió en un campo de precio. Acepta coma decimal ("11,35") y un
 * "$" suelto; vacío es válido y quiere decir "Precio a confirmar". Cualquier
 * otra cosa se rechaza con un mensaje: nunca se corrige en silencio.
 */
export function parseMoneyInput(texto: string, decimales = 2): ParsedMoney {
  const limpio = texto.replace(/[$\s]/g, '').replace(',', '.');
  if (limpio === '') return { ok: true, value: null };
  if (!new RegExp(`^\\d{1,4}(\\.\\d{1,${decimales}})?$`).test(limpio)) {
    return { ok: false, error: `Escribí solo números, por ejemplo ${decimales === 2 ? '11.35' : '1.135'}` };
  }
  const value = Number(limpio);
  if (!(value > 0)) return { ok: false, error: 'El precio tiene que ser mayor que cero' };
  return { ok: true, value };
}

/** Precio por tallo razonable para una flor de mayoreo, en USD. Fuera de esto es
 *  casi seguro un precio de bunch en el campo de tallo, o al revés. */
export const STEM_PRICE_RANGE = { min: 0.4, max: 6 } as const;
/** Sin cantidad fija de tallos se compara el bunch entero. */
export const BUNCH_PRICE_RANGE = { min: 3, max: 150 } as const;

/** `null` = dentro de lo habitual. Solo avisa, nunca bloquea: un precio especial
 *  existe. */
export function priceRange(item: Pick<PriceItem, 'bunchPrice' | 'stemsPerBunch'>): 'bajo' | 'alto' | null {
  if (item.bunchPrice == null) return null;
  const sp = stemPrice(item);
  const { min, max } = sp != null ? STEM_PRICE_RANGE : BUNCH_PRICE_RANGE;
  const valor = sp ?? item.bunchPrice;
  return valor < min ? 'bajo' : valor > max ? 'alto' : null;
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

  // Los tallos son opcionales (por peso); si están, tienen que ser un entero >= 1.
  const sinTallos = hoja.items.filter(
    (i) => i.stemsPerBunch !== undefined && (!Number.isInteger(i.stemsPerBunch) || i.stemsPerBunch < 1)
  );
  if (sinTallos.length > 0) {
    errors.push({
      code: 'TALLOS_INVALIDOS',
      text: `Revisá los tallos por bunch de: ${lista(sinTallos.map((i) => i.name))}.`,
    });
  }

  const precioMalo = hoja.items.filter((i) => i.bunchPrice != null && !(Number.isFinite(i.bunchPrice) && i.bunchPrice > 0));
  if (precioMalo.length > 0) {
    errors.push({
      code: 'PRECIO_INVALIDO',
      text: `El precio de ${lista(precioMalo.map((i) => i.name))} no es válido.`,
    });
  }

  const sinPrecio = hoja.items.filter((i) => i.bunchPrice == null);
  if (sinPrecio.length > 0) {
    warnings.push({
      code: 'SIN_PRECIO',
      text: `${sinPrecio.length === 1 ? '1 flor sale' : `${sinPrecio.length} flores salen`} como «Precio a confirmar»: ${lista(sinPrecio.map((i) => i.name))}.`,
    });
  }
  const raros = hoja.items.filter((i) => priceRange(i) !== null);
  if (raros.length > 0) {
    const detalle = raros.map((i) => {
      const sp = stemPriceLabel(i);
      return `${i.name}, $${i.bunchPrice!.toFixed(2)} por bunch${sp ? ` (${sp.approx ? '≈ ' : ''}$${sp.text} por tallo)` : ''}`;
    });
    warnings.push({
      code: 'PRECIO_RARO',
      text: `${raros.length === 1 ? '1 precio fuera' : `${raros.length} precios fuera`} de lo habitual: ${detalle.join('; ')}.`,
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
