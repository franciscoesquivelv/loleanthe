import type { Metadata } from 'next';
import './globals.css';
import { QuoteProvider } from '@/context/QuoteContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Loleanthe Boutique — Luxury Florals',
  description: 'Flores exóticas de alta gama. Rosas y flores premium con tallos largos y larga duración, ideales para arreglos únicos e irrepetibles.',
  keywords: 'flores de lujo, rosas premium, flores exóticas, arreglos florales, boutique floral',
  openGraph: {
    title: 'Loleanthe Boutique — Luxury Florals',
    description: 'Flores exóticas de alta gama. Rosas y flores premium con tallos largos y larga duración.',
    siteName: 'Loleanthe Boutique',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/favicon-light.png', media: '(prefers-color-scheme: light)' },
      { url: '/favicon-dark.png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/logo-icon.png',
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
