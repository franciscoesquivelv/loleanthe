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
    <div className="min-h-screen bg-[#1A130A] flex items-center justify-center px-6">
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
          <p className="font-display text-xs tracking-[0.4em] uppercase text-[#B08D6B]">Panel de Administración</p>
        </div>

        {/* Card */}
        <div className="border border-[#B08D6B]/20 p-8">
          <h1 className="font-display text-2xl text-[#FAF7F2] font-light mb-8 text-center">
            Iniciar <em className="italic text-[#B08D6B]">sesión</em>
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs tracking-widest uppercase font-display text-[#7A6654] mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@loleanthe.com"
                className="w-full border border-[#B08D6B]/30 bg-[#2C1E10]/50 px-4 py-3 font-display text-[#FAF7F2] placeholder:text-[#7A6654]/50 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase font-display text-[#7A6654] mb-2">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#B08D6B]/30 bg-[#2C1E10]/50 px-4 py-3 font-display text-[#FAF7F2] placeholder:text-[#7A6654]/50 transition-colors text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B08D6B] text-[#FAF7F2] py-4 font-display tracking-widest text-sm uppercase hover:bg-[#D4B896] hover:text-[#1A130A] transition-all duration-500 disabled:opacity-60 mt-4"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#7A6654]/30 text-xs mt-8 font-display tracking-wider">
          Acceso exclusivo para el equipo de Loleanthe
        </p>
      </div>
    </div>
  );
}
