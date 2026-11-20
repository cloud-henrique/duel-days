# Tasks

## 1. Personagens e arte

- [x] 1.1 Sprites do Strings: zip de `~/Downloads` → `raw/characters/`; arquivos copiados para
  `assets/characters/strings/` (`full_chara007.png`, `faces/chara007_01.png` e `_07`); entrada no `characters.json`
  (`neutral` e `worried`); depois `npm run build-characters` e `build_sprites.py`. Verificar: `public/characters/strings/`
  tem corpo e as duas expressões, e o `git status` não lista nenhuma imagem.
- [x] 1.2 `chars.ts` com as cinco chaves (`espa`, `rarehunter`, `arkana`, `strings`, `kaiba`) no `CHAR_ID` e as cores de
  fala. Verificar: a pré-carga do build (`node proto/measure-build.mjs`) lista os cinco, e um teste de render do retrato do
  Strings com uma expressão que ele não tem mostra a neutra.
- [x] 1.3 Capas `pack-mfc`, `pack-dcr` e `pack-ioc` pelo `copy_campaign_assets.py`, se existirem no nativo (senão, a capa
  desenhada). Verificar: a vitrine mostra as três capas ou a reserva, sem imagem quebrada.

## 2. Dados do Tier 3

- [x] 2.1 `tiers.json` com o Tier 3 (caixas com `offset`, os cinco duelistas com `scene` e `signatureCard`, `packNames`)
  e `copy_campaign_data.py` juntando todos os `dialogue-tier*.json`. Verificar: `npx tsc --noEmit` e o `data.test.ts`
  conferindo os duelistas do T3, as cenas (o fundo existe) e as assinaturas.
- [x] 2.2 `packs.json` com MFC, DCR e IOC (do `boosters.json`) e preços de 300 DP no `BALANCE.packPrices`. Verificar:
  `npx tsx proto/economy-smoke.ts` mostra os três pacotes com as raridades e o DP médio no fim da janela do T3.

## 3. Decks do Tier 3

- [x] 3.1 `fetch_deck_recipes.py` com os cinco personagens e os filtros de nome. Verificar: `raw/decks/candidates.json`
  tem candidatas para os cinco; quem não tiver nenhuma com ≥ 85% no pool fica anotado para montar à mão.
- [x] 3.2 Meta do T3 (`3: 0.78`) no `proto/difficulty-target.ts` e torneio com o `deck-pick.ts`. Verificar: o relatório
  mostra a taxa de cada candidata e a vencedora de cada um.
- [x] 3.3 `build_decks.py` com as trocas do T3 no `REPLACE` (Deuses e cartas fora do pool, todas comentadas) e os ajustes
  no `TUNE`, gerando o `decks.json`. Verificar: teste de validação de todos os decks, assinatura dentro do deck do dono e
  `npx tsx proto/difficulty.ts 40` com os cinco a no máximo 10 pontos da meta.
- [x] 3.4 `npx tsx proto/tier-balance.ts 12` e `npx tsx proto/monkey.ts 100` com os decks novos. Verificar: o Kaiba
  vence a maioria contra os comuns do T3, sem erro de Lua nem trava.

## 4. Modelo e mapa

- [x] 4.1 Testes do modelo com o Tier 3 de verdade: abertura pelo Pegasus e pelo prazo, Kaiba liberado pelos quatro
  comuns, "Kaiba vencido sem Tier 4" (prêmio e aviso), prazo do T3 sem T4 e save parado no T2 abrindo no T3. Também os
  cenários "Tier 3 na vitrine" e "Tier 3 pelo prazo" da loja. Verificar: `npm test` com os cenários dos specs
  `progressao-por-tiers`, `economia-dp` e `elenco-tier3`.
- [x] 4.2 Teste do mapa cheio (16 cabeças, várias sementes): menor distância ≥ `MIN_GAP` e anel certo para cada tier.
  Ajustar o `map.ts` só se falhar (Decisão 4). Verificar: o teste passa e o print do preset `kaiba` no navegador, em
  viewport de celular, mostra as cabeças sem sobreposição.
- [x] 4.3 Presets `?campaign=tier3` e `?campaign=kaiba` no `debug.ts`. Verificar: `debug.test.ts`.

## 5. Falas do Tier 3

- [x] 5.1 `dialogue-tier3.json` com as falas dos quatro comuns (primeiro encontro, seguintes, antes do duelo, vitória e
  derrota, de 2 a 3 variações cada) e do Kaiba (as mesmas, mais a entrada e a derrota de chefe), sem nada do Tier 4. O
  Strings usa só `neutral` e `worried`. Verificar: o teste resolve `{nome}` e `{m|f|n}` em todas as falas, e o usuário
  revisa as falas.

## 6. Conferência final

- [x] 6.1 `story-smoke.ts` contando o Tier 3 aberto, o Kaiba vencido e os prêmios. Verificar: 200 campanhas sem erro, com
  rotas e epílogos do T1 ainda alcançados.
- [x] 6.2 `npx tsc --noEmit`, `npm test`, `economy-smoke`, `node proto/duel-e2e.mjs` e `node proto/shop-e2e.mjs` contra o
  dev server ou o preview. Verificar: tudo passa.
- [x] 6.3 No simulador de iOS, pelos presets: mapa do T3, encontro e duelo com um comum do T3 (fundo da cena), Strings na
  cena, loja com MFC e o Kaiba liberado, vencido e com o aviso do Tier 4. Verificar: prints enviados ao usuário.
- [x] 6.4 CLAUDE.md e README atualizados (Strings no pipeline de personagens, `dialogue-tier*.json`, presets novos).
  Verificar: os comandos citados existem e rodam.

## Workflow follow-up

- Commitar e publicar (`wrangler`) só quando o usuário pedir; arquivar a change depois do teste dele.
- Próxima change: Tier 4 (Finais), com o elenco e as cenas já registrados no design da `campanha-tiers`.
