# Tarefas

## 0. Vindo da tabuleiro-plano (já no diretório de trabalho)

- [x] 0.1 `removed` e `extra` no `PlayerBoard` (`protocol.ts`, `narrator.ts`), com `src/engine/piles.test.ts`.
- [x] 0.2 Campo plano no `duel.css`, sem `--tilt`; zonas na proporção da carta; defesa reduzida.
- [x] 0.3 Componente das pilhas (`PileRow.tsx`): topo, verso, espessura em degraus, quantidade, ícones, `data-loc`, Zona
  de Campo como `Slot`. Lista das pilhas (`PileSheet.tsx`). Testes de render dos dois.
- [x] 0.4 Placa de 48 sem cemitério nem deck (`Plate.tsx` + teste).
- [x] 0.5 Voos de e para as pilhas no `play.ts`; banir voa até as Banidas (`PACING.banish`).

## 1. Regras do formato

- [x] 1.1 `src/game/format.ts` com o `FORMAT` (modo Speed, LP 4000, mão 4, colunas, 20–30, Extra ≤ 5, 3 cópias).
  `session.ts`, `driver.ts`, `narrator.ts`, `track.ts`, `lp.ts`, `balance.ts` e `decks.ts` passam a ler dele. Os
  quebra-cabeças de teste usam o mesmo padrão. Verificar: `npx tsc --noEmit`.
- [x] 1.2 Quebra-cabeça que confirma as colunas do modo Speed (monstros só em `mzone` 1–3, M/A em `szone` 1–3, Campo
  em `szone` 5), a mão de 4, o LP de 4000 e a ausência de Main 2. Verificar: o teste novo em `src/engine/`.
- [x] 1.3 Testes do motor e da CPU que supunham 5 colunas, 8000 ou Main 2, ajustados.
  - Conferir no `cpu.ts` e no `search.ts` que nada exige a Main 2.
  - Conferir no `EVAL` se os pesos de LP usam a fração do LP inicial.

  Verificar: `npm test` verde.
- [x] 1.4 `npx tsx proto/smoke.ts 300` em Speed: cartas com erro de Lua ou laço por causa das 3 zonas vão para o
  `raw/pool/blocklist.json` (rodar `export_data.py`). Verificar: smoke sem erros.

## 2. Deck e campanha

- [x] 2.1 Regras do deck pelo `FORMAT` em `decks.ts`, `addRefusal` e `DeckEditor` (cabeçalho "20–30" e "até 5");
  `randomDeck` com 30 cartas (14/9/7) e Extra ≤ 5. Verificar: testes do editor e de `decks.ts`.
- [x] 2.2 Deck inicial: as 10 cartas que saem ficam no `starterCut` do `tiers.json` (o `copy_campaign_data.py` leva ao `campaign.json`); `starterDeck()` tira o corte; a coleção
  inicial segue com as 40. Verificar: `npx tsx proto/economy-smoke.ts` (deck válido e contido na coleção).
- [x] 2.3 `CampaignState` em `version: 2`; campanha de versão anterior descartada no `migrate`, com o perfil intacto.
  Verificar: teste do `migrate` com um save v1 (perfil fica, `campaign` nulo).
- [x] 2.4 `build_decks.py` com o corte para 30 e Extra ≤ 5 (regra da Decisão 6, `KEEP` por duelista, ajustes
  comentados); `deck-pick` e `difficulty` em Speed, por tier (`--only=`), até cada duelista ficar a ±10 da meta;
  `tier-balance` para os chefes. Verificar: `npx tsx proto/difficulty.ts 40` e `proto/tier-balance.ts 12` no relatório.
  Situação: 16 de 16 dentro da meta (`raw/decks/difficulty-speed-3.txt` e `-4.txt`; o Rare Hunter com a lista `FINAL`
  e a CPU guardando as peças do Exodia: 75% em 80 duelos). Chefes no `tier-balance-speed-2.txt`.
- [x] 2.5 `npx tsx proto/story-smoke.ts` e `npx tsx proto/monkey.ts 100` em Speed, sem erros de lugar nem de retrato.
  Rodado: `story-smoke` ok; `monkey.ts 5` (80 duelos, 0 erros, `locErr` 0, `boardErr` 0; 1 turno com 16 s de encenação).

## 3. Tabuleiro como no Duel Links

- [x] 3.1 `PileRow` vira `Piles.tsx` (`SideCell` nas pontas de cada fileira, disposição em `SIDES`): Campo e Extra de um lado; Banidas (ficha de meia
  altura), Cemitério e Deck do outro; o oponente girado 180°. Verificar: testes de render da disposição dos dois lados,
  da ficha vazia e do toque.
- [x] 3.2 `Field.tsx` com as 3 colunas de zonas (`FORMAT.columns`) entre as duas colunas de pilhas, em cada metade; a
  barra de fases na faixa central inteira. Verificar: no navegador (viewport de celular), as zonas usadas pelo motor
  aparecem e os `data-loc` batem com o `locKey`.
- [x] 3.3 Tokens do `duel.css` pela Decisão 4 (`--pile-w`, `--zone-w` pela largura de 3 + 2·0,78 colunas, `--zone-h`
  pela altura sem as fileiras de pilhas). Verificar: `npx tsc --noEmit` e o duelo sem rolagem em 390×844.
- [x] 3.4 `prompt.ts` sem o chip M2 e com o botão de avanço sem Main 2; fixtures regravadas
  (`npx tsx proto/capture-fixtures.ts`) e testes de UI ajustados. Verificar: `npm test`.
- [x] 3.5 `proto/layout-e2e.mjs` com a disposição nova. Conferências:
  - carta do campo com pelo menos 60pt em 390×844 e 46pt em todos os viewports (375×667 incluso);
  - colunas de pilhas dentro da altura das duas fileiras;
  - faixa central de 38;
  - nada transbordando.

  Verificar: passa nos 5 viewports.

- [x] 3.6 Mão reta, campo sobre a margem lateral e pontas que crescem até a zona (pedido do usuário depois da primeira
  conferência). Verificar: `layout-e2e` com "mão reta", "pontas não mais largas que as zonas" e "campo de borda a borda".

## 4. Conferência

- [x] 4.1 `node proto/duel-e2e.mjs` e `node proto/webkit-e2e.mjs` sem encenação presa nem regressão.
- [ ] 4.2 Acabamento visual: capturas em 390×844 e 375×667, mandadas ao usuário para aprovação.
- [ ] 4.3 Simulador de iOS (Safari real): duelo inteiro com banimento, Fusão e Magia de Campo; modo "reduzir
  movimento"; campanha nova do dia 1 depois de um save v1.
  Feito: perfil novo, campanha do dia 1 e um duelo no Safari do simulador (invocar, turno da CPU, batalha, ataque
  direto, FIM DO TURNO depois da batalha). "Reduzir movimento" conferido no WebKit (`duel-e2e --reduzir`). Falta:
  banimento, Fusão e Magia de Campo no simulador, e abrir um save v1 de verdade (o `migrate` tem teste).
- [x] 4.4 `CLAUDE.md`:
  - o formato Speed e o `format.ts`;
  - as colunas de pilhas;
  - o corte de decks no `build_decks.py`;
  - o recomeço da campanha.
