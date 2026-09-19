import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import { QuoteProvider } from '@/context/QuoteContext';
import { Toaster } from 'react-hot-toast';

// Títulos: Playfair Display (serif alto contraste, a tono con el logo). Cuerpo: DM Sans (sans sobria).
const display = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
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
    default: 'Loleanthe — Flores de Lujo y Rosas Premium',
    template: '%s | Loleanthe',
  },
  description: 'Flores exóticas de alta gama. Rosas y flores premium con tallos largos y larga duración, ideales para arreglos únicos e irrepetibles.',
  keywords: 'flores de lujo, rosas premium, flores exóticas, arreglos florales, floristería mayorista',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Loleanthe — Flores de Lujo',
    description: 'Flores exóticas de alta gama. Rosas y flores premium con tallos largos y larga duración.',
    url: 'https://loleanthe.com',
    siteName: 'Loleanthe',
    type: 'website',
    locale: 'es_CR',
    alternateLocale: ['es_GT'],
    images: [
      {
        url: '/images/hero-roses.jpg',
        width: 1200,
        height: 630,
        alt: 'Loleanthe — Flores de lujo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Loleanthe — Flores de Lujo',
    description: 'Flores exóticas de alta gama. Rosas y flores premium con tallos largos y larga duración.',
    images: ['/images/hero-roses.jpg'],
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
                background: '#2B1620',
                color: '#FBF7F0',
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: '14px',
                borderRadius: '0px',
                border: '1px solid #9C7A3C',
              },
            }}
          />
        </QuoteProvider>
      </body>
    </html>
  );
}
