import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { Connect, Plugin } from 'vite';
import campaign from './src/campaign/data/campaign.json';
import { PLAYER_AVATARS } from './src/story/profile';
import { CHAR_ID } from './src/screens/campaign/chars';

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

/**
 * Entradas extras da pré-carga (fora do `globPatterns`): o essencial para o começo da campanha offline. A arte `thumb`
 * do deck inicial, o verso da carta e os sprites dos avatares do jogador e dos personagens do Tier 1 (os outros
 * personagens e toda a arte da coleção ficam no cache de execução). Revisão = hash do arquivo.
 */
function essentials() {
  const files = [
    'cards/back.webp',
    ...[...new Set(campaign.starterDeck.main.map((e) => e.id))].map((id) => `cards/thumb/${id}.webp`),
    'characters/index.json',
    ...[...PLAYER_AVATARS.map((a) => a.id), ...Object.values(CHAR_ID)].flatMap((dir) =>
      existsSync(`public/characters/${dir}`) ? readdirSync(`public/characters/${dir}`, { recursive: true }).map(String)
        .filter((f) => /\.(png|webp|json)$/.test(f)).map((f) => `characters/${dir}/${f}`) : []),
  ];
  return files.filter((f) => existsSync(`public/${f}`))
    .map((url) => ({ url, revision: createHash('md5').update(readFileSync(`public/${url}`)).digest('hex').slice(0, 12) }));
}
/** Cache de execução com limite, expiração e esvaziamento se o aparelho recusar gravar por falta de espaço. */
const limited = (cacheName: string, maxEntries: number, days: number) => ({
  cacheName, cacheableResponse: { statuses: [0, 200] },
  expiration: { maxEntries, maxAgeSeconds: days * 24 * 3600, purgeOnQuotaError: true },
});

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
        globPatterns: ['**/*.{js,css,html,wasm,json,webp,woff2,svg,png,ico,m4a}'],
        // Fora da pré-carga: a arte das cartas (~75 MB), os sprites (ficam só os do essencial, abaixo), o mapa/fundos e
        // a música da campanha, e o build JSPI do motor (o app usa o síncrono). São guardados conforme vistos/tocados.
        globIgnores: ['cards/**', 'characters/**', 'campaign/**', 'music/**', 'assets/ocgcore.jspi-*'],
        additionalManifestEntries: essentials(),
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.includes('/cards/thumb/'),
          handler: 'CacheFirst',
          options: limited('card-thumb', 2500, 90),
        }, {
          urlPattern: ({ url }) => url.pathname.includes('/cards/full/'),
          handler: 'CacheFirst',
          options: limited('card-full', 300, 30),
        }, {
          urlPattern: ({ url }) => url.pathname.includes('/characters/'),
          handler: 'CacheFirst',
          options: limited('characters', 200, 90),
        }, {
          urlPattern: ({ url }) => url.pathname.includes('/campaign/'),
          handler: 'CacheFirst',
          options: { cacheName: 'campaign-art', cacheableResponse: { statuses: [0, 200] } },
        }, {
          urlPattern: ({ url }) => url.pathname.includes('/music/'),
          handler: 'CacheFirst',
          options: { cacheName: 'music', rangeRequests: true, cacheableResponse: { statuses: [0, 200] } },
        }],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
});
