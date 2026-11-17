# Proposta

## Why

O pool atual (1.738 cartas) saiu de uma lista manual de caixas TCG e guarda cada arte em três versões, duas delas a carta
inteira em inglês (72 MB que só servem às grades). Para ter os boosters reais da era Duel Monsters (base da futura
progressão por tiers), o jogo precisa da coleção completa da época (~2 mil cartas). Do jeito que está, isso quebraria:
a grade do editor monta uma célula por cópia sem virtualização (com ~6 mil imagens, passaria de 1 GB decodificado e o
Safari do iOS fecharia a aba), e o precache já tem 17,4 MB, metade dele sprites e um build do motor que nunca é usado.

## What Changes

- **Importação da era DM** por um script fora do app (YGOPRODeck): monstros, Magias e Armadilhas com data OCG até
  2004-09-30, sem fichas; texto em português com volta ao inglês; cruzamento com o banco do motor (cartas sem suporte
  ficam fora do jogável). Gera a base em JSON só com os campos usados e um relatório (total por tipo, cartas sem data
  OCG, sem português e sem suporte do motor).
- **Correções de texto**: um arquivo de overrides aplicado por cima do texto da API, para restaurar o texto da época.
- **Boosters TCG reais como dados**: lista de cartas e raridade de cada caixa TCG da era, cortadas na data OCG. O Tier 1
  da campanha continua igual (mesmas 4 coleções, preços e dias); só passa a ler as listas geradas.
- **BREAKING (dados locais)**: as cartas inteiras em inglês (`cards/small`, `cards/large`) deixam de existir. Toda carta
  na interface passa a ser a face desenhada em português.
- **Arte em dois tamanhos** (WebP da ilustração recortada, hospedada no projeto): `thumb` para grades, mão, campo e
  listas; `full` para o zoom. A face desenhada aguenta a arte faltando (moldura com degradê no lugar) e tenta de novo.
- **Cache enxuto**: o precache fica só com o essencial (shell, motor, fontes, ícones, verso, dados, arte do deck inicial
  e sprites dos personagens iniciais). Artes e os demais sprites vão para caches em tempo de execução com limite e
  expiração, sempre baixáveis de novo se o iOS apagar o cache.
- **Grades virtualizadas**: coleção, "Deste deck" e loja montam só as linhas visíveis, rolando lisas com a coleção toda.
- **Medição antes e depois**: tamanho do bundle e do precache, memória e FPS rolando a coleção no simulador do iPhone.

Fora do escopo: regras de duelo, novos tiers da campanha (decks dos oponentes, liberação das caixas seguintes).

## Capabilities

### New Capabilities
- `base-de-cartas`: a base de cartas do jogo: origem, corte da era DM, texto em português com overrides, cartas sem
  suporte do motor, boosters TCG com raridades e o relatório da importação.
- `arte-das-cartas`: os tamanhos da arte, onde cada um é usado, a face desenhada em todo lugar e o comportamento quando
  a arte falta ou foi apagada.
- `cache-offline`: o que entra na pré-carga do PWA, o que fica em cache de execução com limite e expiração, e o jogo
  continuar funcionando quando o iOS apaga o cache.
- `grade-de-cartas`: as grades de cartas (coleção, deck, loja) com a coleção inteira, virtualizadas e lisas.

### Modified Capabilities
<!-- Nenhuma: o Tier 1 da campanha (change campanha-dm) mantém o mesmo comportamento; a face desenhada da duel-hud não
     muda de requisito. -->

## Impact

- Scripts: novo `scripts/import_dm.py`; `fetch_card_art.py` (thumb/full), `export_data.py` e `fetch_card_text_pt.py`
  absorvidos ou adaptados; `fetch_pool.py` substituído. Saídas fora do git (`raw/`, `public/data`, `public/cards`).
- Dados: `public/data/` (base, texto PT, overrides aplicados, boosters); `src/campaign/data/packs.json` passa a vir das
  listas geradas para as caixas TCG.
- App: `CardSheet.tsx` (`art`), `CardFace.tsx`, `DeckBuilder.tsx`, `ShopScreen.tsx`, `DuelScreen.tsx` (cemitério),
  `anim/Outro.tsx`, `useDuelEngine.ts` (pré-carga), `styles.css`.
- PWA: `vite.config.ts` (globPatterns/globIgnores, runtimeCaching, entradas extras do deck inicial).
- Ferramentas de medição: script de tamanho do build/precache e modo `?perf` (FPS) para o simulador.
- Deploy: ~75 MB de arte em vez de 96 MB; nenhuma dependência nova obrigatória.
