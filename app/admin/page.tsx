'use client';

import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';

/** Lo que se le dice a quien no pudo entrar, según qué pasó de verdad: antes
 *  todo era "credenciales incorrectas", incluso sin internet. */
function mensajeDeLogin(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code === 'auth/network-request-failed') {
    return 'No hay conexión con el servidor. Revisa tu internet y vuelve a intentar.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Hubo demasiados intentos. Espera unos minutos, o toca «Olvidé mi contraseña» para crear una nueva.';
  }
  if (code === 'auth/user-disabled') {
    return 'Esta cuenta está desactivada. Avísale a Francisco.';
  }
  return 'El correo o la contraseña no coinciden. Revisa que estén bien escritos, o toca «Olvidé mi contraseña».';
}

const ETIQUETA = 'block text-xs tracking-widest uppercase font-display text-[#A39C92] mb-2';
// 16 px (text-base): con menos, Safari en iPhone hace zoom al tocar el campo.
const CAMPO =
  'w-full border border-[#A39C92]/50 bg-[#1E1A16]/50 px-4 py-3 font-display text-base text-[#F2EFE8] placeholder:text-[#A39C92]/60 transition-colors focus:border-[#F2EFE8]';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState('');
  // Mientras se averigua si ya hay una sesión abierta no se muestra el
  // formulario: evita que parpadee antes de pasar de largo.
  const [revisando, setRevisando] = useState(true);
  const emailRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Quien ya entró antes y abre /admin va directo al panel, sin escribir nada.
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuthInstance(), (user) => {
      if (user) router.replace('/admin/dashboard');
      else setRevisando(false);
    });
    return unsub;
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAviso('');
    try {
      await signInWithEmailAndPassword(getAuthInstance(), email.trim(), password);
      router.push('/admin/dashboard');
    } catch (err) {
      toast.error(mensajeDeLogin(err), { duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  // Crear una contraseña nueva sin pedirle nada a nadie. La respuesta es la
  // misma exista o no la cuenta: no se le dice a un extraño qué correos tienen acceso.
  const olvideMiClave = async () => {
    const correo = email.trim();
    if (!correo) {
      setAviso('Escribe tu correo arriba y vuelve a tocar «Olvidé mi contraseña».');
      emailRef.current?.focus();
      return;
    }
    setEnviando(true);
    setAviso('');
    try {
      await sendPasswordResetEmail(getAuthInstance(), correo);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/network-request-failed') {
        setAviso('No hay conexión con el servidor. Revisa tu internet y vuelve a intentar.');
        setEnviando(false);
        return;
      }
      if (code === 'auth/too-many-requests') {
        setAviso('Ya se pidió hace poco. Espera unos minutos y revisa tu correo.');
        setEnviando(false);
        return;
      }
      // Cualquier otro (correo sin cuenta, correo mal escrito) se responde igual.
    }
    setEnviando(false);
    setAviso(
      `Si ${correo} tiene acceso, te llegó un correo para crear una contraseña nueva. Revisa también la carpeta de spam.`
    );
  };

  if (revisando) {
    return (
      <div className="min-h-screen bg-[#12100E] flex items-center justify-center">
        <div className="font-script text-4xl text-[#7B7369] animate-pulse">Loleanthe</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#12100E] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <Image src="/logo-wordmark-white.png" alt="Loleanthe" width={200} height={73} className="h-12 w-auto object-contain opacity-70 mx-auto" style={{ width: 'auto' }} />
          <p className="font-display text-xs tracking-[0.4em] uppercase text-[#A39C92] mt-3">Panel de Administración</p>
        </div>

        {/* Card */}
        <div className="border border-[#A39C92]/30 p-8">
          <h1 className="font-display text-2xl text-[#F2EFE8] font-light mb-8 text-center">
            Iniciar <em className="italic text-[#A39C92]">sesión</em>
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="correo" className={ETIQUETA}>
                Correo
              </label>
              <input
                id="correo"
                ref={emailRef}
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className={CAMPO}
              />
            </div>
            <div>
              <label htmlFor="clave" className={ETIQUETA}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="clave"
                  type={verClave ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${CAMPO} pr-20`}
                />
                <button
                  type="button"
                  onClick={() => setVerClave((v) => !v)}
                  aria-pressed={verClave}
                  className="absolute inset-y-0 right-0 flex min-w-16 items-center justify-center px-4 text-xs tracking-widest uppercase font-display text-[#A39C92] transition-colors hover:text-[#F2EFE8]"
                >
                  {verClave ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F2EFE8] text-[#12100E] py-4 font-display tracking-widest text-sm uppercase hover:bg-[#A39C92] transition-all duration-500 disabled:opacity-60 mt-4"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={olvideMiClave}
              disabled={enviando}
              className="inline-flex min-h-11 items-center text-sm font-display text-[#A39C92] underline underline-offset-4 transition-colors hover:text-[#F2EFE8] disabled:opacity-60"
            >
              {enviando ? 'Enviando…' : 'Olvidé mi contraseña'}
            </button>
            {aviso && (
              <p role="status" className="mt-3 text-sm leading-relaxed text-[#F2EFE8]">
                {aviso}
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-[#A39C92]/70 text-xs mt-8 font-display tracking-wider">
          Acceso exclusivo para el equipo de Loleanthe
        </p>
      </div>
    </div>
  );
}
