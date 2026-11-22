# Proposal

## Why

A change `layout-desktop` levou o encontro e o duelo para a tela larga. As outras telas continuam desenhadas só para o
celular em pé e, num monitor, esticam:
- as grades de cartas têm um número fixo de colunas e as cartas crescem com a tela (a maleta com cartas de ~355px, a
  vitrine com capas de ~450×720);
- o editor divide a altura numa gaveta vertical e desperdiça a largura;
- listas e botões ocupam os 1440px.

## What Changes

- Todas estas telas usam o mesmo critério de tela larga (`WIDE_QUERY`, paisagem ≥ 900×600). Fora dela, nada muda.
- **Editor de deck** em 3 colunas, sem gaveta: o deck à esquerda, a maleta (barra de ordem, filtro e busca) no meio, e
  o painel da carta à direita. Passar o mouse mostra a carta, clicar fixa. "Pôr no deck" e "Tirar do deck" ficam no
  painel, no lugar do zoom modal. Arrastar entre deck e maleta continua valendo, e com mouse o arraste começa ao mover
  com o botão apertado, sem a espera de 300ms do toque.
- **Tamanho das cartas** ajustável na tela larga (P, M ou G, lembrado no aparelho, M por padrão). Vale para o deck e a
  maleta do editor, a grade da Coleção, as cartas do detalhe do pacote e o resumo da abertura. As colunas saem da
  largura disponível dividida pelo tamanho escolhido.
- **Coleção**: a mesma maleta com o painel lateral da carta (só leitura).
- **Loja**: capas da vitrine com teto de tamanho, balcão e conteúdo com largura máxima, e a barra de compra do detalhe
  do pacote contida.
- **Mapa**: cabeças maiores e barra de atalhos com largura máxima. Ao redimensionar, o mapa volta a se centralizar.
- **Telas de lista e botões** (título, boas-vindas, perfil, ajustes, status, fim da campanha, duelo interrompido): uma
  coluna central com largura máxima, com botões de largura contida.
- **Laços**: os cartões dos duelistas em 2 colunas.
- Limpeza: some o CSS morto do mapa antigo (`.hub`, `.hublist`, `.loc`, `.charchip`, `.hubnav`).

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `editor-de-deck`: editor em 3 colunas na tela larga; a gaveta, as 6 colunas fixas do painel e o zoom passam a valer
  só no retrato; arrastar com mouse.
- `grade-de-cartas`: as 4 colunas fixas valem só no retrato; na tela larga, as colunas saem do tamanho P/M/G.
- `colecao`: painel lateral da carta na tela larga, no lugar do zoom.
- `loja-de-pacotes`: vitrine, balcão, detalhe do pacote e resumo da abertura na tela larga.
- `tela-de-titulo`: título e ajustes em coluna central na tela larga.
- `perfil-do-jogador`: boas-vindas e perfil em coluna central na tela larga.
- `lacos`: tela de Laços em 2 colunas na tela larga.
- `campanha`: mapa, status, fim e duelo interrompido na tela larga.

## Impact

- CSS: `deck/deck.css`, `campaign/campaign.css`, `shop/shop.css`, `title/title.css`, `styles.css` (`.screen-scroll`,
  `.panelbox`, `.cardgrid`/`.vgrid`, a limpeza do CSS morto), `cardzoom.css`.
- React/TS:
  - `DeckEditor.tsx`: composição de tela larga, painel, sem `useDrawer`.
  - `useCardDrag.ts`: com mouse, arma sem a espera.
  - `TrunkGrid.tsx` e `virtualGrid.ts`: colunas pela largura e pelo tamanho.
  - `CollectionScreen.tsx`, `PackDetail.tsx`, `OpeningFlow.tsx` (resumo) e `MapScreen.tsx` (centralizar ao
    redimensionar).
  - Um controle P/M/G na barra da maleta e no detalhe do pacote.
  - Reaproveita `useWide`/`useHover` (`src/ui/wide.ts`) e o `CardInfo`/painel da change anterior.
- Testes:
  - `virtualGrid.test.ts` (colunas pela largura);
  - teste do arraste com mouse;
  - um e2e de layout das telas em 1440×900, 1280×650 e 1024×768;
  - `deck-e2e.mjs` e `shop-e2e.mjs` continuam passando no retrato.
- Sem mudança no motor, no save nem nas regras do deck.
