'use client';

import { useState, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useQuote } from '@/context/QuoteContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CTASection() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { items, count } = useQuote();
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

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
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      toast.error('Ocurrió un error. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contacto" ref={sectionRef} className="relative py-24 px-6 bg-[#F2EDE4]">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#B08D6B] to-transparent" />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="font-script text-[#B08D6B] text-3xl mb-3">¿Lista para tu arreglo ideal?</p>
          <h2 className="font-display text-5xl font-light text-[#1A130A]">
            Solicita tu <em className="italic text-[#B08D6B]">cotización</em>
          </h2>
          <div className="ornament max-w-xs mx-auto mt-5 mb-6">
            <span className="text-[#B08D6B] text-xs tracking-[0.3em] uppercase font-display">Contacto exclusivo</span>
          </div>
          <p className="text-[#7A6654] text-sm leading-relaxed max-w-md mx-auto">
            Cuéntanos sobre tu ocasión y las flores que te interesaron. Nos pondremos en contacto contigo con una cotización personalizada.
          </p>
        </div>

        {/* Quote items pill */}
        {count > 0 && (
          <div className={`mb-8 transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-xs tracking-widest uppercase font-display text-[#7A6654] text-center mb-3">
              Flores en tu cotización
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {items.map((item) => (
                <Link
                  key={item.flowerId}
                  href="/cotizacion"
                  className="border border-[#B08D6B] text-[#B08D6B] px-3 py-1 text-xs font-display tracking-wider hover:bg-[#B08D6B] hover:text-white transition-all"
                >
                  {item.flowerName}
                </Link>
              ))}
            </div>
            <p className="text-center mt-3">
              <Link href="/cotizacion" className="text-xs text-[#B08D6B] hover-underline font-display tracking-widest uppercase">
                Ver formulario completo →
              </Link>
            </p>
          </div>
        )}

        {/* Form */}
        {sent ? (
          <div className={`text-center py-16 transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <span className="font-script text-6xl text-[#B08D6B] block mb-4">✓</span>
            <h3 className="font-display text-3xl text-[#1A130A] mb-3">Mensaje recibido</h3>
            <p className="text-[#7A6654] text-sm leading-relaxed">
              Gracias por contactarnos. Nos pondremos en touch contigo en las próximas 24 horas con tu cotización personalizada.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className={`space-y-5 transition-all duration-1000 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs tracking-widest uppercase font-display text-[#7A6654] mb-2">Nombre *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Tu nombre completo"
                  className="w-full border border-[#D4B896] bg-transparent px-4 py-3 font-display text-[#1A130A] placeholder:text-[#B08D6B]/40 transition-colors text-sm"
                />
              </div>
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
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase font-display text-[#7A6654] mb-2">Teléfono / WhatsApp</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+52 000 000 0000"
                className="w-full border border-[#D4B896] bg-transparent px-4 py-3 font-display text-[#1A130A] placeholder:text-[#B08D6B]/40 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase font-display text-[#7A6654] mb-2">Cuéntanos sobre tu ocasión</label>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                placeholder="¿Para qué ocasión es? ¿Tienes colores o estilo en mente?"
                className="w-full border border-[#D4B896] bg-transparent px-4 py-3 font-display text-[#1A130A] placeholder:text-[#B08D6B]/40 transition-colors text-sm resize-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-[#1A130A] text-[#FAF7F2] px-10 py-4 font-display tracking-widest text-sm uppercase hover:bg-[#B08D6B] transition-all duration-500 disabled:opacity-60"
              >
                {loading ? 'Enviando...' : 'Enviar solicitud'}
              </button>
              <Link href="/cotizacion" className="text-[#7A6654] text-xs font-display tracking-widest uppercase hover:text-[#B08D6B] transition-colors hover-underline">
                {count > 0 ? `Agregar flores (${count} en lista)` : 'Agregar flores al formulario'}
              </Link>
            </div>
          </form>
        )}
      </div>

      {/* Decorative bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#B08D6B] to-transparent" />
    </section>
  );
}
