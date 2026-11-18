# Tasks

## 1. Dados dos tiers

- [x] 1.1 `campaign.json` com `tiers: Tier[]` (T1 do nativo com `bond: true`, `offset` das caixas e `scene` de cada
  duelista; T2 de `src/campaign/data/tier2.json`), `mapPoints` e sem `locations`; tipos em `types.ts` e
  `copy_campaign_data.py` juntando tudo. Verificar: `npx tsc --noEmit` e o `data.test.ts` conferindo os duelistas do T2.
- [x] 1.2 `packs.json` com LON, LOD e PGD (listas do `boosters.json`, capas do nativo se existirem) e preços no `BALANCE`.
  Verificar: `npx tsx proto/economy-smoke.ts` mostra os 3 pacotes com as raridades.
- [x] 1.3 `scripts/copy_tfs_backgrounds.py`: zip de `raw/tfs/` → `public/campaign/bg-*.jpg` (tabela da Decisão 4, T1 a
  T4); README e CLAUDE.md com o passo. Verificar: os 22 arquivos existem e `git status` não os lista.

## 2. Decks pela melhor receita

- [x] 2.1 `scripts/fetch_deck_recipes.py` (Anime Decks por personagem, filtro de variantes, `raw/decks/`). Verificar:
  todos os personagens de T1 e T2 com candidatas ≥ 85% no pool.
- [x] 2.2 Trocas das cartas fora do pool (comentadas) e `proto/deck-pick.ts` com o torneio. Verificar: relatório com a
  taxa de vitória de cada candidata e a vencedora de cada personagem.
- [x] 2.3 `src/campaign/data/decks.json` (T1 e T2) usado pelo `decks.ts` no lugar dos decks do nativo. Verificar: teste de
  validação de todos os decks, `data.test.ts` (ids na base) e o cenário "Chefe mais forte" (Yugi e Pegasus) no relatório.
- [x] 2.4 `npx tsx proto/monkey.ts` com os decks novos. Verificar: sem erro de Lua nem trava.

## 3. Modelo da campanha por tiers

- [x] 3.1 `tiers.ts` (puro): `tierOpenDay`, `currentTier`, tier do duelista; `bossDefeatedOn` opcional no save, gravado
  no `applyDuel`. Verificar: testes cobrindo abertura pelo chefe, pelo prazo, tier sem conteúdo e saves antigos (cenários
  do spec `progressao-por-tiers`).
- [x] 3.2 `map.ts`: sorteio do tier atual + 1 a 2 amigos do T1 a partir do T2, chefes liberados, pontos do mapa sem
  repetição, `tierProgress` do tier atual. Verificar: testes de reprodutibilidade, de "Amigos no Tier 2", de pontos
  distintos e do Pegasus liberado.
- [x] 3.3 `rewards.ts` e `balance.ts`: DP base pelo tier do duelista, assinaturas do T2, pacote-prêmio pela janela do
  tier do chefe. Verificar: testes dos cenários "Vitória no Tier 2", "Assinatura do Tier 2" e "Pegasus vencido sem Tier 3".
- [x] 3.4 `packs.ts`: liberação por tier com `offset`, coleções antigas à venda e vitrine do próximo tier. Verificar:
  testes dos cenários "Antes do dia 3", "Tier 2 adiantado" e "Próximo tier na vitrine".
- [x] 3.5 `calendar.ts`/`bond.ts`: aviso do tier sem conteúdo pelo tier atual; duelistas sem laço fora de afinidade,
  eventos e epílogo. Verificar: testes de `bond` e do aviso.
- [x] 3.6 Presets `?campaign=tier2` e `?campaign=pegasus` no `debug.ts`. Verificar: `debug.test.ts`.

## 4. Falas do Tier 2

- [x] 4.1 Falas curtas do T2 em `dialogue-tier2.json` (saudação de primeiro encontro e seguintes, antes do duelo, depois
  da vitória e da derrota; entrada e derrota do Pegasus). Verificar: teste do `encounter`/`text` resolve `{nome}` e
  `{m|f|n}` em todas; revisão do usuário.

## 5. Telas

- [x] 5.1 `MapScreen` só com as cabeças nos pontos sorteados (sem rótulo, sem contador; loja só no atalho) e os e2e no
  seletor novo. Verificar: teste de render (cabeças, coroa, "!", toque abre o encontro) e conferência no navegador em
  viewport de celular.
- [x] 5.2 Cena do encontro pelo `scene` do duelista (fundo e nome do lugar, degradê de reserva) e encontro sem laço (sem
  corações e sem "Conversar"). Verificar: teste de render do encontro com um duelista do T2.
- [x] 5.3 `chars.ts` com os 6 sprites novos (cores de fala e expressões); a pré-carga passa a incluí-los. Verificar:
  `node proto/measure-build.mjs` lista os 6 na pré-carga.
- [x] 5.4 Cabeçalho com o tier atual, status com tiers abertos, chefes e o dia do próximo tier, e a loja com a vitrine do
  próximo tier. Verificar: testes de render e conferência no navegador em viewport de celular.

## 6. Conferência final

- [x] 6.1 `story-smoke.ts` contando tiers abertos, chefes, prêmios e laços alcançados. Verificar: 200 campanhas sem erro,
  rotas e epílogos do T1 ainda alcançados.
- [x] 6.2 `npx tsc --noEmit`, `npm test`, `economy-smoke`, `node proto/duel-e2e.mjs` e `node proto/offline-e2e.mjs`
  contra o preview. Verificar: tudo passa.
- [x] 6.3 No simulador de iOS: mapa só com cabeças, chegar ao Tier 2 (preset), encontrar e duelar com um duelista do T2
  (fundo da cena), loja com LON e o Pegasus liberado. Verificar: prints enviados ao usuário.

## Workflow follow-up

- Arquivar a `campanha-dm` antes desta (os specs `campanha` e `economia-dp` nascem lá).
- Commitar e publicar só quando o usuário pedir; arquivar depois do teste dele.
- Próximas changes: Tier 3 (Batalha da Cidade) e Tier 4 (Finais), com o elenco e as cenas já registrados no design.
