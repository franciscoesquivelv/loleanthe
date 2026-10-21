'use client';

import Image, { type ImageProps } from 'next/image';
import { useState, type ReactNode } from 'react';

type Props = Omit<ImageProps, 'src'> & {
  src: string;
  /** Lo que se ve si la foto no carga. */
  fallback: ReactNode;
};

/**
 * `next/image` para las fotos del catálogo, que viven en Firebase Storage.
 * Si una foto no carga (Storage caído, facturación del proyecto suspendida,
 * archivo borrado) el navegador pinta el ícono de imagen rota con el texto
 * alternativo suelto. Se cambia por `fallback`, el mismo recuadro que ya usan
 * las flores sin foto.
 */
export default function FotoFlor({ src, alt, fallback, onError, ...props }: Props) {
  // Guarda cuál falló y no un booleano: en la galería `src` cambia y la foto
  // siguiente debe intentarse.
  const [rota, setRota] = useState<string | null>(null);
  if (rota === src) return <>{fallback}</>;

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      onError={(e) => {
        setRota(src);
        onError?.(e);
      }}
    />
  );
}
