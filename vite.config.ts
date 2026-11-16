import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { appendFileSync } from 'node:fs';
import type { Connect, Plugin } from 'vite';

// Recebe os logs de diagnóstico do aparelho (?debug na URL) e grava em /tmp/duel-days-device.log (só dev/preview).
const deviceLog = (): Plugin => {
  const mw: Connect.NextHandleFunction = (req, res, next) => {
    if (req.method !== 'POST' || !req.url?.startsWith('/__log')) return next();
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => { appendFileSync('/tmp/duel-days-device.log', body + '\n'); res.statusCode = 204; res.end(); });
  };
  return { name: 'device-log', configureServer: (s) => { s.middlewares.use(mw); }, configurePreviewServer: (s) => { s.middlewares.use(mw); } };
};

export default defineConfig({
  preview: { allowedHosts: ['.trycloudflare.com'] },
  // Worker em arquivo único: com code-splitting, o chunk do WASM importava de volta a entrada do worker, e o
  // WebKit do iOS reexecuta esse módulo (perdendo o estado do duelo após o primeiro pedido).
  worker: { format: 'es', rollupOptions: { output: { inlineDynamicImports: true } } },
  plugins: [
    deviceLog(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Atrás do Cloudflare Access o manifest só carrega com o cookie de login (crossorigin="use-credentials").
      useCredentials: true,
      manifest: {
        name: 'Duel Days', short_name: 'Duel Days', display: 'standalone', orientation: 'portrait',
        background_color: '#050c1f', theme_color: '#050c1f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      includeAssets: ['favicon.ico', 'icons/icon.svg', 'icons/apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,wasm,json,webp,woff2,svg,png,ico}'],
        // A arte das cartas (dezenas de MB) não entra na pré-carga: é guardada conforme é vista.
        globIgnores: ['cards/**'],
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.includes('/cards/'),
          handler: 'CacheFirst',
          options: { cacheName: 'card-art', expiration: { maxEntries: 5000 }, cacheableResponse: { statuses: [0, 200] } },
        }],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
});
