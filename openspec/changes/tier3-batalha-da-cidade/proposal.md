# Proposal

## Why

A campanha tem 30 dias, mas só os Tiers 1 e 2 têm duelistas. Depois do Pegasus, o jogo fica nos mesmos 11 oponentes até
o dia 30, e a janela do Tier 3 (dias 15 a 22) não traz nada novo. O modelo por tiers, o pipeline de decks e os fundos
das cenas já estão prontos, então o Tier 3 agora é basicamente conteúdo.

## What Changes

- **Tier 3, Batalha da Cidade**, jogável de ponta a ponta. Quatro duelistas comuns e o chefe Seto Kaiba:
  - Espa Roba (Jinzo), na Praça do museu;
  - Rare Hunter (Exodia), no Beco;
  - Arkana (Mago Negro), no Palco;
  - Strings (Slime), na Rua com neblina;
  - Seto Kaiba, o chefe (Dragão Branco de Olhos Azuis), no Museu de Domino.

  Cada um tem a sua cena, carta-assinatura e falas curtas. Nenhum deles tem laço.
- **Sprites do Strings**: entram a partir do zip baixado à mão (só têm as expressões neutra e preocupada).
- **Loja**: o Tier 3 vende Magician's Force (MFC), Dark Crisis (DCR) e Invasion of Chaos (IOC) nos dias 0, 2 e 4 do
  tier, a 300 DP cada. Elas entram no `packs.json` e aparecem na vitrine como o "próximo tier" enquanto o Tier 2 está
  aberto.
- **Decks dos cinco** pela melhor receita "Anime Decks" do YGOPRODeck, escolhida pelo torneio, com meta de dificuldade
  própria para o Tier 3 (cerca de 78% contra o deck inicial; chefe cerca de 85%). Os Deuses Egípcios não estão no pool e
  são trocados por cartas da era com o mesmo papel.
- **Mapa no Tier 3**: os comuns dos Tiers 1 e 2 continuam aparecendo, cada tier anterior num anel mais para os lados. São
  até 16 cabeças, sem sobreposição.
- **O Tier 4 continua sem conteúdo**: vencer o Kaiba dá o pacote-prêmio, e o progresso avisa que o Tier 4 chega numa
  próxima atualização.
- **Presets de depuração** `?campaign=tier3` e `?campaign=kaiba`. Os testes de fumaça e de dificuldade passam a cobrir o
  Tier 3.

## Capabilities

### New Capabilities
- `elenco-tier3`: os duelistas do Tier 3 (cena, falas, assinatura) e o chefe Kaiba.

### Modified Capabilities
- `economia-dp`: as coleções do Tier 3 (MFC, DCR e IOC), com preços e dias, entram na lista de pacotes à venda.
- `cpu-do-duelo`: meta de dificuldade do Tier 3 e o Kaiba no perfil de chefe.
- `campanha`: no Tier 3, os comuns dos Tiers 1 e 2 continuam no mapa, em anéis.
- `progressao-por-tiers`: o exemplo de "tier sem conteúdo" passa a ser o Tier 4, depois do Kaiba.

## Impact

- **Dados**:
  - `src/campaign/data/tiers.json` (Tier 3, caixas e nomes das coleções);
  - `dialogue-tier3.json` (novo);
  - `decks.json` (regerado);
  - `campaign.json` e `packs.json` (gerados pelo `copy_campaign_data.py`, que passa a juntar o `dialogue-tier3.json`).
- **Scripts**:
  - `scripts/fetch_deck_recipes.py` (cinco personagens novos);
  - `scripts/build_decks.py` (`REPLACE`/`TUNE` do T3);
  - pipeline de personagens: Strings em `assets/characters/strings/`, `build_characters.py` e `build_sprites.py`.
- **Código**:
  - `src/campaign/balance.ts` (preços);
  - `src/campaign/debug.ts` (presets);
  - `src/screens/campaign/chars.ts` (sprites e cores de fala);
  - `proto/difficulty-target.ts` (meta do T3);
  - `vite.config.ts` (pré-carga dos sprites novos);
  - talvez `src/campaign/map.ts`, se os anéis apertarem com 16 cabeças.
- **Testes**:
  - `data.test.ts`;
  - testes de `map`, `packs`, `rewards` e `debug`;
  - `proto/story-smoke.ts`, `economy-smoke.ts`, `difficulty.ts`, `tier-balance.ts` e `monkey.ts`.
- **Arte da Konami fora do git**: os sprites do Strings e as capas das coleções novas, se existirem no nativo. Os fundos
  do Tier 3 já foram copiados pelo `copy_tfs_backgrounds.py`.
- **Saves**: nada muda no formato. Um save que esteja no Tier 2 depois do dia 14, ou com o Pegasus vencido, passa a abrir
  no Tier 3 (é a regra atual de "tier sem conteúdo" deixando de valer para ele).
