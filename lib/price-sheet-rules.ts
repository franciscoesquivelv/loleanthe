// Reglas de negocio de las hojas de precios, en funciones puras: sin red, sin
// Firebase, sin reloj. El admin las usa para decir qué va a pasar ANTES de
// confirmar, y las acciones de lib/priceSheets.ts para aplicarlas, así que lo
// que la pantalla promete y lo que se escribe salen de la misma cuenta.
import { destinationInfo, type PriceDestination } from './price-destinations';
import type { PriceItem, PriceSheet } from './priceSheets';
import { COUNTRIES, isAvailableIn, type Flower } from './types';

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
  // Las notas se imprimen al pie de cada hoja y ahí solo caben unas pocas.
  let desde = 0;
  repartir(hoja.items.length).forEach((n, h) => {
    const notas = hoja.items.slice(desde, desde + n).filter((i) => i.note).length;
    desde += n;
    if (notas > NOTAS_POR_HOJA) {
      warnings.push({
        code: 'DEMASIADAS_NOTAS',
        text: `Hay ${notas} notas en la hoja impresa ${h + 1}; entran ${NOTAS_POR_HOJA}.`,
      });
    }
  });
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

// ── Cómo se reparte la hoja al imprimir ────────────────────────────────────
//
// Una hoja impresa son 3 columnas por 3 filas, 9 flores, y cada hoja de papel es
// una página explícita (no el flujo natural de Chrome, donde una nota más
// empujaba una fila y todo se desacomodaba). 9 flores salen en 1 hoja; 18 salen
// en 2 de 9; nunca se corta una fila a la mitad.

export const COLUMNAS_IMPRESAS = 3;
export const FILAS_POR_HOJA = 3;
/** Notas al pie que caben en una hoja impresa antes de recortarse. */
export const NOTAS_POR_HOJA = 5;

/** Cuántas flores lleva cada hoja impresa. Las filas se reparten parejo entre
 *  las hojas, con las primeras cargando más: 10 -> [6, 4], 19 -> [9, 6, 4]. */
export function repartir(total: number): number[] {
  if (total <= 0) return [0];
  const filas = Math.ceil(total / COLUMNAS_IMPRESAS);
  const hojas = Math.ceil(filas / FILAS_POR_HOJA);
  const base = Math.floor(filas / hojas);
  const resto = filas % hojas;
  const salida: number[] = [];
  let restantes = total;
  for (let h = 0; h < hojas; h++) {
    const n = Math.min((base + (h < resto ? 1 : 0)) * COLUMNAS_IMPRESAS, restantes);
    salida.push(n);
    restantes -= n;
  }
  return salida;
}

// ── Qué flores llegan a qué destino ────────────────────────────────────────
//
// La lista de ítems de CADA hoja es la respuesta a "qué flores aplican a este
// país". El catálogo (`availableIn`) solo hace de guardia: sugiere primero las
// que llegan, avisa si se agrega una que el catálogo no marca para ese destino,
// pero no bloquea. La hoja es la oferta de un envío y `availableIn` un dato que
// se marcó una vez: cuando discrepan, suele estar más al día la hoja. Y no se
// filtra al mostrar la hoja pública: ocultar filas en silencio cambiaría una
// oferta ya publicada sin que nadie lo sepa.

type FlowerLite = Pick<Flower, 'id' | 'name' | 'availableIn'> & Partial<Pick<Flower, 'archived'>>;

/**
 * Cómo se ve una flor del catálogo respecto del destino de la hoja.
 * - `fuera`: el catálogo la marca solo para el otro país. Se atenúa y se avisa.
 * - Una flor SIN marcar (`availableIn` vacío) pasa cualquier filtro, igual que
 *   en el catálogo público (lib/types.ts): son las que se cargaron antes de que
 *   existiera el campo.
 * - En General no hay filtro; solo se aclara si es de un solo país.
 */
export function availabilityNote(
  flower: Pick<Flower, 'availableIn'>,
  destination: PriceDestination | null
): { fuera: boolean; text: string } {
  const marcadas = flower.availableIn ?? [];
  const info = destination ? destinationInfo(destination) : null;
  if (info?.country) {
    if (marcadas.length === 0) return { fuera: false, text: 'País sin marcar' };
    return isAvailableIn(flower as Flower, info.country)
      ? { fuera: false, text: '' }
      : { fuera: true, text: `No llega a ${info.label}` };
  }
  if (marcadas.length === 1) {
    return { fuera: false, text: `Solo ${COUNTRIES.find((c) => c.code === marcadas[0])?.label ?? marcadas[0]}` };
  }
  return { fuera: false, text: '' };
}

export const sinTildes = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Otras formas de escribir cada categoría, para que "rosa" o "ranunculo" la encuentren. */
export const CATEGORY_ALIASES: Record<string, string[]> = {
  rosas: ['rosa'],
  'rosas-garden': ['garden', 'rosa garden'],
  ranunculus: ['ranunculo', 'ranunculos'],
  fillers: ['filler', 'relleno'],
};

/** Cada palabra de la búsqueda tiene que aparecer en el texto (sin tildes ni mayúsculas). */
export function matchesQuery(texto: string, busqueda: string): boolean {
  const base = sinTildes(texto);
  return sinTildes(busqueda)
    .split(/\s+/)
    .filter(Boolean)
    .every((palabra) => base.includes(palabra));
}

/** Avisos al publicar: flores que el catálogo no marca para este destino, o que
 *  ya no están en el catálogo. No bloquean. */
export function availabilityWarnings(
  hoja: Pick<PriceSheet, 'destination' | 'items'>,
  flowers: FlowerLite[]
): SheetIssue[] {
  const info = hoja.destination ? destinationInfo(hoja.destination) : null;
  const porId = new Map(flowers.map((f) => [f.id, f]));
  const fuera: string[] = [];
  const inexistentes: string[] = [];
  for (const item of hoja.items) {
    if (!item.catalogFlowerId) continue; // sin enlace: no hay con qué comparar
    const f = porId.get(item.catalogFlowerId);
    if (!f || f.archived) inexistentes.push(item.name);
    else if (info?.country && availabilityNote(f, hoja.destination).fuera) fuera.push(item.name);
  }
  const out: SheetIssue[] = [];
  if (fuera.length > 0 && info) {
    out.push({
      code: 'FUERA_DE_DESTINO',
      text: `${fuera.length === 1 ? '1 flor no llega' : `${fuera.length} flores no llegan`} a ${info.label} según el catálogo: ${lista(fuera)}.`,
    });
  }
  if (inexistentes.length > 0) {
    out.push({
      code: 'FLOR_INEXISTENTE',
      text: `${inexistentes.length === 1 ? '1 flor ya no está' : `${inexistentes.length} flores ya no están`} en el catálogo y se verá sin enlace a su ficha: ${lista(inexistentes)}.`,
    });
  }
  return out;
}
