# Design

## Context

- `src/screens/DeckBuilder.tsx` (160 linhas): seletor `<select>` + nome editável + novo/apagar no topo, contagem e
  "Usar", lista de problemas, abas "Coleção" / "Deste deck", busca, `<select>` de ordem (nome, ATK, nível, raridade),
  chips de tipo e uma grade virtualizada (`useVirtualGrid`, 4 colunas, cópias uma a uma, marca de "no deck") que abre o
  `CardZoom` com Pôr/Tirar. Até 5 decks (`MAX_DECKS`), grava pelo `onChange` a cada mudança.
- Regras em `src/game/decks.ts` (`validateDeck`, `maxCopiesOf`, `isExtraCard`, `MAIN_MAX`, `EXTRA_MAX`); a coleção está
  em `CampaignState.collection`; `addCards` (state.ts) é o único lugar onde cartas entram.
- Referência: prints `37-editor-de-deck` e `38-colecao`, e no nativo `Decks/DeckEditorView`, `DeckPanel`, `CardTrunk`,
  `TrunkSort`, `DeckDrawer` (posições e alturas), `DeckIssueBadge`, `Campaign/CampaignCollectionView`.
- Padrões já firmados: camada de fantasmas como portal no `body` (o `.duel` é contêiner, e o editor também pode ter
  `transform` em pais); iOS só entrega toques confiáveis a `<button>`; sem `filter` em 3D; tempos num objeto de pacing.

## Goals / Non-Goals

**Goals:**
- Editor e Coleção com o visual e o fluxo do nativo, mantendo as escolhas da PWA (5 decks, cópias uma a uma).
- Arrastar que funcione com toque no iOS sem quebrar a rolagem nem o toque rápido.
- Ordenação, agrupamento e recusa como funções puras testadas.

**Non-Goals:**
- Ícone do tipo de monstro no canto da carta na ordem "Tipo de monstro" (o nativo tem; fica para depois).
- Busca pelo nome em inglês (a base só guarda o nome em português).
- Bloquear o editor com a campanha concluída (hoje edita; continua).
- Vibração (o Safari do iOS não tem `navigator.vibrate`).

## Decisions

1. **Pasta `src/screens/deck/`**: `DeckEditor` (compõe), `DeckHeader` (contagens, selo, seletor), `DeckSheet` (folha dos
   decks), `IssuesDialog`, `DeckPanel` (grupos), `Trunk` (maleta com a grade virtualizada), `TrunkBar` (ordem, inverter,
   busca, chips), `useDrawer` (posição da gaveta), `useCardDrag` (arrastar), `trunk.ts` (puro), `deck.css`. A grade e a
   barra da maleta são as mesmas na `CollectionScreen` (sem arrastar nem marca). O `DeckBuilder.tsx` sai.
2. **`trunk.ts` puro**: `TrunkSort = { key, reversed }` com as 10 chaves do nativo; `sortCodes(codes, sort, ctx)` com
   `ctx = { cards, tiers, owned, acquired }`; monstros primeiro nas chaves de monstro; desempate tipo → nível → nome →
   id; `filterCode(card, kind, query)`; `deckGroups(deck, cards)` → `[{ title, codes }]` (Normal, Efeito/Ritual, Magia,
   Armadilha; Extra à parte); `trunkSummary(sort, kind, query)` para a alça. A ordem e a posição da gaveta ficam no
   `localStorage` (try/catch), não no save.
3. **Recusa com motivo** em `decks.ts`: `addRefusal(deck, code, cards, owned): string | null` com as quatro mensagens do
   nativo; o zoom usa `!addRefusal(...)` para habilitar "Pôr no deck", o arrastar mostra a mensagem num aviso (toast) de
   1,6 s.
4. **Ordem de obtenção**: `CampaignState.acquired?: number[]`; `addCards` acrescenta o id quando a carta não tinha cópia;
   `newCampaign` começa com as cartas do deck inicial. Sem o campo (save antigo), "Obtenção" usa o id como reserva e o
   campo nasce na próxima carta nova. Sem migração nem versão nova.
5. **Gaveta**: a tela é uma coluna (`TopBar`, cabeçalho, painel do deck, alça, maleta). A altura do painel sai da posição
   (`collapsed`: tudo menos a alça de 62 px; `middle`: 40% da área; `open`: uma linha de cartas). A alça é um `<button>`
   (toque alterna meio ↔ aberta e recolhida → meio) com arraste por pointer events que encaixa na posição mais próxima;
   transição de altura em `DECK_PACING.drawerMs`, sem animação com movimento reduzido.
6. **Arrastar (`useCardDrag`)**: pointer events em cada carta. `pointerdown` arma um temporizador de 300 ms
   (`DECK_PACING.holdMs`); mover mais de 8 px antes disso cancela (é rolagem). Ao armar, cria a fantasma (clone da face,
   escala 1.1, sombra) num portal `position: fixed` no `body`, marca o arraste e passa a impedir a rolagem com um
   `touchmove` não passivo enquanto durar. No `pointerup`, `document.elementFromPoint` acha o alvo
   (`[data-drop="deck"]` ou `[data-drop="trunk"]`); solto no lugar certo chama pôr/tirar, senão a fantasma volta à
   origem em `DECK_PACING.flyMs` e some. O `click` que vem depois de um arraste é engolido. As cartas usam
   `-webkit-touch-callout: none` para o iOS não abrir o menu de imagem ao segurar.
7. **Seletor e folha dos decks**: no cabeçalho, um botão com o nome do deck em edição e "Em uso"; a folha (painel modal
   com `Backdrop`) lista os decks e tem Novo, Renomear (campo inline, até 20 caracteres), Apagar (confirmação) e "Usar
   este deck" (só com o deck válido). Mesmo modal da loja: extrair `shopmodal` para um `Modal` em `src/ui/` usado pelos
   dois.
8. **Coleção** (`src/screens/campaign/CollectionScreen.tsx`): totais num painel e a grade com `TrunkBar`; tela
   `{ v: 'collection'; back }` no `App`, música do mapa.
9. **Opções do mapa**: o botão de menu do `CampaignHeader` abre um painel "Opções" (o do print 41) com Status da campanha,
   Voltar ao título e Fechar; a barra de baixo vira Deck, Coleção, Laços, Loja.
10. **Sons**: `copy_sounds.py` com `card-add` e `card-remove`; `sfx.ts` com `cardAdd`/`cardRemove` em `UiSound`. Os botões
   das cartas têm `data-sound="none"` (o zoom e o arrastar tocam o próprio som).

## Risks / Trade-offs

- **Arrastar no iOS**: segurar + rolar é o ponto delicado (o Safari decide a rolagem cedo). Mitigação: só impedir a
  rolagem depois de armar, `touch-action: pan-y` na grade, conferir no simulador e anotar no relatório. Se não ficar
  confiável, o zoom com Pôr/Tirar continua sendo o caminho principal.
- **Gaveta + grade virtualizada**: a maleta muda de altura; o `useVirtualGrid` já recalcula no `resize` do contêiner
  (confirmar com `ResizeObserver`).
- **Coleção com milhares de cópias** (`?campaign=all-cards`): a mesma grade virtualizada de hoje, sem regressão de FPS.
- **Status fora da barra** é menos visível; fica a um toque nas Opções.
