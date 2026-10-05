// Clases del panel de precios, en un solo lugar para que lista, editor y
// diálogos se vean como una pieza. Todo sale de los tokens del sistema
// (ink, bone, paper, line, muted): ningún color ni esquina nuevos.

/** Acción de texto. `min-h-11` (44 px): los `label` de 10 px sin relleno eran
 *  un blanco táctil de 10 px, con Eliminar pegado a Publicar. */
export const ACCION = 'label inline-flex min-h-11 items-center text-ink transition-opacity hover:opacity-60';
export const ACCION_SUAVE = 'label inline-flex min-h-11 items-center text-muted transition-colors hover:text-ink';
export const ACCION_PRINC = 'label group inline-flex min-h-11 items-center gap-3 text-ink';
export const BOTON =
  'inline-flex min-h-11 items-center bg-ink px-6 py-3 label text-bone transition-all duration-300 hover:bg-ink/85 disabled:opacity-50';
/** Destino de una hoja, como etiqueta subrayada. */
export const ETIQ_DESTINO = 'label border-b border-ink pb-0.5 text-ink';
/** Aviso que no se puede pasar por alto: filete a la izquierda, sin fondo ni color. */
export const AVISO = 'border-l border-ink pl-4 text-[14px] leading-relaxed text-ink';
/** Campo subrayado. El subrayado en reposo es `muted/80` (3.2:1 sobre bone) en
 *  vez de `line` (1.2:1, casi invisible) y el placeholder es `muted` pleno. */
export const FIELD =
  'w-full border-0 border-b border-muted/80 bg-transparent py-2 text-[15px] text-ink placeholder:text-muted transition-colors duration-300 focus:border-ink';
