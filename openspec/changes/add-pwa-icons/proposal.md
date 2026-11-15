# Proposal

## Why

O PWA não tem nenhum ícone: o manifest está com `icons: []` e o `index.html` não declara favicon nem `apple-touch-icon`.
No iOS a tela de início usa uma captura da tela, e no Android o navegador não oferece a instalação como app de verdade
(faltam os ícones de 192 e 512 px). O jogo é instalado por ~4 amigos, então o ícone é a primeira coisa que eles veem.

## What Changes

- Novo ícone do app: o **ankh** (cruz ansata) em estilo HUD azul liso, sobre uma **placa chanfrada** com brilho radial,
  no fundo escuro do HUD (variação 4A aprovada na exploração).
  - Ankh com degradê vertical `#8cc2ff` → `#2a6fe0`, contorno claro `#bfe0ff`, **sem facetas nem linhas internas**.
  - Pontas dos braços **retas** (sem entalhe em V) e centro chapado, sem degrau na junção.
  - Placa chanfrada (mesma linguagem do `--chamfer` do HUD) com borda `#2f7fd8`; fundo `#050c1f` → `#0a1a3a`.
- Arquivos gerados a partir de um SVG-fonte único: `icon.svg`, `favicon.ico` (16/32/48), `apple-touch-icon` 180×180
  (sem transparência), `icon-192.png`, `icon-512.png` e `icon-maskable-512.png` (zona segura de 80%).
- Para 16 e 32 px, uma versão simplificada **sem a placa** (só o ankh sobre o fundo) para manter a legibilidade.
- `index.html` passa a declarar `<link rel="icon">` (SVG e ICO) e `apple-touch-icon`.
- Manifest: preencher `icons` e alinhar `theme_color`/`background_color` ao HUD (`#050c1f`, hoje `#0b0d17`).
- Script reprodutível de geração dos PNG/ICO (rasterização com Playwright, já presente no projeto).

## Capabilities

### New Capabilities
- `pwa-app-icons`: identidade visual do app instalado: ícone, favicon, ícone do iOS, ícones do manifest (any/maskable)
  e cores de tema do manifest.

### Modified Capabilities

(nenhuma)

## Impact

- `index.html` (links de ícone e `theme-color`) e `vite.config.ts` (`manifest.icons`, cores).
- Novos arquivos em `public/icons/` (ícones são arte própria, podem ser versionados) e fonte SVG + script em `scripts/`.
- `workbox.globPatterns` já inclui `svg`; PNG/ICO dos ícones precisam entrar na pré-carga (ajuste de `globPatterns`/`includeAssets`).
- Sem mudança de lógica do jogo nem de dependências novas (Playwright já está no projeto).
- Não envolve material da Konami: o ankh é desenho próprio, então não há restrição de `.gitignore`.
