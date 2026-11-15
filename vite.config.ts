import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  worker: { format: 'es' },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'YGO Story', short_name: 'YGO Story', display: 'standalone', orientation: 'portrait',
        background_color: '#0b0d17', theme_color: '#0b0d17', icons: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,wasm,json,lua}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
});
