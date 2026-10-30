// El nombre y el cierre por defecto de una hoja nueva: una temporada, con el
// mismo estilo con que se llaman las listas ("Temporada Octubre - Diciembre").
//
// Sin imports a propósito, para probarlo con `node --test` (lib/temporada.test.ts).
// Las fechas son "YYYY-MM-DD" y se arman con componentes locales, nunca con
// `new Date('2026-10-30')`, que es medianoche UTC y en Costa Rica cae el día 29.

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/** Último día del mes en que termina la temporada: el mes de `hoy` más dos, o
 *  sea tres meses contando el actual. "2026-10-30" -> "2026-12-31". */
export function finDeTemporada(hoy: string): string {
  const [a, m] = hoy.split('-').map(Number);
  const fin = new Date(a, m - 1 + 3, 0);
  return `${fin.getFullYear()}-${String(fin.getMonth() + 1).padStart(2, '0')}-${String(fin.getDate()).padStart(2, '0')}`;
}

/** "Temporada Octubre - Diciembre", o "Temporada Octubre" si es un solo mes.
 *  Vacío si las fechas no son válidas: mejor no sugerir nada que inventar. */
export function nombreDeTemporada(desde: string, hasta: string): string {
  const mes = (iso: string) => {
    const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(iso);
    return m ? { a: Number(m[1]), i: Number(m[2]) - 1 } : null;
  };
  const d = mes(desde);
  const h = mes(hasta);
  if (!d || !h || d.i < 0 || d.i > 11 || h.i < 0 || h.i > 11) return '';
  return d.a === h.a && d.i === h.i
    ? `Temporada ${MESES[d.i]}`
    : `Temporada ${MESES[d.i]} - ${MESES[h.i]}`;
}
