'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { ACCION_SUAVE, AVISO, BOTON } from './ui';

/**
 * Diálogo de confirmación. `<dialog>` nativo con `showModal()`: atrapa el foco,
 * deja el fondo inerte y cierra con ESC, sin librería.
 *
 * - El foco inicial va en Cancelar, nunca en la acción que cambia lo que ven
 *   los clientes.
 * - Los errores salen DENTRO del diálogo: un toast quedaría detrás del fondo
 *   (el diálogo vive en la capa superior).
 * - El relleno está en el `div` interior, no en el `<dialog>`: así un clic en
 *   el fondo oscuro cierra, y un clic en el relleno no.
 * - Lo destructivo no lleva rojo (no existe en el sistema): lo dicen las
 *   palabras del título y del botón.
 */
export default function ConfirmDialog({
  open,
  eyebrow,
  title,
  children,
  errores,
  avisos,
  confirmLabel,
  busyLabel = 'Un momento…',
  cancelLabel = 'Cancelar',
  secondaryLabel,
  onSecondary,
  busy = false,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  eyebrow: string;
  title: string;
  children?: ReactNode;
  /** Bloquean: el botón de confirmar queda deshabilitado. */
  errores?: string[];
  /** "Revisá antes de publicar": se confirman, no bloquean. */
  avisos?: string[];
  confirmLabel: string;
  busyLabel?: string;
  cancelLabel?: string;
  /** Tercera salida (ej. "Salir sin guardar"), entre confirmar y cancelar. */
  secondaryLabel?: string;
  onSecondary?: () => void;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const bloqueado = (errores?.length ?? 0) > 0;

  return (
    <dialog
      ref={ref}
      aria-labelledby="dlg-titulo"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md overflow-y-auto border border-ink bg-paper p-0 text-ink backdrop:bg-ink/60"
    >
      <div className="p-6 sm:p-8">
        <p className="label text-muted">{eyebrow}</p>
        <h2 id="dlg-titulo" className="mt-2 font-serif text-2xl font-light leading-tight text-ink">
          {title}
        </h2>

        {children && <div className="mt-4 space-y-3 text-[15px] leading-relaxed">{children}</div>}

        {errores && errores.length > 0 && (
          <ul className="mt-5 space-y-2">
            {errores.map((t) => (
              <li key={t} className={AVISO}>
                {t}
              </li>
            ))}
          </ul>
        )}

        {avisos && avisos.length > 0 && (
          <div className="mt-5">
            <p className="label text-muted">Revisá antes de publicar</p>
            <ul className="mt-2 border-t border-line">
              {avisos.map((t) => (
                <li key={t} className="border-b border-line py-2.5 text-[14px] leading-snug">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className={`${AVISO} mt-5`}>{error}</p>}

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-1">
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || bloqueado}
            className={BOTON}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button type="button" onClick={onSecondary} disabled={busy} className={ACCION_SUAVE}>
              {secondaryLabel}
            </button>
          )}
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className={ACCION_SUAVE}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
