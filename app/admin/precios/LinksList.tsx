'use client';

import { useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import type { PriceSheet } from '@/lib/priceSheets';
import {
  PRICE_DESTINATIONS,
  SIN_HOJA_TITULO,
  destinationInfo,
  urlDe,
  urlVisible,
  type PriceDestination,
} from '@/lib/price-destinations';
import { fechaDeInstante, haceTiempo, rangoFechas } from './format';
import { ACCION, ACCION_PRINC, ACCION_SUAVE, AVISO, BOTON, ETIQ_DESTINO } from './ui';

const flores = (n: number) => `${n} ${n === 1 ? 'flor' : 'flores'}`;

/** Lo que Francisco pega en un chat para mandar el enlace de ese país. */
function waLink(dest: PriceDestination): string {
  const para = dest === 'GENERAL' ? '' : ` para ${destinationInfo(dest).label}`;
  return `https://wa.me/?text=${encodeURIComponent(`Hola, te comparto la lista de precios de Loleanthe${para}: ${urlDe(dest)}`)}`;
}

/** Segunda fila de acciones, escondida tras "Más" para que la fila no se llene
 *  de verbos. */
function Mas({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button type="button" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)} className={ACCION_SUAVE}>
        Más {abierto ? '-' : '+'}
      </button>
      {abierto && <div className="flex basis-full flex-wrap items-center gap-x-6">{children}</div>}
    </>
  );
}

function Estado({ vivo }: { vivo: boolean }) {
  return (
    <p className={`label inline-flex items-center gap-2 ${vivo ? 'text-ink' : 'text-muted'}`}>
      <span className={vivo ? 'h-1.5 w-1.5 bg-ink' : 'h-1.5 w-1.5 border border-muted'} aria-hidden />
      {vivo ? 'En vivo' : 'Sin hoja'}
    </p>
  );
}

/**
 * La lista de precios, organizada por ENLACE y no por hoja: quien manda
 * precios piensa "qué le mando al cliente de Guatemala", no "cuál de mis
 * hojas". Los tres enlaces están siempre, tengan hoja o no; abajo van los
 * borradores y las archivadas.
 */
