'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MaskLines, Reveal } from '@/components/motion';
import { useQuote } from '@/context/QuoteContext';
import { getDb } from '@/lib/firebase';
import toast from 'react-hot-toast';

const FIELD =
  'w-full border-0 border-b border-line bg-transparent py-3 text-[15px] text-ink placeholder:text-muted/70 transition-colors duration-300 focus:border-ink';

export default function CotizacionPage() {
  const { items, removeFromQuote, clearQuote, count } = useQuote();
  const [form, setForm] = useState({ name: '', email: '', phone: '', buyerType: '', volume: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setLoading(true);
    try {
      const db = getDb();
      await addDoc(collection(db, 'inquiries'), {
        ...form,
        flowers: items,
        createdAt: serverTimestamp(),
        status: 'pending',
      });
      setSent(true);
      clearQuote();
    } catch (err) {
      // Sin este log, un rechazo de las reglas de Firestore se ve igual que un
      // problema de red y no hay forma de diagnosticarlo desde el navegador.
      console.error('[cotización] falló el envío:', err);
      toast.error('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center bg-bone px-6 pt-32 md:px-10">
          <div className="mx-auto w-full max-w-[1500px]">
            <p className="label mb-8 text-muted">Solicitud recibida</p>
            <h1 className="font-serif text-[clamp(40px,6vw,84px)] font-light leading-[1] tracking-[-0.02em] text-ink">
              Gracias.
            </h1>
            <p className="mt-8 max-w-md text-[15px] leading-relaxed text-muted">
              Te contactamos dentro de las próximas 24 horas por WhatsApp o correo con tu cotización.
            </p>
            <Link href="/catalogo" className="label group mt-12 inline-flex items-center gap-4 text-ink">
              Seguir viendo el catálogo
              <span className="h-px w-10 bg-ink transition-all duration-500 group-hover:w-16" />
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-bone px-6 pb-24 pt-32 md:px-10 md:pb-40 md:pt-40">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-16 md:mb-24">
            <Reveal>
              <p className="label mb-6 text-muted">Cotización</p>
            </Reveal>
            <MaskLines
              lines={['Dinos qué', 'necesitas']}
              stagger={110}
              className="font-serif text-ink"
              lineClassName="text-[clamp(40px,6.5vw,92px)] font-light leading-[0.98] tracking-[-0.02em]"
            />
          </div>

          <div className="grid gap-16 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-24">
            {/* Selección */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <Reveal>
                <p className="label mb-6 text-muted">
                  Tu selección{count > 0 ? ` (${count})` : ''}
                </p>

                {count === 0 ? (
                  <div className="border-t border-line pt-6">
                    <p className="text-[15px] leading-relaxed text-muted">
                      No has agregado variedades todavía. Puedes explorar el catálogo,
                      o simplemente describir abajo lo que buscas.
                    </p>
                    <Link href="/catalogo" className="label group mt-8 inline-flex items-center gap-4 text-ink">
                      Ir al catálogo
                      <span className="h-px w-10 bg-ink transition-all duration-500 group-hover:w-16" />
                    </Link>
                  </div>
                ) : (
                  <ul className="border-t border-line">
                    {items.map((item) => (
                      <li key={item.flowerId} className="flex items-center gap-4 border-b border-line py-4">
                        {item.flowerImage ? (
                          <div className="relative h-14 w-12 shrink-0 overflow-hidden bg-line">
                            <Image src={item.flowerImage} alt={item.flowerName} fill sizes="48px" className="object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-14 w-12 shrink-0 items-center justify-center bg-line">
                            <span className="font-serif text-sm text-muted">LB</span>
                          </div>
                        )}
                        <span className="min-w-0 flex-1 truncate font-serif text-lg font-light text-ink">
                          {item.flowerName}
                        </span>
                        <button
                          onClick={() => removeFromQuote(item.flowerId)}
                          aria-label={`Quitar ${item.flowerName}`}
                          className="label shrink-0 text-muted transition-colors hover:text-ink"
                        >
                          Quitar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Reveal>
            </div>

            {/* Formulario */}
            <Reveal delay={140}>
              <form onSubmit={handleSubmit} className="flex flex-col gap-10">
                <div className="grid gap-10 sm:grid-cols-2">
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Nombre *"
                    className={FIELD}
                  />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Correo *"
                    className={FIELD}
                  />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="WhatsApp"
                    className={FIELD}
                  />
                  <select
                    value={form.buyerType}
                    onChange={(e) => setForm((p) => ({ ...p, buyerType: e.target.value }))}
                    className={`${FIELD} ${form.buyerType ? 'text-ink' : 'text-muted/70'}`}
                  >
                    <option value="">Tipo de negocio</option>
                    <option value="Floristería">Floristería</option>
                    <option value="Decorador de eventos">Decorador de eventos</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <select
                    value={form.volume}
                    onChange={(e) => setForm((p) => ({ ...p, volume: e.target.value }))}
                    className={`${FIELD} ${form.volume ? 'text-ink' : 'text-muted/70'}`}
                  >
                    <option value="">Volumen o frecuencia</option>
                    <option value="Pedido único">Pedido único</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Mensual">Mensual</option>
                    <option value="Para un evento con fecha">Para un evento con fecha</option>
                  </select>
                </div>

                <textarea
                  rows={5}
                  // Las reglas de Firestore cortan en 2000: sin este tope el
                  // envío fallaba en silencio al pasarse.
                  maxLength={2000}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Cantidad de tallos, fecha de entrega, colores… ¿Buscas una variedad que no está en el catálogo? Cuéntanos aquí."
                  className={`${FIELD} resize-none`}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="label group inline-flex items-center gap-4 self-start text-ink disabled:opacity-50"
                >
                  {loading ? 'Enviando' : 'Enviar solicitud'}
                  <span className="h-px w-10 bg-ink transition-all duration-500 group-hover:w-16" />
                </button>

                <p className="text-[13px] leading-relaxed text-muted">
                  Respondemos en menos de 24 horas por WhatsApp o correo.
                </p>
              </form>
            </Reveal>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
