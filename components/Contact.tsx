'use client';

import { useState } from 'react';
import { enviarSolicitud } from '@/lib/enviar-solicitud';
import { useQuote } from '@/context/QuoteContext';
import toast from 'react-hot-toast';
import { MaskLines, Reveal } from './motion';

const FIELD =
  'w-full border-0 border-b border-bone/25 bg-transparent py-3 text-[15px] text-bone placeholder:text-bone/35 transition-colors duration-300 focus:border-bone';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { items, count, clearQuote } = useQuote();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setLoading(true);
    try {
      await enviarSolicitud(form, items, 'contacto');
      setSent(true);
      setForm({ name: '', email: '', phone: '', message: '' });
      clearQuote();
    } catch (err) {
      // Solo se llega acá si fallaron los DOS caminos, el correo y Firestore.
      console.error('[contacto] falló el envío:', err);
      toast.error(
        'No pudimos enviar tu solicitud. Escríbenos por WhatsApp al 8847-2038 y la tomamos por ahí.',
        { duration: 9000 }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contacto" className="bg-ink px-6 py-24 text-bone md:px-10 md:py-40">
      <div className="mx-auto grid max-w-[1500px] gap-16 lg:grid-cols-2 lg:gap-28">
        <div>
          <Reveal>
            <p className="label mb-6 text-bone/55">Contacto</p>
          </Reveal>
          <MaskLines
            lines={['Pide tu', 'cotización']}
            stagger={110}
            className="font-serif"
            lineClassName="text-[clamp(40px,6vw,84px)] font-light leading-[0.98] tracking-[-0.02em]"
          />
          <Reveal delay={300}>
            <p className="mt-10 max-w-sm text-[15px] leading-relaxed text-bone/60">
              Escríbenos qué variedades y qué volumen necesitas. Respondemos por
              WhatsApp o correo, normalmente el mismo día.
            </p>
          </Reveal>

          {count > 0 && (
            <Reveal delay={380}>
              <div className="mt-12 border-t border-bone/20 pt-6">
                <p className="label mb-4 text-bone/55">En tu cotización ({count})</p>
                <p className="text-[15px] leading-relaxed text-bone/80">
                  {items.map((i) => i.flowerName).join(' · ')}
                </p>
              </div>
            </Reveal>
          )}
        </div>

        <Reveal delay={160}>
          {sent ? (
            <div className="flex h-full min-h-[280px] flex-col justify-center border-t border-bone/20 pt-10">
              <p className="font-serif text-4xl font-light">Recibido.</p>
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-bone/60">
                Te contactamos dentro de las próximas 24 horas con tu cotización.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <div className="grid gap-8 sm:grid-cols-2">
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
              </div>

              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="WhatsApp"
                className={FIELD}
              />

              <textarea
                rows={4}
                maxLength={2000}
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                placeholder="Variedades, cantidad de tallos, fecha…"
                className={`${FIELD} resize-none`}
              />

              <button
                type="submit"
                disabled={loading}
                className="label group mt-4 inline-flex items-center gap-4 self-start text-bone disabled:opacity-50"
              >
                {loading ? 'Enviando' : 'Enviar solicitud'}
                <span className="h-px w-10 bg-bone transition-all duration-500 group-hover:w-16" />
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
