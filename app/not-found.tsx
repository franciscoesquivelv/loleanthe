import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * Sin este archivo, una URL de flor vieja o mal escrita caía en la 404
 * genérica de Next: sin marca, sin nav, sin forma de volver al catálogo
 * (hallazgo de Vera, 28/9). No es un problema de indexación, es una
 * oportunidad de retención perdida.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen items-center bg-bone px-6 pt-32 md:px-10">
        <div className="mx-auto w-full max-w-[1500px]">
          <p className="label mb-8 text-muted">Página no encontrada</p>
          <h1 className="font-serif text-[clamp(40px,6vw,84px)] font-light leading-[1] tracking-[-0.02em] text-ink">
            No la encontramos.
          </h1>
          <p className="mt-8 max-w-md text-[15px] leading-relaxed text-muted">
            La variedad o la página que buscas ya no está en esta dirección.
            Puede estar en el catálogo con otro enlace.
          </p>
          <Link href="/catalogo" className="label group mt-12 inline-flex items-center gap-4 text-ink">
            Ver el catálogo
            <span className="h-px w-10 bg-ink transition-all duration-500 group-hover:w-16" />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
