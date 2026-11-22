# Design

## Context

Veja proposal.md (Why). A change `layout-desktop` já entregou:
- `WIDE_QUERY`, `useWide` e `useHover` em `src/ui/wide.ts`, com o teste que obriga todo `@media` de tela larga a usar a
  mesma string;
- o `CardInfo` (miolo da folha da carta), reaproveitável;
- o padrão de painel fixo com hover/fixar do duelo.

Estado atual que molda a abordagem:
- **Grade virtual** (`src/ui/virtualGrid.ts`): a altura da linha vem de `rowHeight(width, {cols, gap, padX, border})`, e
  o `TrunkGrid` passa `GRID.cols = 4` fixo. O CSS `.vgrid`/`.cardgrid` repete o `repeat(4, 1fr)`. As colunas existem
  nos dois lados e precisam bater.
- **Editor**: o `useDrawer` controla a altura do `.deckpanel` em px (3 posições, `oneRow` supõe 6 colunas). O `CardZoom`
  é um modal com `children` para os botões (o editor põe "Pôr"/"Tirar" ali). O `useCardDrag` arma depois de 300ms
  segurando, sem distinguir dedo de mouse. Os alvos de soltar são `[data-drop]` e não dependem do layout.
- **Outras telas**: não há JS de tamanho, só CSS (grades de 1 coluna, botões `flex:1`/`width:100%`, `.shopgrid` com 3
  colunas, `.packcards` e `.cardgrid` com 4). O `MapScreen` centraliza o `scrollLeft` só quando a imagem carrega.

## Goals / Non-Goals

**Goals:**
- Uma regra de colunas única para as grades de cartas, pela largura e pelo tamanho escolhido, com o CSS e o JS lendo o
  mesmo número.
- O retrato idêntico ao de hoje: `deck-e2e`, `shop-e2e` e as specs atuais do celular seguem valendo.
- O painel da carta do editor e da Coleção é o mesmo componente, e conversa com o do duelo.

**Non-Goals:**
- Tamanho P/M/G no retrato (fica com as colunas de hoje).
- Atalhos de teclado além de Esc, e arrastar várias cartas de uma vez.
- Refazer o visual de nenhuma tela: só disposição e medidas.

## Decisions

### 1. Tamanho das cartas: P/M/G vira largura-alvo, e as colunas saem dela

`CARD_SIZES = { P: 84, M: 108, G: 148 }` (px, a largura de uma carta) em `src/ui/cardSize.ts`, com `useCardSize()`
(sobre o `useStored` do editor, chave `duel-days.cardSize`, `M` por padrão). A função pura
`colsFor(width, target, gap, padX) = max(2, floor((width - padX + gap) / (target + gap)))` dá as colunas.

- **Grade virtual**: o `TrunkGrid` mede a largura (já mede, pelo `useVirtualGrid`). Na tela larga, passa `cols =
  colsFor(...)` para o `gridRange` e grava `--cols` inline no `.vgrid`. O CSS usa `repeat(var(--cols, 4), 1fr)`, e
  assim o JS é a fonte única. No retrato, `cols = 4` como hoje.
- **Grades sem virtualização** (painel do deck, cartas do pacote, resumo): CSS puro,
  `repeat(auto-fill, minmax(var(--card-w), 1fr))`, com `--card-w` vindo do tamanho escolhido num contêiner comum.
- *Alternativa*: `auto-fill` também na grade virtual, lendo o número de colunas do DOM. Foi descartada porque a
  virtualização precisa das colunas antes de montar as células. Medir o resultado do CSS seria um passo a mais e
  oscilaria no redimensionamento.
- **Controle**: um botão de 3 estados (ícone de grade P/M/G) na `TrunkBar` (editor e Coleção) e no cabeçalho do
  detalhe do pacote, só na tela larga. É o mesmo ajuste nos três lugares.

### 2. Editor: outra composição na tela larga, sem gaveta

O `DeckEditor` escolhe a composição pelo `useWide()`, como o `DuelScreen`:

```
+----------------------------------------------------------------------------+
| TopBar (Meu deck, decks)  ·  .deckhead (Main 30 · Extra 0 · PRONTO)        |
+------------------------+-------------------------------+-------------------+
| .deckpanel (rola)      | TrunkBar (ordem, filtro, P/M/G)| DeckCardPanel     |
| grupos em auto-fill    | TrunkGrid (virtual, --cols)    | CardInfo vertical |
| data-drop="deck"       | data-drop="trunk"              | No deck X · Tem Y |
|                        |                                | [Tirar] [Pôr]     |
+------------------------+-------------------------------+-------------------+
```

