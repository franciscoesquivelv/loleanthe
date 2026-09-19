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
    default: 'Loleanthe — Flor ecuatoriana para floristas y decoradores',
    template: '%s | Loleanthe',
  },
  description: 'Consolidamos flor ecuatoriana de varias fincas y la importamos bajo pedido para floristas, decoradores y hoteles en Costa Rica y Guatemala.',
  keywords: 'flor ecuatoriana, rosas de tallo largo, flores al por mayor, importador de flores Costa Rica, flores Guatemala, ranunculus',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Loleanthe — Flor ecuatoriana consolidada',
    description: 'Flor ecuatoriana de varias fincas, importada bajo pedido para floristas, decoradores y hoteles en Costa Rica y Guatemala.',
    url: 'https://loleanthe.com',
    siteName: 'Loleanthe',
    type: 'website',
    locale: 'es_CR',
    alternateLocale: ['es_GT'],
    images: [
      {
        url: '/images/hero-dark.jpg',
        width: 1200,
        height: 630,
        alt: 'Loleanthe — flor ecuatoriana',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Loleanthe — Flor ecuatoriana consolidada',
    description: 'Flor ecuatoriana de varias fincas, importada bajo pedido para floristas, decoradores y hoteles.',
    images: ['/images/hero-dark.jpg'],
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
      <body>
        <QuoteProvider>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#12100E',
                color: '#FBF9F5',
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: '14px',
                borderRadius: '0px',
                border: '1px solid #7B7369',
              },
            }}
          />
        </QuoteProvider>
      </body>
    </html>
  );
}
