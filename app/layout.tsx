import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { QuoteProvider } from '@/context/QuoteContext';
import { Toaster } from 'react-hot-toast';

// Títulos: Locatro (display western, self-hosted). Cuerpo: DM Sans (sans neutra).
const display = localFont({
  src: [
    { path: './fonts/Locatro.woff2', weight: '400', style: 'normal' },
    { path: './fonts/LocatroItalic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-display',
  display: 'swap',
});
const body = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://loleanthe.com'),
  title: {
    default: 'Loleanthe Boutique — Flores de Lujo y Rosas Premium',
    template: '%s | Loleanthe Boutique',
  },
  description: 'Flores exóticas de alta gama. Rosas y flores premium con tallos largos y larga duración, ideales para arreglos únicos e irrepetibles.',
  keywords: 'flores de lujo, rosas premium, flores exóticas, arreglos florales, boutique floral',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Loleanthe Boutique — Flores de Lujo',
    description: 'Flores exóticas de alta gama. Rosas y flores premium con tallos largos y larga duración.',
    url: 'https://loleanthe.com',
    siteName: 'Loleanthe Boutique',
    type: 'website',
    locale: 'es_SV',
    images: [
      {
        url: '/images/hero-roses.png',
        width: 1200,
        height: 630,
        alt: 'Loleanthe Boutique — Flores de lujo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Loleanthe Boutique — Flores de Lujo',
    description: 'Flores exóticas de alta gama. Rosas y flores premium con tallos largos y larga duración.',
    images: ['/images/hero-roses.png'],
  },
  icons: {
    icon: '/favicon-black.png',
    apple: '/favicon-black.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body className="grain">
        <QuoteProvider>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#1C2A22',
                color: '#F7F8F4',
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: '14px',
                borderRadius: '0px',
                border: '1px solid #8A3B57',
              },
            }}
          />
        </QuoteProvider>
      </body>
    </html>
  );
}
