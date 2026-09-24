'use client';

/**
 * Abre el diálogo de impresión, donde el navegador ofrece "Guardar como PDF".
 * Se usa esto en vez de servir un PDF estático para que el archivo descargado
 * siempre refleje los precios actuales de `data.ts`, sin regenerar nada.
 */
export default function DownloadButton({ className = '' }: { className?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className={`label group inline-flex items-center gap-3 text-ink print:hidden ${className}`}
    >
      Descargar PDF
      <span className="h-px w-8 bg-ink transition-all duration-500 group-hover:w-14" />
    </button>
  );
}
