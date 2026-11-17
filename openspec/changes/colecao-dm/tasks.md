# Tasks

## 1. Medição do "antes"

- [x] 1.1 `proto/measure-build.mjs`: lê `dist/assets` e o manifesto do `dist/sw.js` e escreve em
  `openspec/changes/colecao-dm/medicoes.md` o tamanho do bundle por arquivo (bruto e gzip) e da pré-carga por pasta.
  Verificar: rodar após `npx vite build` e conferir os 17,4 MB / 416 entradas de hoje.
- [x] 1.2 Modo `?campaign=all-cards` no `src/campaign/debug.ts` (todas as cartas da base, 3 cópias), com teste no
  `debug.test.ts`. Verificar: o teste passa e o editor abre com a coleção inteira em dev.
- [x] 1.3 `?perf` no editor de deck: rola a grade de ponta a ponta por `requestAnimationFrame` em velocidade fixa, conta
  quadros e quadros longos (>50 ms), mostra o resultado e manda pelo `/__log`. Verificar: no navegador, o resultado
  aparece e chega ao `/tmp/duel-days-device.log`.
- [x] 1.4 Medir o "antes" no simulador do iPhone 17 Pro com o build de preview: FPS do `?perf` e RSS dos processos
  `WebContent` (antes do editor, depois de rolar tudo, depois de voltar ao topo). Verificar: números registrados em
  `medicoes.md`.

## 2. Importação da base da era DM

- [x] 2.1 Conferir na documentação da API do YGOPRODeck os parâmetros de data (`startdate`, `enddate`, `dateregion`
  com a data OCG) e `misc`, com uma busca pequena salva em `raw/import/`. Verificar: a amostra só traz cartas com data
  OCG dentro do intervalo pedido.
- [x] 2.2 `scripts/import_dm.py`: busca as cartas com data OCG até 2004-09-30 (respostas cruas em cache em
  `raw/import/`), tira fichas, aplica `raw/import/incluir.json` e grava `raw/pool/pool.json` no formato atual (com a
  raridade da primeira impressão). Verificar: o `export_data.py` roda sem mudança e gera o `cards.json`.
- [x] 2.3 Texto em português por id em lotes, com volta ao inglês, e correções de `raw/overrides/text.pt.json`
  aplicadas no export. Verificar: uma correção de teste aparece no `text.pt.json` gerado e no zoom da carta.
- [x] 2.4 Boosters: lista curada de caixas TCG da era no script, cartas e raridade por caixa (menor raridade quando a
  carta tem duas na mesma caixa), cortadas pela data OCG e pelo suporte do motor, em `public/data/boosters.json`.
  Verificar: LOB, MRD, MRL e PSV saem com cartas Comuns, Raras, Super e Ultra.
- [x] 2.5 Relatório `raw/import/report.md`: totais por tipo, sem data OCG, sem português, sem suporte do motor,
  correções órfãs, cartas com mais de uma raridade na caixa e, por booster, total e cortadas. Verificar: o relatório é
  gerado e os totais batem com o `cards.json`.
- [x] 2.6 `copy_campaign_data.py` monta os 4 pacotes de coleção do `packs.json` a partir do `boosters.json` (nomes,
  preços e dias do nativo; pacotes de personagem do nativo). O `boosters.json` fica como dado em `public/data/`, fora do
  bundle; ler as outras caixas no app fica para a `campanha-tiers`. Verificar: `npx tsx proto/economy-smoke.ts`, os
  testes de `src/campaign` e o `data.test.ts` (todo id de deck, pacote e prêmio existe no `cards.json`).
- [x] 2.7 Atualizar o README e o CLAUDE.md (pipeline: `import_dm.py` no lugar do `fetch_pool.py`, overrides,
  `incluir.json`, relatório). Verificar: os comandos documentados rodam na ordem escrita.

## 3. Motor com o pool novo

- [x] 3.1 `npx tsx proto/smoke.ts 500` e `npx tsx proto/monkey.ts 100` com a base nova; cartas que travarem ou derem
  erro de Lua vão para `raw/pool/blocklist.json` e o export roda de novo. Verificar: 500 + 100 duelos sem erro de Lua
  nem trava, e as cartas bloqueadas aparecem no relatório.
- [x] 3.2 `npx tsx proto/story-smoke.ts`. Verificar: 200 campanhas sem erro com os pacotes novos.

## 4. Arte em dois tamanhos

