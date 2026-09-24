import { ALLOWED_IMAGE_TYPES } from './flowers';

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

// Reduce y recodifica la foto en el navegador antes de que llegue a Storage.
// Ante cualquier imprevisto (SVG, fallo al decodificar) devuelve el original.
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;

  // Un formato que la regla de Storage no acepta HAY que convertirlo, aunque el
  // JPEG salga más pesado: subir el original garantiza un rechazo del servidor.
  // Si el navegador tampoco puede decodificarlo (HEIC del iPhone), se devuelve
  // igual y lo frena `validateImageFiles` con un mensaje claro.
  const hayQueConvertir = !ALLOWED_IMAGE_TYPES.includes(file.type);

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    if (!blob) return file;
    if (!hayQueConvertir && blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
