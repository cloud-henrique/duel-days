# Tasks

## 1. Modelo e dados

- [x] 1.1 `packs.ts`: `packStats(s, pack)` (contagem por raridade, cartas diferentes do pacote que o jogador tem, total)
  e `packRulesText()` a partir das chances do `balance.ts`. Verificar: `packs.test.ts` com "14 de 104" num save de teste
  e o texto com 70/20/10.
- [x] 1.2 `src/campaign/shopkeeper.ts`: `shopLine(kind, seed, n, profile)` com as falas do `shopkeeper` do
  `dialogue.json`, escolha pela semente e `fillText`. Verificar: teste de que a mesma semente e contador dão a mesma fala
  e de que `{nome}`/`{m|f|n}` são resolvidos.
- [x] 1.3 `src/screens/shop/opening.ts` (puro): estado da abertura (`sealed`/`torn`, cartas viradas, índice do pacote),
  `tear`, `flip`, `revealAll`, `next`, `skipAll`, `newCount`, `summaryOrder` e os sons de cada transição. Verificar:
  `opening.test.ts` cobrindo pacote único, caixa de 20, "Abrir todos" com e sem Ultra pendente e a ordem do resumo.

## 2. Sons

- [x] 2.1 `copy_sounds.py` com `tear` e `rare`; `sfx.ts` com os dois em `UiSound`. Verificar: `python3
  scripts/copy_sounds.py` gera `public/sounds/tear.m4a` e `rare.m4a` dentro do teto de tamanho, e `npx tsc --noEmit`.

## 3. Balcão e vitrine

- [x] 3.1 `ShopCounter` (`tall`/`compact`): fundo da loja, Solomon pelo `Sprite`, nome, saldo com `useCountUp` e pulso,
  balão de fala (`<button>`) que some em 4 s ou no toque; tempos em `SHOP_PACING`. Verificar: na loja em viewport de
  celular, o balão de boas-vindas aparece com o nome do jogador e some ao tocar.
- [x] 3.2 `ShopScreen` nova em `src/screens/shop/` com "Pacotes ganhos", "À venda" e "Pacotes de personagem" em grade
  de 3 capas (`PackCover` com a capa desenhada de reserva), preço/"faltam N DP", bloqueio com ícone e motivo, NOVA,
  cascata e balanço; botão de ajuda no `TopBar`. Remove o `ShopScreen.tsx` antigo. Verificar: `?campaign=tier2` mostra
  LON à venda e LOD/PGD com o dia; no dia 4 do T1, LON/LOD/PGD com "Tier 2 · dia 8"; o teste que procura "moedas" passa.

## 4. Detalhe do pacote

- [x] 4.1 Tela `{ v: 'shop-pack', key }` no `App` (voltar → loja, música da loja) com o resumo (capa, raridades nas
  cores, "X de Y" e barra), balcão compacto e a grade com as que faltam apagadas; toque abre o
  detalhe da carta (`CardZoom`). Verificar: no LOB de um save novo, a contagem bate com a coleção e o toque abre a carta.
- [x] 4.2 Barra fixa com saldo e "Comprar 1 pacote"/"Caixa · 20 pacotes" (preço ou "faltam N DP"), confirmação da
  caixa com total, economia e saldo depois (`Backdrop` cancela), fala "sem DP" ao tocar sem saldo. Verificar: cancelar
  a caixa não muda o DP; com 60 DP o avulso mostra "faltam 90 DP".

## 5. Abertura

- [x] 5.1 `PackOpening` (um pacote): pacote fechado, rasgo, 5 versos (3 + 2), virar com giro 3D, rótulo e brilho da
  raridade, NOVA, "Revelar tudo", "Pronto" com a contagem; toque na carta virada abre o detalhe da carta. Verificar: comprar
  um LOB, revelar tudo e conferir as 5 cartas na coleção.
- [x] 5.2 `OpeningFlow`: caixa pacote a pacote ("Pacote N de 20", "Abrir todos", "Próximo pacote"/"Ver resumo") e o
  resumo (raridade desc, raras destacadas, NOVA); pacotes ganhos um por vez; fala do vovô ao fechar
  (compra, caixa ou Ultra). Verificar: comprar uma caixa de MRD com DP de teste, "Abrir todos" e ver 100 cartas com as
  Ultras primeiro.
- [x] 5.3 Movimento reduzido: cascata, balanço, rasgo e giro viram opacidade. Verificar: com `--reduzir` no e2e o fluxo
  termina igual.

## 6. Integração e verificação

- [x] 6.1 `npx tsc --noEmit`, `npm test` e `npx tsx proto/economy-smoke.ts`. Verificar: tudo passa.
- [x] 6.2 E2E no WebKit (`proto/shop-e2e.mjs` ou um modo do `webkit-e2e.mjs`): loja → detalhe → comprar → rasgar →
  revelar tudo → pronto → saldo novo, e a caixa com "Abrir todos". Verificar: o script termina sem erro, normal e com
  `--reduzir`.
- [x] 6.3 Conferência visual em viewport de celular contra os prints `31`, `32`, `34` e `36`, e no simulador de iOS o
  giro das cartas (face certa de frente) e a barra fixa sobre a área segura. Verificar: screenshots no relatório.
- [x] 6.4 CLAUDE.md (arquitetura: `src/screens/shop/`, `shopkeeper.ts`) e README (sons novos). Verificar: o diff
  menciona os arquivos novos.

## Workflow follow-up

- Arquivar a change e sincronizar o spec `loja-de-pacotes`.
- Change seguinte: editor de deck e Coleção no visual do nativo (até 5 decks, arrastar com voo).
