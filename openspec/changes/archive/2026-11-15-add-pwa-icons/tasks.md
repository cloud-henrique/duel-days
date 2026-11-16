# Tasks

## 1. Fontes SVG do ícone

- [x] 1.1 Criar `assets/app-icon/icon.svg` (placa chanfrada + ankh 4A, `rx=22`) com a geometria de `design.md`; verificar abrindo no navegador: ankh liso, pontas retas, sem degrau nem linhas no centro
- [x] 1.2 Criar `assets/app-icon/icon-small.svg` (sem placa, ankh ampliado sobre o fundo); verificar a prévia em 16, 32 e 48 px: laço, braços e haste distinguíveis
- [x] 1.3 Criar `assets/app-icon/icon-maskable.svg` (fundo cheio, placa reduzida a ~0,72); verificar que placa e ankh ficam dentro do círculo de 40% de raio centrado

## 2. Geração dos arquivos

- [x] 2.1 Escrever `scripts/build_app_icons.mjs` (Playwright/Chromium) que rasteriza os SVG em `public/icons/apple-touch-icon.png` (180, opaco), `icon-192.png`, `icon-512.png` e `icon-maskable-512.png`; verificar com `node scripts/build_app_icons.mjs` e conferir tamanhos e alfa (`file`/`sips -g hasAlpha`: o apple-touch sem alfa)
- [x] 2.2 Montar `public/favicon.ico` (PNG de 16, 32 e 48 px do `icon-small.svg`) e copiar `public/icons/icon.svg`; verificar que `file public/favicon.ico` reporta 3 imagens
- [x] 2.3 Documentar o comando no `CLAUDE.md` (lista de comandos/pipeline) e verificar que ele roda como escrito do zero

## 3. Integração no PWA

- [x] 3.1 Em `index.html`, declarar `<link rel="icon">` (SVG e ICO) e `apple-touch-icon`, e trocar o `theme-color` para `#050c1f`; verificar que `npx vite build` copia os arquivos para `dist/`
- [x] 3.2 Em `vite.config.ts`, preencher `manifest.icons` (192 e 512 `any`, 512 `maskable`), alinhar `theme_color`/`background_color` a `#050c1f`, e incluir `png,ico` em `globPatterns`/`includeAssets`; verificar com `npx tsc --noEmit` e `npx vite build` e conferir o `manifest.webmanifest` gerado
- [x] 3.3 Conferir no preview (`npx vite preview --port 5181 --host 127.0.0.1`): favicon na aba, DevTools → Application → Manifest sem avisos de ícone e com os 3 ícones, e os ícones listados no precache do service worker

## 4. Verificação em dispositivo

- [x] 4.1 No simulador de iOS, "Adicionar à Tela de Início": ícone do ankh em 180 sem bordas pretas; abrir o app e conferir a cor de abertura `#050c1f`
- [x] 4.2 Validar o maskable com a máscara circular/arredondada (DevTools → Manifest → "Show only the minimum safe area") e, se possível, instalar no Android; conferir que nada é cortado

## Workflow follow-up

- Arquivar o change depois de revisar o visual dos ícones no iOS e no Android.
