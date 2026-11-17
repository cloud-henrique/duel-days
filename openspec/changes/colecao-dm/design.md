# Design

## Context

Estado de hoje (medido em 17/11/2026, build de produção):

- **Pipeline:** `fetch_pool.py` (lista fixa de caixas TCG 2002–2005, raridade da primeira impressão) → `raw/pool/pool.json`
  → `export_data.py` (cruza com BabelCDB e CardScripts, descarta sem script, acrescenta fichas, aplica `blocklist.json`)
  → `public/data/{cards,pool}.json` + `public/scripts.json`; `fetch_card_text_pt.py` → `text.pt.json`;
  `fetch_card_art.py` → `public/cards/{small,large,cropped}`.
- **Números:** 1.738 cartas no pool, 1.755 no `cards.json` (com fichas), 1.627 com português, 1.417 scripts. Arte:
  `small` 200×292 (12 KB, 21 MB), `large` 380×554 (29 KB, 51 MB), `cropped` 256×256 (14 KB, 24 MB).
- **Uso da arte:** `small` na grade do editor, loja, cemitério e fim do duelo; `cropped` na face desenhada (mão, campo,
  zoom), com `small` como reserva.
- **Grade do editor:** `.cardgrid` monta todas as cópias (`content-visibility: auto` e `loading="lazy"`, mas sem
  desmontar nada).
- **Pré-carga:** 17,4 MB / 416 entradas: sprites 7,2 MB (todos os ~45 personagens), worker 2,6 MB, `scripts.json`
  2,3 MB, build JSPI do ocgcore 1,26 MB (nunca usado), JS principal 772 KB, dados 1 MB. A arte das cartas já fica fora,
  num `CacheFirst` (`card-art`, 5.000 entradas, sem expiração).
- **Campanha:** `packs.json` vem do nativo (LOB 104, MRD 98, MRL 131, PSV 105 cartas, raridade por carta); o deck inicial
  e os decks dos duelistas estão no `campaign.json`.

## Goals / Non-Goals

**Goals:**
- Uma importação reprodutível que gera base, boosters e relatório, reaproveitando o cruzamento com o motor que o
  `export_data.py` já faz.
- Uma só representação visual da carta (face desenhada) com dois tamanhos de arte.
- Pré-carga de tamanho fixo em relação à coleção; caches de execução limitados.
- Grade virtualizada sem dependência nova.
- Números de antes e depois registrados na change.

**Non-Goals:**
- Novos tiers, decks de oponentes novos ou liberação das caixas seguintes (próxima change).
- Mudar o motor, as regras de duelo ou a CPU.
- Baixar a arte sob demanda de outro domínio, ou gerar arte no aparelho.

## Decisions

### 1. `import_dm.py` substitui o `fetch_pool.py`; o `export_data.py` continua
O novo script busca na API do YGOPRODeck (`cardinfo.php` com `startdate`/`enddate`, `dateregion` na data OCG e
`misc=yes`; os nomes exatos dos parâmetros são conferidos na documentação da API antes de codar) e grava em `raw/`:
`pool.json` (mesmo formato de hoje, para o `export_data.py` seguir funcionando), `boosters.json`, as respostas cruas
(cache) e `report.md`. O texto em português é buscado por id em lotes, como o `fetch_card_text_pt.py` faz (o parâmetro
`language=pt` omite cartas sem tradução, por isso a busca é por id e não pela lista).
*Alternativa:* um script único que também exporta. Rejeitada: o cruzamento com BabelCDB/CardScripts, a lista de
bloqueio e as fichas já funcionam e são testados pelo `smoke.ts`; separar busca e exportação deixa reexportar sem rede.

### 2. Cartas sem data OCG ficam de fora, com lista explícita para incluir
A busca por data já exclui quem não tem `ocg_date`. Para enxergá-las, o script cruza com as cartas das caixas TCG da
era (`card_sets`) e lista as que faltam no relatório. `raw/import/incluir.json` (ids) força a entrada de alguma.

