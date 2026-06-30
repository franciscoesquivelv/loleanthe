import type { Metadata } from 'next';
import './globals.css';
import { QuoteProvider } from '@/context/QuoteContext';
import { Toaster } from 'react-hot-toast';

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
    <html lang="es">
      <body className="grain">
        <QuoteProvider>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#1A130A',
                color: '#FAF7F2',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                borderRadius: '2px',
                border: '1px solid #B08D6B',
              },
            }}
          />
        </QuoteProvider>
      </body>
    </html>
  );
}
