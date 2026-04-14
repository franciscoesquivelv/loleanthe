'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useQuote } from '@/context/QuoteContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CotizacionPage() {
  const { items, removeFromQuote, clearQuote, count } = useQuote();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
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
    } catch {
      toast.error('Ocurrió un error. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <>
        <Header />
        <main className="pt-32 pb-24 min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <span className="font-script text-7xl text-[#B08D6B] block mb-6">✓</span>
            <h1 className="font-display text-4xl text-[#1A130A] mb-4">¡Cotización enviada!</h1>
            <p className="text-[#7A6654] leading-relaxed mb-8">
              Recibimos tu solicitud. Nuestro equipo se pondrá en contacto contigo dentro de las próximas 24 horas con una cotización personalizada para ti.
            </p>
            <Link href="/catalogo" className="bg-[#1A130A] text-[#FAF7F2] px-8 py-4 font-display tracking-widest text-sm uppercase hover:bg-[#B08D6B] transition-all duration-500 inline-block">
              Seguir explorando
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
      <main className="pt-32 pb-24 min-h-screen">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-14">
            <p className="font-script text-[#B08D6B] text-3xl mb-3">Tu selección</p>
            <h1 className="font-display text-5xl md:text-6xl font-light text-[#1A130A]">
              Solicitud de <em className="italic text-[#B08D6B]">Cotización</em>
            </h1>
            <div className="ornament max-w-xs mx-auto mt-5">
              <span className="text-[#B08D6B] text-xs tracking-[0.3em] uppercase font-display">Personalizada para ti</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Left: flowers selected */}
            <div className="lg:col-span-2">
              <h2 className="font-display text-xl text-[#1A130A] mb-4 tracking-wide">
                Flores seleccionadas
                {count > 0 && <span className="text-[#B08D6B] ml-2">({count})</span>}
              </h2>

              {count === 0 ? (
                <div className="border border-dashed border-[#D4B896] p-8 text-center">
                  <p className="font-script text-3xl text-[#B08D6B] mb-3">Vacío</p>
                  <p className="text-[#7A6654] text-sm mb-5">
                    Aún no has agregado flores a tu cotización. Explora el catálogo.
                  </p>
                  <Link href="/catalogo" className="font-display text-xs tracking-widest uppercase text-[#B08D6B] hover-underline">
                    Ir al catálogo →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.flowerId} className="flex items-center gap-3 bg-[#F2EDE4] p-3 group">
                      {item.flowerImage ? (
                        <div className="w-12 h-12 relative flex-shrink-0 overflow-hidden">
                          <Image
                            src={item.flowerImage}
                            alt={item.flowerName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-[#EDE0CE] flex-shrink-0 flex items-center justify-center">
                          <span className="font-script text-sm text-[#B08D6B]">LB</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm text-[#1A130A] truncate">{item.flowerName}</p>
                        <p className="text-xs text-[#B08D6B]">Para cotizar</p>
                      </div>
                      <button
                        onClick={() => removeFromQuote(item.flowerId)}
                        className="opacity-0 group-hover:opacity-100 text-[#7A6654] hover:text-red-400 transition-all text-lg w-6 h-6 flex items-center justify-center"
                        aria-label="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Tags display */}
                  <div className="mt-5 pt-5 border-t border-[#EDE0CE]">
                    <p className="text-xs text-[#7A6654] mb-3 font-display tracking-widest uppercase">En tu formulario:</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <span
                          key={item.flowerId}
                          className="bg-[#1A130A] text-[#FAF7F2] text-xs font-display tracking-wider px-3 py-1.5 flex items-center gap-2"
                        >
                          {item.flowerName}
                          <button
                            onClick={() => removeFromQuote(item.flowerId)}
                            className="text-[#B08D6B] hover:text-white transition-colors leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/catalogo"
                    className="block text-center text-xs font-display tracking-widest uppercase text-[#7A6654] hover:text-[#B08D6B] transition-colors mt-4 hover-underline"
                  >
                    + Agregar más flores
                  </Link>
                </div>
              )}
            </div>

            {/* Right: form */}
            <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
              <h2 className="font-display text-xl text-[#1A130A] mb-4 tracking-wide">Tus datos de contacto</h2>

              <div>
                <label className="block text-xs tracking-widest uppercase font-display text-[#7A6654] mb-2">Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Tu nombre"
                  className="w-full border border-[#D4B896] bg-transparent px-4 py-3 font-display text-[#1A130A] placeholder:text-[#B08D6B]/40 transition-colors text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs tracking-widest uppercase font-display text-[#7A6654] mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="tu@correo.com"
                    className="w-full border border-[#D4B896] bg-transparent px-4 py-3 font-display text-[#1A130A] placeholder:text-[#B08D6B]/40 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase font-display text-[#7A6654] mb-2">WhatsApp / Teléfono</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+52 000 000 0000"
                    className="w-full border border-[#D4B896] bg-transparent px-4 py-3 font-display text-[#1A130A] placeholder:text-[#B08D6B]/40 transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs tracking-widest uppercase font-display text-[#7A6654] mb-2">Mensaje / Detalles de tu ocasión</label>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Cuéntanos más sobre lo que buscas: ocasión, colores preferidos, cantidad aproximada de flores, fecha de entrega deseada..."
                  className="w-full border border-[#D4B896] bg-transparent px-4 py-3 font-display text-[#1A130A] placeholder:text-[#B08D6B]/40 transition-colors text-sm resize-none"
                />
              </div>

              {/* Summary of selected flowers in form */}
              {count > 0 && (
                <div className="bg-[#F2EDE4] p-4 border-l-2 border-[#B08D6B]">
                  <p className="text-xs font-display tracking-widest uppercase text-[#7A6654] mb-2">Flores a cotizar:</p>
                  <p className="text-sm text-[#1A130A] font-display">
                    {items.map((i) => i.flowerName).join(' · ')}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A130A] text-[#FAF7F2] py-4 font-display tracking-widest text-sm uppercase hover:bg-[#B08D6B] transition-all duration-500 disabled:opacity-60 mt-4"
              >
                {loading ? 'Enviando solicitud...' : 'Enviar solicitud de cotización'}
              </button>

              <p className="text-xs text-[#7A6654] text-center leading-relaxed">
                Nos pondremos en contacto contigo en menos de 24 horas con tu cotización personalizada.
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