export default function LinksList({
  sheets,
  onNueva,
  onEditar,
  onDuplicar,
  onPublicar,
  onQuitar,
  onEliminar,
}: {
  sheets: PriceSheet[];
  onNueva: (destination?: PriceDestination) => void;
  onEditar: (sheet: PriceSheet) => void;
  onDuplicar: (sheet: PriceSheet) => void;
  /** Publica un borrador o vuelve a publicar una archivada en SU destino. */
  onPublicar: (sheet: PriceSheet) => void;
  /** Pasa una publicada a archivada: el enlace queda sin hoja. */
  onQuitar: (sheet: PriceSheet) => void;
  onEliminar: (sheet: PriceSheet) => void;
}) {
  const [copiado, setCopiado] = useState<PriceDestination | null>(null);

  const copiar = async (dest: PriceDestination) => {
    try {
      await navigator.clipboard.writeText(urlDe(dest));
      setCopiado(dest);
      setTimeout(() => setCopiado((c) => (c === dest ? null : c)), 2000);
    } catch {
      // Algunos navegadores embebidos niegan el portapapeles: se deja el
      // enlace seleccionado para copiarlo a mano.
      const el = document.getElementById(`url-${dest}`);
      if (el) {
        const rango = document.createRange();
        rango.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(rango);
      }
      toast('Mantené presionado el enlace para copiarlo');
    }
  };

  const publicadas = sheets
    .filter((s) => s.status === 'published')
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
  const vivasDe = (d: PriceDestination) => publicadas.filter((s) => s.destination === d);
  const sinDestino = publicadas.filter((s) => !s.destination);
  const borradores = sheets.filter((s) => s.status === 'draft');
  const archivadas = sheets.filter((s) => s.status === 'archived');
  const borradoresDe = (d: PriceDestination) => borradores.filter((s) => s.destination === d);

  const etiquetaDestino = (s: PriceSheet) => (s.destination ? destinationInfo(s.destination).label : 'Sin destino');

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-serif text-3xl font-light text-ink">Precios</h1>
        <button type="button" onClick={() => onNueva()} className={BOTON}>
          + Nueva hoja
        </button>
      </div>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
        Cada enlace muestra una sola hoja. Si publicás otra en el mismo enlace, la anterior pasa a archivadas, no se borra.
      </p>

      {sinDestino.map((s) => (
        <div key={s.id} className={`${AVISO} mt-8`}>
          «{s.title}» está publicada pero no tiene destino, así que no sale en ningún enlace.{' '}
          <button type="button" onClick={() => onEditar(s)} className="underline underline-offset-4">
            Elegir destino
          </button>
        </div>
      ))}

      <h2 className="label mt-12 text-muted">Enlaces para clientes</h2>
      <ul className="mt-4 border-t border-line">
        {PRICE_DESTINATIONS.map(({ code }) => {
          const info = destinationInfo(code);
          const [viva, ...otras] = vivasDe(code);
          const borradoresAca = borradoresDe(code);
          return (
            <li key={code} className="border-b border-line py-7">
              <div className="flex items-center justify-between gap-4">
                <p className="label text-muted">{info.label}</p>
                <Estado vivo={!!viva} />
              </div>
              <p
                id={`url-${code}`}
                className={`mt-2 break-all font-serif text-[26px] font-light leading-tight ${viva ? 'text-ink' : 'text-muted'}`}
              >
                {urlVisible(code)}
              </p>

              {viva ? (
                <>
                  <div className="mt-1 flex flex-wrap items-center gap-x-6">
                    <button type="button" onClick={() => copiar(code)} aria-label={`Copiar el enlace ${info.deLa}`} className={ACCION}>
                      {copiado === code ? 'Copiado' : 'Copiar'}
                    </button>
                    <a href={urlDe(code)} target="_blank" rel="noopener noreferrer" className={ACCION}>
                      Abrir
                    </a>
                    <a href={waLink(code)} target="_blank" rel="noopener noreferrer" className={ACCION}>
                      WhatsApp
                    </a>
                  </div>

                  <div className="mt-2 border-t border-line pt-4">
                    <p className="font-serif text-lg font-light text-ink">{viva.title}</p>
                    <p className="label mt-1 text-muted">
                      {[
                        flores(viva.items.length),
                        rangoFechas(viva.dateStart, viva.dateEnd),
                        viva.publishedAt && `Publicada el ${fechaDeInstante(viva.publishedAt)}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-6">
                      <button type="button" onClick={() => onEditar(viva)} className={ACCION}>
                        Editar
                      </button>
                      <button type="button" onClick={() => onDuplicar(viva)} className={ACCION_SUAVE}>
                        Duplicar como borrador
                      </button>
                      <Mas>
                        <button type="button" onClick={() => onQuitar(viva)} className={ACCION_SUAVE}>
                          Quitar {info.deLa}
                        </button>
                      </Mas>
                    </div>
                  </div>

                  {otras.map((o) => (
                    <div key={o.id} className={`${AVISO} mt-4`}>
                      Hay otra hoja publicada en este enlace: «{o.title}». Solo se muestra la más reciente.{' '}
                      <button type="button" onClick={() => onQuitar(o)} className="underline underline-offset-4">
                        Archivar la otra
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
                    Quien abra este enlace hoy ve «{SIN_HOJA_TITULO}».
                  </p>
                  {borradoresAca.length > 0 ? (
                    <>
                      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink">
                        Tenés {borradoresAca.length === 1 ? '1 borrador' : `${borradoresAca.length} borradores`} para{' '}
                        {info.label}: «{borradoresAca[0].title}», {flores(borradoresAca[0].items.length)}.
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-8">
                        <button type="button" onClick={() => onPublicar(borradoresAca[0])} className={ACCION_PRINC}>
                          Publicar el borrador
                          <span className="h-px w-8 bg-ink transition-all duration-500 group-hover:w-14" />
                        </button>
                        <button type="button" onClick={() => onNueva(code)} className={ACCION_SUAVE}>
                          Crear otra hoja
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-1">
                      <button type="button" onClick={() => onNueva(code)} className={ACCION_PRINC}>
                        Crear la hoja {info.hojaDe}
                        <span className="h-px w-8 bg-ink transition-all duration-500 group-hover:w-14" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>

      {borradores.length > 0 && (
        <section className="mt-14">
          <h2 className="label text-muted">Borradores ({borradores.length})</h2>
          <ul className="mt-4 border-t border-line">
            {borradores.map((s) => {
              const ocupante = s.destination ? vivasDe(s.destination)[0] : undefined;
              return (
                <li key={s.id} className="border-b border-line py-6">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <p className="font-serif text-xl font-light text-ink">{s.title}</p>
                    <span className={ETIQ_DESTINO}>{etiquetaDestino(s)}</span>
                  </div>
                  <p className="label mt-1 text-muted">
                    {[flores(s.items.length), rangoFechas(s.dateStart, s.dateEnd), s.updatedAt && `Editada ${haceTiempo(s.updatedAt)}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {ocupante && (
                    <p className="mt-2 text-[14px] text-muted">Al publicar reemplaza «{ocupante.title}».</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-6">
                    <button type="button" onClick={() => onEditar(s)} className={ACCION}>
                      Editar
                    </button>
                    {s.destination ? (
                      <button type="button" onClick={() => onPublicar(s)} className={ACCION}>
                        Publicar {destinationInfo(s.destination).en}
                      </button>
                    ) : (
                      <button type="button" onClick={() => onEditar(s)} className={ACCION}>
                        Elegir destino
                      </button>
                    )}
                    <Mas>
                      {s.destination && (
                        <button type="button" onClick={() => onDuplicar(s)} className={ACCION_SUAVE}>
                          Duplicar
                        </button>
                      )}
                      <button type="button" onClick={() => onEliminar(s)} className={ACCION_SUAVE}>
                        Eliminar
                      </button>
                    </Mas>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {archivadas.length > 0 && (
        <details className="group mt-14 border-t border-line">
          <summary className="label flex min-h-11 cursor-pointer list-none items-center justify-between text-muted [&::-webkit-details-marker]:hidden">
            <span>Archivadas ({archivadas.length})</span>
            <span aria-hidden className="group-open:hidden">+</span>
            <span aria-hidden className="hidden group-open:inline">-</span>
          </summary>
          <ul className="border-t border-line">
            {archivadas.map((s) => (
              <li key={s.id} className="border-b border-line py-6">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <p className="font-serif text-xl font-light text-ink">{s.title}</p>
                  <span className={ETIQ_DESTINO}>{etiquetaDestino(s)}</span>
                </div>
                <p className="label mt-1 text-muted">
                  {[flores(s.items.length), s.publishedAt && `Publicada el ${fechaDeInstante(s.publishedAt)}`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-6">
                  <button type="button" onClick={() => onEditar(s)} className={ACCION}>
                    Editar
                  </button>
                  {s.destination ? (
                    <button type="button" onClick={() => onPublicar(s)} className={ACCION}>
                      Publicar de nuevo {destinationInfo(s.destination).en}
                    </button>
                  ) : (
                    <button type="button" onClick={() => onEditar(s)} className={ACCION}>
                      Elegir destino
                    </button>
                  )}
                  <Mas>
                    {s.destination && (
                      <button type="button" onClick={() => onDuplicar(s)} className={ACCION_SUAVE}>
                        Duplicar
                      </button>
                    )}
                    <button type="button" onClick={() => onEliminar(s)} className={ACCION_SUAVE}>
                      Eliminar
                    </button>
                  </Mas>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
