import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  preview: { allowedHosts: ['.trycloudflare.com'] },
  // Worker em arquivo único: com code-splitting, o chunk do WASM importava de volta a entrada do worker, e o
  // WebKit do iOS reexecuta esse módulo (perdendo o estado do duelo após o primeiro pedido).
  worker: { format: 'es', rollupOptions: { output: { inlineDynamicImports: true } } },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'YGO Story', short_name: 'YGO Story', display: 'standalone', orientation: 'portrait',
        background_color: '#0b0d17', theme_color: '#0b0d17', icons: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,wasm,json,webp}'],
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
