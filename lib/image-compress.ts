import { ALLOWED_IMAGE_TYPES } from './flowers';

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

// Por debajo de esto no vale la pena tocar la foto: ya pesa poco y el trabajo
// de recomprimir cuesta más de lo que ahorra.
const YA_ESTA_BIEN_BYTES = 900_000;

/** Mide la foto sin decodificarla entera. */
function medir(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('NO_SE_PUEDE_DECODIFICAR'));
    };
    img.src = url;
  });
}

/**
 * Reduce y recodifica la foto en el navegador antes de que llegue a Storage.
 *
 * CUIDADO con el hilo principal. La versión anterior hacía
 * `createImageBitmap(file)` sin opciones, o sea decodificaba la foto a tamaño
 * completo, y después `drawImage` de ese bitmap gigante. Con una foto de
 * celular de 12 megapíxeles eso BLOQUEA la página entera: no se puede escribir
 * en los campos, no se repinta nada, y parece que se colgó el guardado. Fue
 * exactamente lo que le pasó a Francisco.
 *
 * Acá el redimensionado se le pide al decodificador (`resizeWidth` y
 * `resizeHeight`), así nunca existe un bitmap a tamaño real y el canvas es
 * chico. Ante cualquier imprevisto devuelve el original.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;

  const permitido = ALLOWED_IMAGE_TYPES.includes(file.type);

  // Un formato que la regla de Storage no acepta HAY que convertirlo, aunque el
  // JPEG salga más pesado: subir el original garantiza un rechazo del servidor.
  // Si el navegador tampoco puede decodificarlo (HEIC del iPhone), se devuelve
  // igual y lo frena `validateImageFiles` con un mensaje claro.
  const hayQueConvertir = !permitido;

  if (permitido && file.size <= YA_ESTA_BIEN_BYTES) return file;

  try {
    const { width: w0, height: h0 } = await medir(file);
    const escala = Math.min(1, MAX_DIMENSION / Math.max(w0, h0));
    const width = Math.max(1, Math.round(w0 * escala));
    const height = Math.max(1, Math.round(h0 * escala));

    // El decodificador entrega el bitmap YA reducido: nunca se materializa la
    // imagen a tamaño completo en memoria ni se dibuja en el hilo principal.
    const bitmap = await createImageBitmap(file, {
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: 'high',
    });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    canvas.width = 0;
    canvas.height = 0;

    if (!blob) return file;
    if (!hayQueConvertir && blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
