# Design

## Context

Motivação e escopo em `proposal.md`; requisitos testáveis em `specs/pwa-app-icons/spec.md`.

Estado atual: `vite.config.ts` usa `VitePWA` com `manifest.icons: []`; `index.html` só tem `theme-color` (`#0b0d17`).
O HUD define a linguagem visual: paleta em `src/styles.css` (`--bg #050c1f`, `--bg2 #0a1a3a`, `--panel #0d2147`,
`--line #2f7fd8`) e o chanfro de 12 px (`--chamfer`). O ambiente não tem `magick`, `rsvg-convert` nem `sharp`,
mas o projeto já depende de Playwright (`proto/webkit-e2e.mjs`).

Desenho aprovado na exploração (variação 4A, com os ajustes do centro chapado e das pontas retas) em coordenadas do ankh
800×1000, laço e braços simétricos em torno de x=400:

- Laço (`fill-rule: evenodd`): contorno `M335,432 C175,250 255,20 400,20 C545,20 625,250 465,432 Z`,
  furo `M400,372 C300,250 318,95 400,95 C482,95 500,250 400,372 Z`.
- Braço esquerdo `40,385 335,432 400,470 335,508 40,555`; direito espelhado (`760,385 465,432 400,470 465,508 760,555`).
- Haste `M335,508 L400,470 L465,508 Q448,800 550,960 L250,960 Q352,800 335,508 Z`.
- Bloco central `x=335 y=400 w=130 h=108`: cobre a junção (e a linha de fechamento do laço em y=432), com a largura exata do centro para não deixar degrau.
- Preenchimento: degradê vertical (userSpaceOnUse, y 20 → 960) `#8cc2ff` → `#2a6fe0`. Contorno: o mesmo conjunto desenhado
  antes com `stroke #bfe0ff` de 22 unidades; assim o contorno aparece só na borda externa e na do laço, nunca na junção.
- Placa (em 100×100): polígono `22,12 88,12 88,78 78,88 12,88 12,22`, preenchimento `#0d2147` a 85%, borda `#2f7fd8` de 2,5;
  ankh a escala 0,056 centrado. Fundo: `#0a1a3a` → `#050c1f` com brilho radial `#2f7fd8` a 70% → 0.

## Goals / Non-Goals

**Goals:**
- Uma única fonte vetorial versionada; todos os PNG/ICO saem dela por script reprodutível, sem ferramenta nova.
- Resultado legível de 16 px a 512 px e correto nas máscaras do iOS e do Android.

**Non-Goals:**
- Splash screens do iOS (`apple-touch-startup-image`) e ícones de atalho (`shortcuts`) do manifest.
- Variantes de tema claro/escuro do ícone.
- Mudar o nome do app ou a arte dentro do jogo.

## Decisions

- **Fonte em `assets/app-icon/` com três SVG** (`icon.svg` com placa, `icon-small.svg` sem placa, `icon-maskable.svg`),
  em vez de um SVG só com variantes por CSS. Cada alvo tem margens e arredondamento próprios (ver abaixo), e um
  arquivo por alvo deixa o script trivial e a revisão visual direta. Alternativa descartada: gerar tudo de um SVG
  parametrizado em JS, que esconde o desenho em código.
- **Rasterização com Playwright (Chromium)** abrindo cada SVG numa página do tamanho do alvo e fazendo `screenshot`
  com `omitBackground` quando houver transparência. Alternativas: `sharp` (dependência nativa nova) e `@vite-pwa/assets-generator`
  (traz `sharp` e impõe o próprio desenho de máscara). Playwright já está instalado e renderiza os degradês com fidelidade.
- **ICO montado à mão no script** (cabeçalho ICONDIR + entradas PNG de 16, 32 e 48 px). O formato aceita PNG embutido
  desde o Windows Vista, então não precisa de biblioteca. Os tamanhos de até 48 px usam `icon-small.svg` (sem placa).
- **Alvos e arredondamento:**
  - `icon.svg` (também servido como favicon SVG): cantos arredondados `rx=22` do quadro de 100; o SVG funciona em abas modernas.
  - `apple-touch-icon.png` 180×180: **quadrado cheio e opaco**; o iOS aplica a própria máscara e pinta de preto o que for transparente.
  - `icon-192.png` / `icon-512.png` (`any`): mesmo desenho do `icon.svg`, com cantos transparentes.
  - `icon-maskable-512.png`: fundo cheio até a borda e a placa reduzida (~0,72) para ficar dentro do círculo de segurança
    de 80% (raio 40% do lado); a placa tem diagonal maior que o raio, então a escala precisa ser conferida no gerador de teste.
- **Saída em `public/icons/`**, mais `public/favicon.ico` na raiz (alguns clientes pedem `/favicon.ico` sem ler o HTML).
  O Vite copia `public/` para `dist/` como está; os caminhos no HTML e no manifest ficam relativos à base do app.
- **Manifest e HTML:** `icons` declarados em `VitePWA({ manifest })`; `includeAssets` lista o favicon e o `apple-touch-icon`
  para entrarem na pré-carga; `globPatterns` ganha `png,ico`. O `<meta name="theme-color">` e as cores do manifest passam a `#050c1f`.
- **Gerar uma vez e versionar os binários** (PNG/ICO são pequenos, arte própria). O script só roda quando o desenho muda;
  não entra no `npm run build`, evitando exigir Playwright/Chromium no deploy.

## Risks / Trade-offs

- [Os 16 px da aba ficam borrados mesmo sem a placa] → conferir a prévia em 16/32 px do `icon-small.svg` e, se preciso,
  ampliar o ankh ou engrossar o contorno só nessa versão.
- [Placa cortada pela máscara do Android] → validar o maskable no Maskable.app / DevTools (Application → Manifest) e
  reduzir a escala se a placa tocar a borda do círculo.
- [Fundo preto no iOS se o PNG tiver alfa] → gerar o `apple-touch-icon` sem canal alfa e checar a profundidade de cor do arquivo.
- [Cache antigo do service worker mantém o ícone velho] → o PWA já se atualiza sozinho (`registerSW({ immediate: true })`);
  conferir após o deploy que o manifest novo foi pego e, no iOS, reinstalar o atalho (o iOS guarda o ícone na instalação).
- [Chromium do Playwright ausente na máquina] → o script falha com mensagem clara e pede `npx playwright install chromium`.

## Migration Plan

1. Criar as fontes SVG e o script, gerar os arquivos, conferir visualmente.
2. Ligar `index.html` e `vite.config.ts`; rodar `npx tsc --noEmit` e `npx vite build`.
3. Conferir no preview: favicon na aba, manifest sem avisos no DevTools, ícone maskable.
4. Conferir no simulador de iOS (Adicionar à Tela de Início) e, se possível, no Android.

Reversão: remover os links do `index.html` e esvaziar `manifest.icons`; os arquivos em `public/icons/` podem ficar sem efeito.
