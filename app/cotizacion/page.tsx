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
            <span className="font-script text-7xl text-[#9C7A3C] block mb-6">✓</span>
            <h1 className="font-display text-4xl text-[#2B1620] mb-4">¡Cotización enviada!</h1>
            <p className="text-[#6B5D50] leading-relaxed mb-8">
              Recibimos tu solicitud. Nuestro equipo se pondrá en contacto contigo dentro de las próximas 24 horas con una cotización personalizada para ti.
            </p>
            <Link href="/catalogo" className="bg-[#2B1620] text-[#EDE4D8] px-8 py-4 font-display tracking-widest text-sm uppercase hover:bg-[#9C7A3C] transition-all duration-500 inline-block">
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
      <main className="pt-24 md:pt-32 pb-16 md:pb-24 min-h-screen">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-10 md:mb-14">
            <p className="font-script text-[#9C7A3C] text-2xl md:text-3xl mb-3">Tu selección</p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-[#2B1620]">
              Solicitud de <em className="italic text-[#9C7A3C]">Cotización</em>
            </h1>
            <div className="ornament max-w-xs mx-auto mt-5">
              <span className="text-[#9C7A3C] text-xs tracking-[0.3em] uppercase font-display">Personalizada para ti</span>
            </div>
          </div>

          <div className="relative w-full aspect-[21/9] md:aspect-[3/1] mb-12 md:mb-16 overflow-hidden">
            <Image
              src="/images/florista-tallos.jpg"
              alt="Preparación artesanal de los tallos antes del envío"
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2B1620]/60 via-transparent to-transparent" />
            <p className="absolute bottom-4 left-4 md:bottom-6 md:left-6 font-display italic text-[#FBF7F0] text-sm md:text-lg max-w-xs md:max-w-sm leading-snug">
              Cada tallo se revisa y prepara a mano antes de salir.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Left: flowers selected */}
            <div className="lg:col-span-2">
              <h2 className="font-display text-xl text-[#2B1620] mb-4 tracking-wide">
                Flores seleccionadas
                {count > 0 && <span className="text-[#9C7A3C] ml-2">({count})</span>}
              </h2>

              {count === 0 ? (
                <div className="border border-dashed border-[#A69485] p-8 text-center">
                  <p className="font-script text-3xl text-[#9C7A3C] mb-3">Vacío</p>
                  <p className="text-[#6B5D50] text-sm mb-5">
                    Aún no has agregado flores a tu cotización. Explora el catálogo.
                  </p>
                  <Link href="/catalogo" className="font-display text-xs tracking-widest uppercase text-[#9C7A3C] hover-underline">
                    Ir al catálogo →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.flowerId} className="flex items-center gap-3 bg-[#EDE4D8] p-3 group">
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
                        <div className="w-12 h-12 bg-[#DDD2C2] flex-shrink-0 flex items-center justify-center">
                          <span className="font-script text-sm text-[#9C7A3C]">LB</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm text-[#2B1620] truncate">{item.flowerName}</p>
                        <p className="text-xs text-[#9C7A3C]">Para cotizar</p>
                      </div>
                      <button
                        onClick={() => removeFromQuote(item.flowerId)}
                        className="text-[#6B5D50] hover:text-red-500 transition-colors text-xl w-11 h-11 flex items-center justify-center flex-shrink-0"
                        aria-label={`Quitar ${item.flowerName}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Tags display */}
                  <div className="mt-5 pt-5 border-t border-[#DDD2C2]">
                    <p className="text-xs text-[#6B5D50] mb-3 font-display tracking-widest uppercase">En tu formulario:</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <span
                          key={item.flowerId}
                          className="bg-[#2B1620] text-[#EDE4D8] text-xs font-display tracking-wider px-3 py-1.5 flex items-center gap-2"
                        >
                          {item.flowerName}
                          <button
                            onClick={() => removeFromQuote(item.flowerId)}
                            className="text-[#9C7A3C] hover:text-white transition-colors leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/catalogo"
                    className="block text-center text-xs font-display tracking-widest uppercase text-[#6B5D50] hover:text-[#9C7A3C] transition-colors mt-4 hover-underline"
                  >
                    + Agregar más flores
                  </Link>
                </div>
              )}
            </div>

            {/* Right: form */}
            <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
              <h2 className="font-display text-xl text-[#2B1620] mb-4 tracking-wide">Tus datos de contacto</h2>

              <div>
                <label className="block text-xs tracking-widest uppercase font-display text-[#6B5D50] mb-2">Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Tu nombre"
                  className="w-full border border-[#A69485] bg-transparent px-4 py-3 font-display text-[#2B1620] placeholder:text-[#9C7A3C]/40 transition-colors text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs tracking-widest uppercase font-display text-[#6B5D50] mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="tu@correo.com"
                    className="w-full border border-[#A69485] bg-transparent px-4 py-3 font-display text-[#2B1620] placeholder:text-[#9C7A3C]/40 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase font-display text-[#6B5D50] mb-2">WhatsApp / Teléfono</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+506 0000 0000"
                    className="w-full border border-[#A69485] bg-transparent px-4 py-3 font-display text-[#2B1620] placeholder:text-[#9C7A3C]/40 transition-colors text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs tracking-widest uppercase font-display text-[#6B5D50] mb-2">Tipo de negocio</label>
                  <select
                    value={form.buyerType}
                    onChange={(e) => setForm((p) => ({ ...p, buyerType: e.target.value }))}
                    className="w-full border border-[#A69485] bg-transparent px-4 py-3 font-display text-[#2B1620] text-sm"
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="Floristería">Floristería</option>
                    <option value="Decorador de eventos">Decorador de eventos</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase font-display text-[#6B5D50] mb-2">Volumen o frecuencia</label>
                  <select
                    value={form.volume}
                    onChange={(e) => setForm((p) => ({ ...p, volume: e.target.value }))}
                    className="w-full border border-[#A69485] bg-transparent px-4 py-3 font-display text-[#2B1620] text-sm"
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="Pedido único">Pedido único</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Mensual">Mensual</option>
                    <option value="Para un evento con fecha">Para un evento con fecha</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs tracking-widest uppercase font-display text-[#6B5D50] mb-2">Mensaje / Detalles de tu pedido</label>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Cantidad aproximada de tallos, fecha de entrega deseada, colores preferidos... ¿Buscas una variedad que no ves en el catálogo? También cuéntanos aquí."
                  className="w-full border border-[#A69485] bg-transparent px-4 py-3 font-display text-[#2B1620] placeholder:text-[#9C7A3C]/40 transition-colors text-sm resize-none"
                />
              </div>

              {/* Summary of selected flowers in form */}
              {count > 0 && (
                <div className="bg-[#EDE4D8] p-4 border-l-2 border-[#9C7A3C]">
                  <p className="text-xs font-display tracking-widest uppercase text-[#6B5D50] mb-2">Flores a cotizar:</p>
                  <p className="text-sm text-[#2B1620] font-display">
                    {items.map((i) => i.flowerName).join(' · ')}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2B1620] text-[#EDE4D8] py-4 font-display tracking-widest text-sm uppercase hover:bg-[#9C7A3C] transition-all duration-500 disabled:opacity-60 mt-4"
              >
                {loading ? 'Enviando solicitud...' : 'Enviar solicitud de cotización'}
              </button>

              <p className="text-xs text-[#6B5D50] text-center leading-relaxed">
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
