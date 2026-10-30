'use client';

import { useState } from 'react';
import { parseMoneyInput } from '@/lib/price-sheet-rules';

const formato = (v: number | null) => (v != null ? v.toFixed(2) : '');

/**
 * El precio por bunch de una flor, editable en la misma fila de la hoja: corregir
 * un precio es tocarlo y escribir, sin abrir la flor.
 *
 * Escribe en el formulario de la hoja (queda "sin guardar") MIENTRAS se escribe,
 * apenas lo escrito es un precio válido. Antes solo lo hacía al salir del campo, y
 * el teclado decimal del iPhone no tiene Enter ni forma obvia de salir: la barra
 * de abajo no mostraba "Guardar" hasta que se tocaba otra cosa.
 *
 * Lo que está a medias ("11.") no se manda y tampoco se marca como error: el aviso
 * sale al salir del campo, y ahí se acomoda el formato ("11,4" queda "11.40").
 */
export default function PrecioEnLinea({
  nombre,
  valor,
  onCambiar,
}: {
  nombre: string;
  valor: number | null;
  onCambiar: (precio: number | null) => void;
}) {
  const [texto, setTexto] = useState(formato(valor));
  const [error, setError] = useState('');
  const [valorVisto, setValorVisto] = useState(valor);

  // Si el precio cambió por otro lado (pegar una lista, por ejemplo) y no coincide
  // con lo escrito, se muestra el nuevo: nunca queda un número viejo en pantalla.
  if (valor !== valorVisto) {
    setValorVisto(valor);
    const escrito = parseMoneyInput(texto);
    if (!(escrito.ok && escrito.value === valor)) {
      setTexto(formato(valor));
      setError('');
    }
  }

  const alEscribir = (nuevo: string) => {
    setTexto(nuevo);
    setError('');
    const r = parseMoneyInput(nuevo);
    if (r.ok && r.value !== valor) onCambiar(r.value);
  };

  const alSalir = () => {
    const r = parseMoneyInput(texto);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError('');
    setTexto(formato(r.value));
  };

  return (
    <div>
      <div className="flex items-baseline gap-2 border-b border-muted/80 transition-colors focus-within:border-ink">
        <span className="font-serif text-xl font-light text-muted">$</span>
        <input
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          aria-label={`Precio por bunch de ${nombre}, en dólares`}
          aria-invalid={error ? true : undefined}
          value={texto}
          onChange={(e) => alEscribir(e.target.value)}
          onBlur={alSalir}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          className="min-h-11 w-24 border-0 bg-transparent py-1 font-serif text-xl font-light text-ink placeholder:text-muted"
        />
        <span className="text-[13px] text-muted">por bunch</span>
      </div>
      {error && <p className="mt-1 text-[13px] text-ink">{error}</p>}
    </div>
  );
}