### 3. Boosters: lista curada de caixas TCG + raridade por caixa
Uma lista no script (como o `SETS` de hoje) com as caixas TCG principais da era, em ordem cronológica. Para cada caixa,
as cartas vêm do `card_sets` de cada carta da base. Raridade: a mesma tabela de hoje (Comum, Rara, Super, Ultra; Secret,
Ultimate, Ghost e afins contam como Ultra); se uma carta tem duas raridades na mesma caixa (ex.: Ultra e Ultimate), vale
a menor, que é a impressão comum da caixa. Cartas com data OCG depois do corte, ou sem suporte do motor, saem da lista e
o relatório conta quantas. Saída: `public/data/boosters.json` (`{key, nome, data TCG, cartas: [{id, raridade}]}`).

### 4. Tier 1 lê as listas geradas
O `copy_campaign_data.py` passa a montar os 4 pacotes de coleção do `packs.json` a partir do `boosters.json` (chaves
`lob`, `mrd`, `mrl`, `psv`; os nomes, preços e dias continuam os do nativo). Os pacotes de personagem continuam vindo do
nativo. Isso muda a composição dos 4 pacotes (o nativo tem 104 cartas no LOB; a caixa real tem mais), mas mantém a
regra do sorteio (4 comuns + 1 de raridade 70/20/10). O `economy-smoke.ts` confere que todo pacote tem as raridades.

### 5. Correções de texto em `raw/overrides/text.pt.json`
`{ "<id>": { "name"?: "...", "desc"?: "..." } }`, aplicado pelo exportador por cima do texto da API (o português, ou o
inglês quando não há tradução). Fica em `raw/`, fora do git, porque o texto é da Konami. O relatório lista ids órfãos.
*Alternativa:* versionar as correções. Rejeitada pela regra do projeto (nada de material da Konami no git).

### 6. Arte: `thumb` 200 px e `full` 512 px, só da ilustração recortada
`fetch_card_art.py` baixa `cards_cropped` (o original, ~624 px) uma vez para `raw/cards/cropped/` e gera
`public/cards/thumb/<id>.webp` (200 px, qualidade ~70, ~7 KB) e `public/cards/full/<id>.webp` (512 px, qualidade ~75,
~35 KB). A grade (~85 pt por célula, arte ~70 pt × 3 de densidade) pede ~210 px; o zoom (arte ~210 pt × 3) pediria
630 px, mas 512 px já é nítido na prática e custa metade. `small`, `large` e `cropped` são apagados de `public/cards`.
O helper `art(code, size)` passa a aceitar só `'thumb' | 'full'`. Estimativa para ~2 mil cartas: ~14 MB de thumbs e
~70 MB de full no deploy (hoje 96 MB). Os tamanhos e a qualidade são confirmados na medição (tarefa) antes de gerar tudo.

### 7. Face desenhada em todo lugar, com arte opcional
Grade, loja, cemitério e fim do duelo passam a usar o `CardFace` compacto (o mesmo da mão) com a `thumb`; o zoom usa o
`full`. O `CardFace` troca a reserva (`small`) por um estado de falha: sem arte, mostra um degradê na cor da moldura. A
nova tentativa sai de graça na grade virtualizada (a célula remonta ao voltar à tela); fora dela, o `CardFace` também
tenta de novo no evento `online`.

### 8. Virtualização própria por linhas
A grade tem altura de linha fixa (largura da coluna × proporção da carta + espaço), então um hook pequeno calcula, pelo
`scrollTop` e pela altura do contêiner (medida com `ResizeObserver`), quais linhas montar (visíveis + 2 de folga),
com espaçadores acima e abaixo. A rolagem continua nativa (o momentum do iOS fica intacto).
*Alternativa:* `@tanstack/react-virtual`. Rejeitada por enquanto: o caso é uma grade uniforme de 4 colunas, ~60 linhas
de código resolvem e não há dependência nova; se aparecer um caso não uniforme, troca-se.

### 9. Pré-carga e caches (vite-plugin-pwa, `generateSW`)
- `globIgnores` ganha `cards/**` (já tem), `characters/**` e o chunk `ocgcore.jspi-*`.
- `additionalManifestEntries`, calculadas no `vite.config.ts` lendo `campaign.json` e `PLAYER_AVATARS`: as `thumb`
  do deck inicial, o `back.webp` e os arquivos dos avatares do jogador e dos duelistas do Tier 1, com revisão pelo hash
  do arquivo.
