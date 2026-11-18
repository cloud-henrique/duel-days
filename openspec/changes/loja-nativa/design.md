# Design

## Context

- `src/screens/ShopScreen.tsx` (118 linhas) faz tudo numa tela: lista de painéis, compra e uma grade de resultado. O
  modelo (`src/campaign/packs.ts`) já tem o que importa e é puro: `collectionListing`/`characterListing` (com `Lock` e
  `isNew`), `price`/`boxPrice`, `canBuy`/`missingDP`, `buy`/`buyBox`/`openUnopened` (gravam DP e cartas e devolvem
  `PackOpening` com `pulls` e `isNew`), `hasUltra`.
- As falas do balconista já estão em `dialogue.json` → `shopkeeper` (`character: solomon`; `welcome`, `boughtPack`,
  `boughtBox`, `pulledUltra`, `noFunds`, com expressão). O sprite do Solomon existe (`chars.ts` → `solomon_muto`) e o
  `Sprite` do `Dialogue.tsx` monta corpo + rosto. `fillText` resolve `{nome}` e `{m|f|n}`.
- Peças visuais prontas: `TopBar` (com voltar), `.hud`/`.hud-btn`, `Dp`, `GameIcon`, `CardFace`/`CardBack`,
  `CardSheet`/`CardZoom`, `Backdrop`, `useVirtualGrid`, `.hexbg`. Capas em `public/campaign/pack-*.jpg` (LOB, MRD, MRL,
  PSV, LOD, PGD; falta LON) e o fundo `bg-loja-de-jogos.jpg`, fora do git.
- "Reduzir movimento" hoje é só o do sistema (`useReducedMotion`, em `screens/duel/anim/`).
- Referência: prints `docs/nativo/prints/31..36` e o nativo em `App/DuelAcademy/Campaign/Shop/` (`ShopCounter`,
  `CampaignShopView`, `ShopPackDetailView`, `PackOpeningView`, `PackOpeningSequence`, `PackReveal`, `BoxSummaryView`).

## Goals / Non-Goals

**Goals:**
- Loja, detalhe do pacote e abertura com o visual e o fluxo do nativo, no celular (iPhone 11 Pro como alvo de medida).
- Encenação com estados puros e testáveis (sequência de pacotes, cartas viradas), como foi feito no duelo.

**Non-Goals:**
- Mudar preço, liberação, sorteio ou composição (spec `economia-dp`).
- Balconistas alternativos (o nativo tem Sadie/Dorothy na Academia GX) e pacote de balconista.
- Editor de deck e tela Coleção (change seguinte).
- Arte nova: a caixa desenhada do nativo (`ShopBoxArt`) vira só a capa pequena no botão.

## Decisions

1. **Pasta `src/screens/shop/`** com `ShopScreen` (vitrine), `ShopCounter` (balcão, tamanho `tall`/`compact`),
   `PackDetail`, `PackOpening` (um pacote), `OpeningFlow` (sequência e resumo), `PackCover` (capa ou desenhada) e
   `shop.css`. O `ShopScreen.tsx` antigo sai. Seletores com duas classes onde disputam com o `styles.css`.
2. **Navegação**: o detalhe vira uma tela no `App` (`{ v: 'shop-pack', key }`, voltar → loja), como as outras telas da
   campanha, para o botão voltar e a música funcionarem do mesmo jeito. A abertura é uma camada de tela cheia dentro da
   loja ou do detalhe (não é tela do `App`): a compra já gravou o estado, e fechar só a desmonta.
3. **Compra antes da encenação** (como hoje e como no nativo): o botão chama `buy`/`buyBox`/`openUnopened`, grava pelo
   `onChange` e só então abre a camada com as `PackOpening`. Fechar a qualquer momento não perde nada.
4. **Estado da abertura puro** em `src/screens/shop/opening.ts`: `{ index, phase: 'sealed' | 'torn', flipped: bool[] }`
   e funções `tear`, `flip(i)`, `revealAll`, `next`, `skipAll` → resumo; `newCount`, `summaryOrder` (raridade desc,
   depois a ordem de saída). Testado sem DOM. Os sons saem das transições (rasgo → `tear`; virar → `flip`, e `rare` se
   Super/Ultra; "Abrir todos" toca `rare` uma vez se ainda faltava sair Ultra).
5. **Fala do balconista pura** em `src/campaign/shopkeeper.ts`: `shopLine(kind, seed, n)` escolhe a fala do grupo pela
   semente da campanha e um contador (sem `Math.random`, regra do projeto) e devolve `{ text, expression }` já com
   `fillText`. O componente guarda a fala atual e some com ela em 4 s ou num toque. O balão é um `<button>` (iOS).
6. **Saldo contando**: um `useCountUp(value)` com `requestAnimationFrame` em ~600 ms e um pulso de escala no fim; com
   movimento reduzido, troca direto. Tempos ficam num objeto `SHOP_PACING` no topo do módulo (espelho do `PACING` do
   duelo, sem misturar os dois).
7. **Animações com CSS + Web Animations**: cascata da vitrine (atraso 40 ms por capa, sobe 14 px, 250 ms), balanço do
   bloqueado (400 ms), rasgo (faixa do topo sobe e some, pacote gira −4°, 350 ms), giro das cartas em 3D (450 ms, com
   `backface-visibility` e sombra no contêiner, não `filter` na face). Movimento reduzido: tudo vira opacidade.
8. **Detalhe do pacote**: a grade das cartas do pacote é uma grade comum dentro da página que rola (até ~130 cartas;
   as células já têm `content-visibility: auto`, então só as visíveis são desenhadas), com as que faltam apagadas por
   classe; o resumo da caixa (100) faz o mesmo. A `useVirtualGrid` pediria a grade como único contêiner de rolagem. A contagem por raridade e "X de Y" saem de `packStats(s, pack)` no `packs.ts`. Barra fixa com
   `position: sticky` no fim da tela (respeita a área segura). Confirmação da caixa num painel modal do HUD com
   `Backdrop` (tocar fora cancela).
9. **Ajuda** com o texto montado de `packRulesText()` a partir das chances do `balance.ts` (sem número solto na tela).
10. **Sons**: `copy_sounds.py` ganha `tear` e `rare`; `sfx.ts` ganha `tear` e `rare` em `UiSound`. Os botões continuam
   com o toque automático do `buttonSounds.ts`; o pacote e as cartas são `<button>` com `data-sound="none"` porque tocam
   o som próprio.

## Risks / Trade-offs

- **Giro 3D no WebKit**: já houve bug de `backface-visibility` com `filter`; confirmar no simulador de iOS. Mitigação:
  sombra no contêiner e teste e2e só do fluxo, não da perspectiva.
- **Caixa com 100 cartas no resumo**: `content-visibility: auto` nas células para não pesar no iPhone.
- **Capas faltando** (LON, personagem): capa desenhada com o nome; o fluxo não depende do arquivo.
- **Detalhe como tela do `App`** acrescenta um caso ao `Screen` e ao `trackFor` (mesma música da loja).