- O `useDrawer` só monta no retrato. A altura do `.deckpanel` deixa de ser inline e vira `flex: 1` com rolagem própria.
  O `localStorage` da gaveta não é tocado.
- Larguras: deck `minmax(0, 1fr)`, maleta `minmax(0, 1.4fr)`, painel `clamp(260px, 22vw, 340px)`.
- **Painel** (`DeckCardPanel`, novo em `src/screens/deck/`): `CardInfo vertical` + a linha "No deck X · Você tem Y" e os
  botões que hoje vão como `children` do `CardZoom`. Extraio esses botões para um componente (`ZoomActions`) usado pelo
  zoom do retrato e pelo painel. A Coleção usa o mesmo painel sem os botões.
- **Hover/fixar**: igual ao duelo (`hover ?? pinned`, Esc solta). As células já são `<button>` com o código, e
  `onPointerEnter` vem pelo `bind(code)` que o `TrunkGrid` já repassa. No painel do deck, os botões ganham os mesmos
  ouvintes.

### 3. Arrastar com mouse

No `useCardDrag`, o `pointerdown` com `pointerType === 'mouse'` arma ao passar de ~4px de movimento, sem o timer de
300ms. Com mouse não há rolagem por arraste a proteger: a roda rola. Com dedo ou caneta, fica como hoje. O resto
(fantasma no portal, `elementFromPoint`, `[data-drop]`, o clique seguinte engolido) não muda.

- Clique simples (sem mover) continua sendo clique e fixa a carta no painel.

### 4. Telas de lista e botões: uma coluna central

Sob o `@media` de tela larga, a coluna central vem de `padding-inline: max(margem, (100% - 640px) / 2)`. Assim o fundo e
a rolagem continuam na tela inteira, e o conteúdo fica com no máximo 640px.

- **Boas-vindas, perfil e ajustes** (`.app.screen`): o `.screen-scroll` e o `.screen-foot` ficam na coluna. A
  `TopBar` continua de ponta a ponta.
- **Status e fim** (`.app.status`, `.app.campend`): a tela inteira fica na coluna, inclusive a barra do topo, que nessas
  telas faz parte da lista.
- **Duelo interrompido** (`.app.menu`): a tela inteira fica na coluna.
- **Título**: `.titlebtns` com `width: min(100%, 640px)` centrado.
- **Laços**: `.bondlist` vira `grid-template-columns: repeat(2, minmax(0, 1fr))` com `width: min(100%, 1100px)`.
- A `.avatargrid` fica limitada pela coluna (cerca de 9 por linha).

### 5. Loja e mapa

- `.shopgrid`: `repeat(auto-fill, minmax(150px, 190px))` centrada, o que limita a capa a ~190×304.
- `.shopscroll` com `max-width: 1100px` centrado. O balcão fica nessa largura, com o fundo `cover` sem cortar o vovô.
- No detalhe do pacote, as cartas usam o tamanho P/M/G (item 1), e a `.buybar` tem largura máxima centrada.
- O resumo da abertura usa P/M/G. A revelação já tem limite.
- Mapa: `.pinhead` em `clamp(52px, 4.2vw, 72px)` só na tela larga, e `.mapnav` com `max-width: 720px` centrado. O
  `MapScreen` centraliza de novo no `resize` (um ouvinte, só se o jogador não rolou o mapa).

### 6. Limpeza

Removo de `styles.css` os seletores `.hub`, `.hublist`, `.loc`, `.charchip` e `.hubnav`, depois de confirmar com um
grep que nenhum `.tsx` os usa.

## Risks / Trade-offs

- [As colunas da grade virtual e do CSS se separarem] → `--cols` inline vem do mesmo número passado ao `gridRange`. Um
  teste confere que a altura da linha calculada é a da célula medida em 1440 px.
- [Hover em grade virtual que rola: a célula sob o ponteiro muda sem `pointerenter`] → O hover só atualiza o painel e é
  inofensivo. No `scroll`, limpar o hover (volta à carta fixada).
- [Arraste com mouse disparando em cliques trêmulos] → O limiar de 4px. O clique sem movimento continua sendo clique.
- [O `deck-e2e` e o `shop-e2e` dependem de seletores do retrato] → Rodam no retrato sem mudança. Um e2e novo cobre a
  tela larga.
- [P/M/G em tela muito estreita, como um tablet de 900px com G] → `colsFor` garante no mínimo 2 colunas.

## Migration Plan

Só front-end. O ajuste de tamanho é uma chave nova no `localStorage`: se faltar, vale M. Deploy normal pelo `wrangler`.