- `runtimeCaching`: `card-thumb` (CacheFirst, 2.500 entradas, 90 dias), `card-full` (CacheFirst, 300 entradas,
  30 dias), `characters` (CacheFirst, 200 entradas, 90 dias), todos com `purgeOnQuotaError`. Arte e música da campanha
  continuam como estão.
- O cache antigo `card-art` (com `small`/`large`) é apagado uma vez pelo app no `main.tsx` (`caches.delete`).
- Dados (`cards.json`, `text.pt.json`, `boosters.json`, `scripts.json`) continuam na pré-carga: sem eles não há duelo
  offline, e eles só crescem com a base (~15%).

### 10. Medição
- `proto/measure-build.mjs`: lê `dist/` e o manifesto do `sw.js` e escreve tamanho do bundle (por arquivo) e da
  pré-carga (por pasta) em `openspec/changes/colecao-dm/medicoes.md`.
- Coleção cheia para medir: o modo de depuração da campanha ganha `?campaign=all-cards` (todas as cartas da base, 3
  cópias), como os outros modos do `debug.ts`.
- `?perf` no editor: rola a grade de ponta a ponta por `requestAnimationFrame` em velocidade fixa, conta quadros e
  quadros longos (>50 ms) e mostra/manda o resultado pelo `/__log`.
- Memória: RSS dos processos `WebContent` do simulador (`ps` no Mac) antes de abrir o editor, depois de rolar tudo e
  depois de voltar ao topo.
- "Antes" medido no código atual com a base atual; "depois" com a base nova. Os números vão para `medicoes.md`.

## Risks / Trade-offs

- [Mais cartas sem suporte ou que travam o motor] → `smoke.ts 500` e `monkey.ts 100` com o pool novo; o que travar vai
  para o `blocklist.json` e aparece no relatório.
- [A composição dos 4 pacotes do Tier 1 muda em relação ao nativo] → é a escolha por boosters reais; o
  `economy-smoke.ts` confere raridades e os decks dos oponentes continuam os do nativo.
- [Raridade de caixas com várias impressões ou reimpressões] → regra da menor raridade dentro da caixa; o relatório
  mostra as cartas com mais de uma raridade para conferir.
- [Parâmetros da API diferentes do esperado] → conferir na documentação e testar uma busca pequena antes de rodar tudo;
  respostas cruas em cache.
- [Arte de 512 px pode parecer suave a 3×] → conferir no simulador com uma amostra antes de gerar as ~2 mil; subir para
  600 px se precisar (~+30% de bytes).
- [Correções fora do git podem se perder] → `raw/` já é a pasta de material local; recomendação de backup junto com o
  resto de `raw/`.
- [A grade virtualizada perde o `scroll` ao trocar de aba] → é o comportamento pedido (volta ao topo); o zoom aberto não
  depende da célula montada.
- [O iOS apagar o cache no meio de um duelo offline] → a face aguenta a arte faltando; os dados vêm da pré-carga, que o
  iOS apaga junto com tudo, e nesse caso o app só abre online (comportamento atual de qualquer PWA).

## Migration Plan

1. Medir o "antes" (build atual, precache, FPS e memória com a coleção atual cheia).
2. Gerar base, boosters e artes novas localmente; reexportar; rodar os smokes.
3. Trocar o app para `thumb`/`full` e a face desenhada; virtualizar; ajustar o PWA.
4. Medir o "depois"; build; deploy pelo `wrangler` direto do `dist/` (as artes antigas somem da implantação nova).
5. Reversão: voltar o commit e reimplantar a versão anterior; os arquivos `small`/`large` ainda existem no Cloudflare
   nas implantações antigas, e o `raw/` guarda os originais.

## Open Questions

- Quais caixas TCG entram na lista curada além das 33 de hoje, e onde ela termina, sai do relatório da primeira
  importação (as que caem inteiras ou em parte antes do corte); a escolha final é revisada com o usuário antes da
  change `campanha-tiers`.
