// Pegar una lista de precios tal como la manda la dueña ("Stock 9.90",
// "Rosas $18", una línea por flor) y convertirla en flores de una hoja.
//
// Funciones puras, sin red ni Firebase ni React, y SIN imports que no sean de
// tipos: así se prueban con `node --test` (ver lib/price-import.test.ts) y las
// importan por igual el admin y las reglas de la hoja.
//
// Lo que NO hace, a propósito: inventar tallos, largo o notas (solo trae
// nombre, precio por bunch en dólares y, si lo encuentra, el enlace al
// catálogo); ni borrar flores de la hoja que no aparezcan en lo pegado.
import type { PriceItem } from './priceSheets';

export const sinTildes = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Otras formas de escribir cada categoría, para que "rosa", "garden roses" o
 *  "ranúnculos" la encuentren (buscador del admin y lista pegada). */
export const CATEGORY_ALIASES: Record<string, string[]> = {
  rosas: ['rosa'],
  'rosas-garden': ['garden', 'rosa garden', 'garden rose', 'garden roses'],
  ranunculus: ['ranunculo', 'ranunculos'],
  fillers: ['filler', 'relleno'],
};

/** Lo que cabe en la tarjeta impresa: más largo se corta con "…". Es el mismo
 *  tope del campo Nombre del editor de una flor. */
export const MAX_NOMBRE = 30;
/** Tope de flores por hoja (lo exige firestore.rules). */
export const MAX_FLORES = 60;

// ── Leer el texto ─────────────────────────────────────────────────────────

export interface PastedRow {
  /** Número de línea del texto pegado, desde 1. */
  line: number;
  name: string;
  /** Precio del BUNCH en dólares. */
  price: number;
}

export interface PastedIgnored {
  line: number;
  text: string;
  reason: string;
}

export interface PasteParse {
  rows: PastedRow[];
  ignored: PastedIgnored[];
}

