'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const auth = getAuthInstance();
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin/dashboard');
    } catch {
      toast.error('Credenciales incorrectas. Verifica tu email y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C2A22] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <Image
            src="/logo.png"
            alt="Loleanthe Boutique"
            width={200}
            height={70}
            className="h-16 w-auto object-contain invert opacity-70 mx-auto mb-4"
          />
          <p className="font-display text-xs tracking-[0.4em] uppercase text-[#8A3B57]">Panel de Administración</p>
        </div>

        {/* Card */}
        <div className="border border-[#8A3B57]/20 p-8">
          <h1 className="font-display text-2xl text-[#E7E8E0] font-light mb-8 text-center">
            Iniciar <em className="italic text-[#8A3B57]">sesión</em>
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs tracking-widest uppercase font-display text-[#5C6960] mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@loleanthe.com"
                className="w-full border border-[#8A3B57]/30 bg-[#26302A]/50 px-4 py-3 font-display text-[#E7E8E0] placeholder:text-[#5C6960]/50 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase font-display text-[#5C6960] mb-2">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#8A3B57]/30 bg-[#26302A]/50 px-4 py-3 font-display text-[#E7E8E0] placeholder:text-[#5C6960]/50 transition-colors text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8A3B57] text-[#E7E8E0] py-4 font-display tracking-widest text-sm uppercase hover:bg-[#8E9C88] hover:text-[#1C2A22] transition-all duration-500 disabled:opacity-60 mt-4"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#5C6960]/30 text-xs mt-8 font-display tracking-wider">
          Acceso exclusivo para el equipo de Loleanthe
        </p>
      </div>
    </div>
  );
}
