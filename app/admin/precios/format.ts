// Fechas del panel de precios.
//
// Trampa conocida: `new Date('2026-09-28')` es medianoche UTC, que en Costa
// Rica es el 27. Las fechas "YYYY-MM-DD" de la hoja se arman siempre con
// componentes locales, nunca con el constructor de texto.

const ZONA = 'America/Costa_Rica';

function desdeIsoDia(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** "1 oct" a partir de "2026-10-01". */
export function fechaCorta(iso: string): string {
  const d = desdeIsoDia(iso);
  return d ? d.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' }).replace('.', '') : iso;
}

/** "1 oct a 31 dic 2026" (el año una sola vez si es el mismo). */
export function rangoFechas(desde: string, hasta: string): string {
  const a = desdeIsoDia(desde);
  const b = desdeIsoDia(hasta);
  if (!a || !b) return [desde, hasta].filter(Boolean).join(' a ');
  const año = (d: Date) => d.getFullYear();
  return año(a) === año(b)
    ? `${fechaCorta(desde)} a ${fechaCorta(hasta)} ${año(b)}`
    : `${fechaCorta(desde)} ${año(a)} a ${fechaCorta(hasta)} ${año(b)}`;
}

/** "28 sept" a partir de un instante ISO (publishedAt). */
export function fechaDeInstante(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', timeZone: ZONA }).replace('.', '');
}

/** "hace 2 h", "hace 3 días". */
export function haceTiempo(iso: string | undefined, ahora = Date.now()): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const seg = Math.round((t - ahora) / 1000);
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const tramos: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unidad, s] of tramos) {
    if (Math.abs(seg) >= s) return rtf.format(Math.round(seg / s), unidad);
  }
  return 'hace un momento';
}
