import type { NextConfig } from "next";

// Las hojas de precios son enlaces que se mandan por WhatsApp, no páginas para
// buscadores: ya llevan `noindex` en su metadata, y acá se suma la cabecera para
// que no dependa del código de cada página. Las rutas son las de
// PRICE_DESTINATIONS (lib/price-destinations.ts); si se suma un destino, va una
// línea más acá. robots.txt NO las lista a propósito: un Disallow impediría que
// Google lea el noindex y además publicaría las rutas.
const RUTAS_PRIVADAS = ['/precios', '/precios-cr', '/precios-gt'];

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  async headers() {
    return [
      // loleanthe-web.vercel.app responde lo mismo que loleanthe.com y no se
      // puede apagar: que al menos no se indexe como segundo sitio. El canonical
      // de cada página ya apunta al dominio real.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'loleanthe-web.vercel.app' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      ...RUTAS_PRIVADAS.map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      })),
    ];
  },
};

export default nextConfig;