const SEPARADORES_FINALES = /[\s:=\-\u2013\u2014.·,|…_/]+$/;
const ADORNOS = /[*_~`]/g;
const VIÑETA = /^\s*(?:[-•*·▪●\u2013\u2014]|\d+[.)])\s+/;

// Un precio solo cuenta si NO viene pegado a otro número: "9.150" no es
// "50", es un dato raro que se avisa en vez de adivinarse.
const NUMERO = String.raw`(?<![\d.,])(\d{1,4}(?:[.,]\d{1,2})?)`;
const UNIDAD = String.raw`(?:\$|usd|d[oó]lares|c\/u|x\s*bunch|por\s*bunch|\/\s*bunch)?`;
const PRECIO_AL_FINAL = new RegExp(String.raw`(?:US\$|\$)?\s*${NUMERO}\s*${UNIDAD}\s*$`, 'i');
const SOLO_PRECIO = new RegExp(String.raw`^\s*(?:US\$|\$)?\s*${NUMERO}\s*${UNIDAD}\s*$`, 'i');

// Quetzales o colones por error: la lista es en dólares y mezclarlos publicaría
// un precio falso. Q85, Q 85, Q.85, ₡12000, 85 GTQ, 85 quetzales.
const MONEDA_LOCAL =
  /(?:^|[^a-z])q\.?\s*\d|₡|\d\s*(?:gtq|crc)\b|\b(?:gtq|crc|colones?|quetzales?)\b/i;

function aNumero(texto: string): number {
  return Number(texto.replace(',', '.'));
}

function limpiarNombre(texto: string): string {
  return texto
    .replace(ADORNOS, '')
    .replace(SEPARADORES_FINALES, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "stock" -> "Stock"; si ya trae mayúsculas, se respeta como lo escribió. */
function conMayuscula(nombre: string): string {
  return nombre === nombre.toLowerCase() ? nombre.charAt(0).toUpperCase() + nombre.slice(1) : nombre;
}

/**
 * Convierte el texto pegado en filas (nombre y precio por bunch) y en las
 * líneas que no se pudieron usar, cada una con su motivo para mostrárselo a
 * quien pegó. Una línea por flor; también sirve pegado desde una hoja de
 * cálculo (columnas separadas por tab) y con ";" entre flores.
 */
export function parsePastedList(texto: string): PasteParse {
  const rows: PastedRow[] = [];
  const ignored: PastedIgnored[] = [];
  const vistas = new Map<string, number>();

  texto.split(/\r?\n/).forEach((lineaCompleta, i) => {
    const line = i + 1;
    for (const trozo of lineaCompleta.split(';')) {
      const original = trozo.trim();
      if (!original) continue;
      const ignorar = (reason: string) => ignored.push({ line, text: original, reason });

      if (MONEDA_LOCAL.test(original)) {
        ignorar('Parece estar en quetzales o colones. Escribilo en dólares.');
        continue;
      }

      const sinViñeta = original.replace(VIÑETA, '');
      let nombreCrudo: string;
      let precioTexto: string | undefined;

      if (sinViñeta.includes('\t')) {
        const celdas = sinViñeta.split('\t').map((c) => c.trim()).filter(Boolean);
        nombreCrudo = celdas[0] ?? '';
        precioTexto = celdas.slice(1).map((c) => SOLO_PRECIO.exec(c)?.[1]).find(Boolean);
      } else {
        const m = PRECIO_AL_FINAL.exec(sinViñeta);
        precioTexto = m?.[1];
        nombreCrudo = m ? sinViñeta.slice(0, m.index) : sinViñeta;
      }

      if (!precioTexto) {
        ignorar('No tiene un precio al final.');
        continue;
      }
      const price = aNumero(precioTexto);
      if (!(price > 0)) {
        ignorar('El precio tiene que ser mayor que cero.');
        continue;
      }
      const name = limpiarNombre(nombreCrudo);
      if (!/[a-zñ]/i.test(name) || name.length < 2) {
        ignorar('No tiene el nombre de la flor.');
        continue;
      }
      if (name.length > MAX_NOMBRE) {
        ignorar(`El nombre pasa de ${MAX_NOMBRE} letras.`);
        continue;
      }

      // La misma flor dos veces: gana la última, como cuando se corrige un precio.
      const clave = clavePalabras(name);
      const anterior = vistas.get(clave);
      if (anterior !== undefined) {
        const previa = rows[anterior];
        ignored.push({ line: previa.line, text: previa.name, reason: 'Está repetida más abajo: se usa la última.' });
        rows[anterior] = { line, name, price };
      } else {
        vistas.set(clave, rows.length);
        rows.push({ line, name, price });
      }
    }
  });

  ignored.sort((a, b) => a.line - b.line);
  return { rows, ignored };
}

// ── Encontrar la flor del catálogo ────────────────────────────────────────

export interface ImportFlower {
  id: string;
  name: string;
  category?: string;
  archived?: boolean;
  images: string[];
}

export interface ImportCategory {
  slug: string;
  label: string;
  fallbackImage: string;
}

export type ImportMatch =
  | { kind: 'flor'; flowerId: string }
  | { kind: 'categoria'; slug: string }
  | { kind: 'ninguna' };

const palabras = (s: string) => sinTildes(s).replace(/[^a-z0-9]+/g, ' ').trim();

/** Plural simple a singular, para que "Claveles" encuentre "Clavel" y "Calas"
 *  a "Cala". Se aplica a los dos lados, así lo que no cambia sigue igual. */
function singular(p: string): string {
  if (p.length > 4 && p.endsWith('es')) return p.slice(0, -2);
  if (p.length > 3 && p.endsWith('s')) return p.slice(0, -1);
  return p;
}

function clavePalabras(s: string): string {
  return palabras(s).split(' ').filter(Boolean).map(singular).join(' ');
}

/**
 * A qué flor o categoría del catálogo corresponde un nombre escrito a mano.
 * En este orden: la flor con ese mismo nombre; la categoría (o su alias:
 * "Garden roses", "Ranúnculos"); la única flor cuyo nombre empieza con eso
 * ("Solidago" -> "Solidago Golden Glory"). Si hay duda, `ninguna`: la
 * pantalla deja elegir, nunca adivina entre dos.
 */
export function matchName(nombre: string, flores: ImportFlower[], categorias: ImportCategory[]): ImportMatch {
  const k = clavePalabras(nombre);
  if (!k) return { kind: 'ninguna' };
  const activas = flores.filter((f) => !f.archived);

  const iguales = activas.filter((f) => clavePalabras(f.name) === k);
  if (iguales.length > 0) return { kind: 'flor', flowerId: iguales[0].id };

  const categoria = categorias.find((c) =>
    [c.label, ...(CATEGORY_ALIASES[c.slug] ?? [])].some((a) => clavePalabras(a) === k)
  );
  if (categoria) return { kind: 'categoria', slug: categoria.slug };

  const prefijo = activas.filter((f) => {
    const fk = clavePalabras(f.name);
    return fk.startsWith(`${k} `) || k.startsWith(`${fk} `);
  });
  if (prefijo.length === 1) return { kind: 'flor', flowerId: prefijo[0].id };

  return { kind: 'ninguna' };
}

// ── Armar las flores de la hoja ───────────────────────────────────────────

export function slugDe(nombre: string): string {
  return (
    nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `item-${Date.now()}`
  );
}

/** Una fila lista para agregar: lo que se pegó, a qué se enlaza y si se usa. */
export interface ImportEntry {
  row: PastedRow;
  match: ImportMatch;
  incluir: boolean;
}

/** Qué le pasa a cada fila al aplicar: flor nueva, o precio de una que ya está. */
export type ImportAction =
  | { tipo: 'nueva' }
  | { tipo: 'actualiza'; index: number; antes: number | null };

/** Índice de la flor de la hoja que esta fila corrige, o -1 si es nueva: la
 *  misma flor del catálogo, la misma categoría, o el mismo nombre. */
export function findExisting(items: PriceItem[], row: PastedRow, match: ImportMatch): number {
  const k = clavePalabras(row.name);
  return items.findIndex(
    (i) =>
      (match.kind === 'flor' && i.catalogFlowerId === match.flowerId) ||
      (match.kind === 'categoria' && i.categorySlug === match.slug) ||
      clavePalabras(i.name) === k
  );
}

export function actionFor(items: PriceItem[], entry: ImportEntry): ImportAction {
  const index = findExisting(items, entry.row, entry.match);
  return index >= 0 ? { tipo: 'actualiza', index, antes: items[index].bunchPrice } : { tipo: 'nueva' };
}

export interface ImportResult {
  items: PriceItem[];
  agregadas: number;
  actualizadas: number;
}

/**
 * Aplica las filas incluidas sobre las flores de la hoja. Una flor que ya está
 * solo cambia de precio (conserva su foto, tallos, largo y nota); una nueva se
 * suma al final, sin tallos. Lo que la hoja ya tenía y no se pegó queda igual.
 */
export function applyImport(
  actuales: PriceItem[],
  entradas: ImportEntry[],
  flores: ImportFlower[],
  categorias: ImportCategory[]
): ImportResult {
  const items = [...actuales];
  const slugs = new Set(items.map((i) => i.slug));
  let agregadas = 0;
  let actualizadas = 0;

  for (const e of entradas) {
    if (!e.incluir) continue;
    const accion = actionFor(items, e);
    if (accion.tipo === 'actualiza') {
      items[accion.index] = { ...items[accion.index], bunchPrice: e.row.price };
      actualizadas++;
      continue;
    }

    const { match } = e;
    const flor = match.kind === 'flor' ? flores.find((f) => f.id === match.flowerId) : undefined;
    const categoria = match.kind === 'categoria' ? categorias.find((c) => c.slug === match.slug) : undefined;
    const name =
      flor && clavePalabras(flor.name) === clavePalabras(e.row.name) ? flor.name : conMayuscula(e.row.name);
    let slug = slugDe(name);
    for (let n = 2; slugs.has(slug); n++) slug = `${slugDe(name)}-${n}`;
    slugs.add(slug);
    const image = flor?.images[0] ?? categoria?.fallbackImage;

    items.push({
      slug,
      name,
      bunchPrice: e.row.price,
      ...(image && { image }),
      ...(flor && { catalogFlowerId: flor.id }),
      ...(categoria && { categorySlug: categoria.slug }),
    });
    agregadas++;
  }
  return { items, agregadas, actualizadas };
}

/** Flores que la hoja ya tenía y que lo pegado no menciona (no se tocan). */
export function notMentioned(actuales: PriceItem[], entradas: ImportEntry[]): string[] {
  const tocadas = new Set<number>();
  for (const e of entradas) {
    if (!e.incluir) continue;
    const a = actionFor(actuales, e);
    if (a.tipo === 'actualiza') tocadas.add(a.index);
  }
  return actuales.filter((_, i) => !tocadas.has(i)).map((i) => i.name);
}
