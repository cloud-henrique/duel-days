# Proposal

## Why

O ícone do app hoje é a carta da Polimerização inteira: na aba (16/32 px) e na tela de início a carta vira um retângulo
claro com uma mancha roxa, e o que identifica o jogo (o redemoinho) ocupa menos de um terço do quadro. Além disso, o spec
`pwa-app-icons` ainda descreve o ankh com placa chanfrada, que foi trocado pela carta sem que o spec acompanhasse.

## What Changes

- O ícone passa a ser **só o redemoinho** da Polimerização (a mesma silhueta da carta do título), em ciano com degradê
  branco → ciano, sobre o fundo escuro do HUD (`#0a1a3a` → `#050c1f`). Some a carta e a moldura.
- Layout no padrão dos ícones de app da Apple: arte desenhada em quadro de 1024, `apple-touch-icon` **quadrado cheio e
  opaco** (o iOS aplica a máscara arredondada), glifo em ~72% da largura e no centro óptico.
- A silhueta original, que é um recorte de textura e encosta nas bordas, é **recortada num disco** para virar um glifo
  fechado.
- Nos tamanhos de 48 px ou menos (favicon 16/32/48), um **glifo simplificado** (menos voltas, faixas grossas) sobre uma
  placa escura, para continuar legível em aba clara e escura.
- O maskable do Android mantém o redemoinho inteiro dentro da zona segura de 80%.
- Acabamento **plano**: o brilho Liquid Glass do Icon Composer fica fora desta change (o PWA no iOS só usa o PNG do
  `apple-touch-icon`, sem variantes escuro/tingido).
- Corrige o CLAUDE.md, que ainda fala em "ankh em HUD azul".

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `pwa-app-icons`: o desenho do ícone (ankh/placa → redemoinho ciano sem placa), a versão pequena (glifo simplificado),
  o layout do `apple-touch-icon` (quadrado cheio, glifo no grid) e os cenários do maskable e do favicon que citam o ankh.

## Impact

- `assets/app-icon/icon.svg`, `icon-maskable.svg`, `icon-small.svg` (reescritos; o glifo pequeno é desenho novo).
- `scripts/build_app_icons.mjs` (rasterizar a partir do quadro de 1024; o resto do fluxo continua).
- `public/icons/*` e `public/favicon.ico` (regerados, versionados).
- `CLAUDE.md` (descrição do ícone).
- Nada muda no `index.html`, no manifest, nas cores de tema nem na pré-carga do service worker.
