'use client';

import { useState } from 'react';
import { parseMoneyInput } from '@/lib/price-sheet-rules';

/**
 * El precio por bunch de una flor, editable en la misma fila de la hoja: corregir
 * un precio es tocarlo, escribir y pasar al siguiente, sin abrir la flor.
 *
 * Escribe en el formulario de la hoja (queda "sin guardar", como todo lo demás)
 * al salir del campo o con Enter, y solo si es un precio válido: lo que no se
 * entiende se dice ahí mismo y no se corrige en silencio. El padre lo vuelve a
 * montar (`key`) cuando el precio cambia por otro lado, así nunca muestra uno viejo.
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
  const [texto, setTexto] = useState(valor != null ? valor.toFixed(2) : '');
  const [error, setError] = useState('');

  const confirmar = () => {
    const r = parseMoneyInput(texto);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError('');
    if (r.value !== valor) onCambiar(r.value);
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
          onChange={(e) => setTexto(e.target.value)}
          onBlur={confirmar}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          className="w-20 border-0 bg-transparent py-1 font-serif text-xl font-light text-ink placeholder:text-muted focus-visible:outline-none!"
        />
        <span className="text-[13px] text-muted">por bunch</span>
      </div>
      {error && <p className="mt-1 text-[13px] text-ink">{error}</p>}
    </div>
  );
}
