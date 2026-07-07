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
      { threshold: 0.05 }
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
    <section id="contacto" ref={sectionRef} className="bg-[#8A3B57] text-[#F7F8F4] py-24 md:py-32 px-5 md:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* Left — heading */}
        <div className={`transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="font-body font-bold text-[11px] tracking-[0.24em] uppercase text-[#e8c9d4] mb-4">Contacto exclusivo</p>
          <h2 className="font-display font-extrabold text-[clamp(40px,5.2vw,74px)] leading-[0.95] mb-5">Solicita tu cotización</h2>
          <p className="text-[#f1d9df] text-base leading-relaxed max-w-md">
            Cuéntanos sobre tu ocasión y las flores que te interesan. Te respondemos con una cotización personalizada, hecha a tu medida.
          </p>
          {count > 0 && (
            <div className="mt-8">
              <p className="font-body font-bold text-[10px] tracking-[0.2em] uppercase text-[#e8c9d4] mb-3">En tu cotización</p>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <Link key={item.flowerId} href="/cotizacion" className="border border-[#F7F8F4]/40 text-[#F7F8F4] px-3 py-1.5 text-xs font-body tracking-wide hover:bg-[#F7F8F4] hover:text-[#8A3B57] transition-all">
                    {item.flowerName}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — form */}
        {sent ? (
          <div className="bg-[#F7F8F4] text-[#26302A] p-10 text-center">
            <p className="font-display font-extrabold text-3xl text-[#8A3B57] mb-3">Mensaje recibido</p>
            <p className="text-[#5C6960] text-sm leading-relaxed">
              Gracias por contactarnos. Te responderemos en las próximas 24 horas con tu cotización personalizada.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={`bg-[#F7F8F4] p-8 md:p-9 transition-all duration-1000 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="mb-[18px]">
                <label htmlFor="cta-name" className="block font-body font-bold text-[11px] tracking-[0.12em] uppercase text-[#5C6960] mb-2">Nombre *</label>
                <input id="cta-name" type="text" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Tu nombre" className="w-full bg-[#E7E8E0] border border-transparent focus:border-[#8A3B57] px-4 py-3.5 text-sm text-[#26302A] transition-colors" />
              </div>
              <div className="mb-[18px]">
                <label htmlFor="cta-email" className="block font-body font-bold text-[11px] tracking-[0.12em] uppercase text-[#5C6960] mb-2">Email *</label>
                <input id="cta-email" type="email" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="tu@correo.com" className="w-full bg-[#E7E8E0] border border-transparent focus:border-[#8A3B57] px-4 py-3.5 text-sm text-[#26302A] transition-colors" />
              </div>
            </div>
            <div className="mb-[18px]">
              <label htmlFor="cta-phone" className="block font-body font-bold text-[11px] tracking-[0.12em] uppercase text-[#5C6960] mb-2">WhatsApp / Teléfono</label>
              <input id="cta-phone" type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+506 0000 0000" className="w-full bg-[#E7E8E0] border border-transparent focus:border-[#8A3B57] px-4 py-3.5 text-sm text-[#26302A] transition-colors" />
            </div>
            <div className="mb-5">
              <label htmlFor="cta-msg" className="block font-body font-bold text-[11px] tracking-[0.12em] uppercase text-[#5C6960] mb-2">Tu mensaje</label>
              <textarea id="cta-msg" rows={4} value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} placeholder="¿Para qué ocasión? ¿Colores o estilo en mente?" className="w-full bg-[#E7E8E0] border border-transparent focus:border-[#8A3B57] px-4 py-3.5 text-sm text-[#26302A] transition-colors resize-none" />
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#1C2A22] text-[#F7F8F4] py-4 font-body font-bold text-sm tracking-wide uppercase hover:bg-[#C56E88] hover:text-[#1C2A22] transition-all duration-500 disabled:opacity-60">
              {loading ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
