'use client';

import { useState, type ReactNode } from 'react';
import { ACCION_SUAVE } from './ui';

/** Segunda fila de acciones, escondida tras "Más" para que la fila no se llene de
 *  verbos y lo destructivo no quede pegado a lo de todos los días. */
export default function Mas({ children }: { children: ReactNode }) {
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
