# Tasks

## 1. Tamanho das cartas e colunas pela largura

- [x] 1.1 Criar `src/ui/cardSize.ts`: `CARD_SIZES` (P 84, M 108, G 148), `colsFor(width, target, gap, padX)` (mínimo 2) e o `useCardSize()` lembrado no aparelho (`duel-days.cardSize`, M por padrão). Verificar com teste Vitest de `colsFor` (1440, 900 e o mínimo de 2) e do valor padrão.
- [x] 1.2 `TrunkGrid`/`useVirtualGrid`: na tela larga, `cols = colsFor(largura medida, tamanho)` vai para o `gridRange` e para o `--cols` inline. O `.vgrid`/`.cardgrid` passa a usar `repeat(var(--cols, 4), 1fr)`, e o retrato continua com 4. Verificar com `virtualGrid.test.ts` (altura da linha com N colunas) e no navegador em 1440×900, com a maleta rolando até o fim sem buracos.
- [x] 1.3 Controle P/M/G (botão de 3 estados com `GameIcon`) na `TrunkBar`, visível só na tela larga. Verificar no navegador que trocar muda as colunas e fica lembrado ao recarregar.

## 2. Editor de deck em três colunas

- [x] 2.1 Extrair do `DeckEditor` os botões do zoom ("No deck X · Você tem Y", Tirar, Pôr) para um componente usado pelo `CardZoom` do retrato. Verificar com `npm test` e `node proto/deck-e2e.mjs` no retrato sem diferença.
- [x] 2.2 `DeckCardPanel` (`CardInfo` vertical + botões, ou só leitura) e a composição de tela larga do `DeckEditor` (deck | maleta | painel), sem `useDrawer`. O `.deckpanel` com rolagem própria e o painel do deck em `auto-fill` pelo `--card-w`. Verificar no navegador em 1440×900, 1280×650 e 1024×768: as 3 colunas e nada transbordando.
- [x] 2.3 Hover/fixar no editor: `onPointerEnter` pelo `bind` das células e no painel do deck (só com `useHover`), clique fixa, Esc solta, rolar a maleta limpa o hover. Na tela larga, sem `CardZoom`. Verificar com teste de componente do painel e no navegador (pôr e tirar pelo painel).
- [x] 2.4 `useCardDrag`: com `pointerType === 'mouse'`, armar ao passar de 4px, sem o timer. Com dedo, fica como hoje. Verificar com teste (mouse arma ao mover e clique sem mover não arma; toque continua esperando 300ms) e no navegador arrastando da maleta para o deck e de volta.
- [x] 2.5 Atualizar o CLAUDE.md (editor: composição de tela larga, `cardSize.ts`, arrasto com mouse) e verificar que bate com o código.

## 3. Coleção

- [x] 3.1 `CollectionScreen` na tela larga: totais e maleta à esquerda, `DeckCardPanel` só leitura à direita, sem zoom. Verificar no navegador: hover e clique mostram a carta sem "Pôr no deck", e o P/M/G vale aqui também.

## 4. Loja

- [x] 4.1 `shop.css` sob o `@media` de tela larga: `.shopscroll` com largura máxima centrada, `.shopgrid` em `auto-fill` com capa de no máximo ~190px, balcão sem cortar o vovô. Verificar no navegador em 1440×900 (`?campaign=shop`).
- [x] 4.2 Detalhe do pacote: `.packcards` pelo `--card-w` (P/M/G, com o controle no cabeçalho), `.buybar` com largura máxima. Resumo da abertura (`Summary`) pelo `--card-w`. Verificar no navegador e com `node proto/shop-e2e.mjs` no retrato sem diferença.

## 5. Mapa e telas de lista

- [x] 5.1 Mapa: `.pinhead` maior e `.mapnav` com largura máxima na tela larga. O `MapScreen` centraliza de novo no `resize` se o jogador não rolou. Verificar no navegador redimensionando a janela.
- [x] 5.2 Coluna central de ~640px na tela larga para o título (`.titlebtns`), boas-vindas, perfil e ajustes (`.screen-scroll`, `.panelbox`, `.screen-foot`), status, fim (`.statlist`, `.campend`) e duelo interrompido. Verificar cada tela no navegador em 1440×900, e em 390×844 sem mudança.
- [x] 5.3 Laços em 2 colunas (`.bondlist`) com largura máxima. Verificar no navegador com `?campaign=bond`.
- [x] 5.4 Remover o CSS morto (`.hub`, `.hublist`, `.loc`, `.charchip`, `.hubnav`) depois de um grep sem uso em `.tsx`. Verificar com `npm test` (paleta) e `npx vite build`.

## 6. Integração

- [x] 6.1 Novo `proto/screens-e2e.mjs` (WebKit): em 1440×900, 1280×650 e 1024×768, abrir título, editor, Coleção, loja, detalhe do pacote, mapa e Laços, e conferir que não há rolagem horizontal, que os botões não passam da largura máxima, as 3 colunas do editor e a capa da vitrine ≤ 190px. Verificar rodando o script.
- [x] 6.2 Rodar `npx tsc --noEmit`, `npm test`, `npx vite build`, `node proto/deck-e2e.mjs`, `node proto/shop-e2e.mjs` e `node proto/layout-e2e.mjs` sem falhas.

## Workflow follow-up

- Deploy pelo `wrangler` depois do push.
- Arquivar a change (`/opsx:archive`) depois de conferida no desktop.