- [x] 4.1 `fetch_card_art.py`: baixa o recorte original para `raw/cards/cropped/` e gera `public/cards/thumb` (200 px)
  e `public/cards/full` (512 px) em WebP; gerar primeiro uma amostra de ~20 cartas. Verificar: tamanhos médios anotados em
  `medicoes.md` e a amostra conferida no zoom e na grade do simulador.
- [x] 4.2 Gerar a arte de toda a base e apagar `public/cards/{small,large,cropped}`. Verificar: toda carta do
  `cards.json` (fora fichas) tem `thumb` e `full`, por um script de checagem.
- [x] 4.3 `art(code, size)` só com `'thumb' | 'full'`; o `CardFace` troca a reserva `small` por um estado de falha
  (degradê na cor da moldura) e tenta de novo ao remontar e no evento `online`. Verificar: teste do `CardFace` com
  `onError` mostra o preenchimento, sem `<img>` quebrada.
- [x] 4.4 Face desenhada compacta com `thumb` na loja (`ShopScreen`), no cemitério (`DuelScreen`) e no fim do duelo
  (`Outro`); zoom e folha da carta com `full`; pré-carga do duelo (`useDuelEngine`) com `thumb`. Verificar: `npx tsc
  --noEmit`, testes e, no navegador, nenhuma requisição para `cards/small` ou `cards/large`.

## 5. Grade virtualizada

- [x] 5.1 Hook de virtualização por linhas (altura fixa pela largura da coluna, `ResizeObserver`, 2 linhas de folga,
  espaçadores) com teste de unidade do cálculo de faixa. Verificar: o teste cobre topo, meio, fim e lista vazia.
- [x] 5.2 Grade do editor (Coleção e Deste deck) virtualizada com a face compacta e `thumb`, mantendo 4 colunas, bordas
  de raridade, selo "no deck", filtros, ordenação, zoom e volta ao topo ao trocar aba/filtro. Verificar: teste de render
  com 6.000 cópias monta só dezenas de células, e o fluxo do editor no navegador continua igual.
- [x] 5.3 Loja com a face desenhada na revelação de pacotes e caixas. A lista da loja tem no máximo 100 cartas (uma
  caixa de 20 pacotes), então fica sem virtualização. Verificar: abrir pacote no navegador mostra as faces desenhadas
  (conferido no `proto/offline-e2e.mjs`).

## 6. Pré-carga e caches

- [x] 6.1 `vite.config.ts`: `globIgnores` com `characters/**` e o chunk `ocgcore.jspi-*`; `additionalManifestEntries`
  com as `thumb` do deck inicial, o verso e os sprites dos avatares do jogador e dos duelistas do Tier 1 (revisão pelo
  hash). Verificar: `measure-build.mjs` mostra a pré-carga sem as artes da coleção, sem `full`, sem os sprites fora do
  Tier 1 e sem o JSPI.
- [x] 6.2 Caches de execução `card-thumb` (2.500 entradas, 90 dias), `card-full` (300, 30 dias) e `characters` (200,
  90 dias), todos `CacheFirst` com `purgeOnQuotaError`; apagar o cache antigo `card-art` no `main.tsx`. Verificar: no
  navegador, após rolar a coleção, os caches aparecem com as entradas e o `card-art` some.
- [x] 6.3 Fluxo offline e cache apagado no WebKit (`proto/webkit-e2e.mjs` ou um e2e novo contra o preview): instalar,
  ficar offline, primeiro duelo com o deck inicial com arte; apagar os caches, voltar online, abrir com o save intacto.
  Verificar: o e2e passa.

## 7. Medição do "depois" e conferência final

- [x] 7.1 Medir o "depois" (bundle, pré-carga, FPS e memória no simulador do iPhone 17 Pro com a coleção inteira) e
  comparar com o "antes" em `medicoes.md`. Verificar: a pré-carga não cresce com a coleção, a grade fica perto de 60 FPS e
  a memória volta ao subir para o topo.
- [x] 7.2 `npx tsc --noEmit`, `npm test`, `npx tsx proto/smoke.ts 500`, `npx tsx proto/monkey.ts 100`,
  `npx tsx proto/economy-smoke.ts` e `node proto/duel-e2e.mjs` contra o preview. Verificar: tudo passa.
- [x] 7.3 Conferir no simulador de iOS: editor com a coleção inteira, zoom nítido, loja, duelo (mão, campo, cemitério,
  fim) e o título. Verificar: prints enviados ao usuário.

## Workflow follow-up

- Commitar e publicar só quando o usuário pedir.
- Arquivar a change depois do teste do usuário.
- Próxima change: `campanha-tiers` (liberação das caixas seguintes, decks dos oponentes, preços).
