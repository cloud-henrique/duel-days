# Design

## Context

- **Modelo da campanha** (`src/campaign/`, puro e testado) lê um único tier: `CAMPAIGN.tier` em `calendar.ts`, `map.ts`,
  `rewards.ts` e `packs.ts`. Hoje o Tier 1 vai até o dia 30; o "Tier 2 não existe" é tratado em `calendar.ts` (aviso
  depois do dia 7 ou do Yugi).
- **Dados**: `campaign.json` (`starterDeck`, `startingPacks`, `tier` com `locations` e `duelists`, cada um com
  `location` e deck do nativo) e `dialogue.json` vêm do nativo pelo `copy_campaign_data.py`; `packs.json` já monta as
  coleções a partir do `public/data/boosters.json` (change `colecao-dm`).
- **Mapa**: já mostra só o nome do lugar com as cabeças flutuando em cima e abre o encontro direto pela cabeça (feito
  antes desta change, a pedido do usuário). O encontro usa o fundo do lugar (`place-<lugar>.jpg`).
- **Save**: `CampaignState` com `day`, `period`, `defeatedBosses: number[]`, `victories`, afinidade e eventos. Todo
  sorteio sai da semente (`rng.ts`, `PURPOSE`).
- **Sprites** dos novos (`weevil_underwood`, `rex_raptor`, `mako_tsunami`, `bandit_keith`, `mai_valentine`,
  `maximillion_pegasus`) existem em `public/characters`; a pré-carga inclui os da `CHAR_ID` (`vite.config.ts`).
- **Fundos do Tag Force Special**: o zip "Events" do The Spriters Resource tem 172 fundos de 480×272; os da era DM são
  `evs1_36` a `evs1_99`. O site barra download por script (desafio do Cloudflare): o zip é baixado à mão e fica em
  `raw/tfs/` (arte da Konami, fora do git).
- **Receitas**: a API documentada do YGOPRODeck (v7) não tem decks; o site tem `ygoprodeck.com/api/decks/getDecks.php`
  (não documentado) com `name`, `format=Anime Decks`, `limit` (20) e `offset`. Levantamento de 17/11/2026: todos os
  personagens do elenco têm receitas, a maioria com 100% das cartas no pool; os piores casos são Yami Yugi e Yami Marik
  (92–95%) e Espa Roba (92%).
- A change `campanha-dm` ainda não foi arquivada: os specs `campanha` e `economia-dp` existem só nela.

## Goals / Non-Goals

**Goals:**
- Lista de tiers nos dados e um modelo que trabalha com "tier atual", sem regra fixa do Tier 1.
- Mapa no estilo do Tag Force Special (só cabeças) e cena própria por duelista.
- Melhor receita possível para cada duelista, escolhida de forma reproduzível.
- Tier 2 jogável de ponta a ponta (mapa, encontro, duelo, recompensas, loja).
- Saves em andamento seguem sem migração destrutiva.

**Non-Goals:**
- Personalidade de CPU por duelista, Deuses Egípcios, conteúdo jogável dos Tiers 3 e 4.
- Laços, conversa, eventos e pacotes de personagem dos duelistas novos.
- Mapa próprio da ilha (descartado: o desenho destoa do resto) e roupas por tier (Joey e Téa casuais ficam para o T3).

## Decisions

### 1. `tiers` nos dados, Tier 2 versionado na PWA
`campaign.json` troca `tier` por `tiers: Tier[]`. O Tier 1 continua vindo do nativo; o resto (Tier 2, as cenas do
Tier 1, os dias das coleções e os pontos do mapa) vive em `src/campaign/data/tiers.json` (versionado: só metadados) e o
`copy_campaign_data.py` junta os dois. Cada duelista ganha
`bond: boolean` (Tier 1 `true`, Tier 2 `false`) e `scene: { bg, place }`; `location` e `locations` saem. As falas do
Tier 2 ficam em `src/campaign/data/dialogue-tier2.json`, juntadas ao `dialogue.json` pelo mesmo script, no mesmo formato.
*Alternativa:* editar o `campaign.json` gerado à mão. Rejeitada: o script sobrescreve.

### 2. Tier atual derivado + `bossDefeatedOn`
`tiers.ts` (novo, puro): `tierOpenDay(s, n)` e `currentTier(s)`. O Tier n+1 abre no menor entre o primeiro dia da
janela dele e o dia em que o chefe do Tier n foi vencido (o próprio duelo já gasta o período, então "período seguinte"
sai de graça), e só se tiver duelistas nos dados. O save ganha `bossDefeatedOn?: Record<number, number>` (tier → dia),
gravado no `applyDuel`; sem ele (saves antigos) vale o primeiro dia da janela. Nada é reescrito no save ao abrir.
*Alternativa:* guardar `currentTier` no save. Rejeitada: duplica estado e precisa de migração.

### 3. Mapa: cabeças em pontos sorteados
`campaign.json` ganha `mapPoints: {x, y}[]` (uns 10 pontos no panorama, longe das bordas e entre si, escolhidos à mão
sobre a imagem). `map.ts` sorteia quem aparece (2 a 4 comuns do tier atual; a partir do T2, 1 a 2 amigos do T1 com outro
`PURPOSE`; os chefes liberados sempre) e distribui essas pessoas em pontos diferentes com outro `PURPOSE`, tudo pela
semente, dia e período. A `MapScreen` desenha só as cabeças (botões; chefe com coroa, "!" de evento), sem rótulo; a loja
fica no atalho de baixo. `tierProgress` usa o tier atual.
*Alternativa:* posições fixas por duelista. Rejeitada: com 10+ pessoas por tier, os lugares se amontoam.

### 4. Cena por duelista com os fundos do Tag Force Special
`scripts/copy_tfs_backgrounds.py` lê o zip de `raw/tfs/`, escolhe os fundos da tabela abaixo e grava
`public/campaign/bg-<nome>.jpg` (480×272, sem reescala; a cena já desfoca o fundo). O `assets.ts` troca o `placeBg`
pelo `sceneBg(duelista)`, com o degradê de reserva. O nome do lugar vai no topo da cena. Os eventos de laço do T1
continuam com os fundos deles.

| Tier | Duelista | Lugar | Fundo |
|---|---|---|---|
| 1 | Tristan | Escola Domino | `evs1_70` |
| 1 | Téa | Rua de Domino | `evs1_62` |
| 1 | Joey | Parque | `evs1_65` |
| 1 | Bakura | Rua arborizada | `evs1_81` |
| 1 | Yugi (chefe) | Loja de Jogos do Vovô | `evs1_72` |
| 2 | Weevil | Floresta da ilha | `evs1_92` |
| 2 | Rex | Reino dos Duelistas | `evs1_67` |
| 2 | Mako | Praia da ilha | `evs1_83` |
| 2 | Bandit Keith | Caverna da ilha | `evs1_93` |
| 2 | Mai | Convés do navio | `evs1_54` |
| 2 | Pegasus (chefe) | Castelo do Pegasus | `evs1_50` |
| 3 | Espa Roba | Praça do museu | `evs1_77` |
| 3 | Rare Hunter | Beco | `evs1_69` |
| 3 | Arkana | Palco | `evs1_46` |
| 3 | Strings | Rua com neblina | `evs1_60` |
| 3 | Kaiba (chefe) | Museu de Domino | `evs1_78` |
| 4 | Ishizu | Kaiba Corp | `evs1_79` |
| 4 | Odion | Arena do dirigível | `evs1_58` |
| 4 | Yami Bakura | Cabine do dirigível | `evs1_75` |
| 4 | Marik | Cais | `evs1_82` |
| 4 | Yami Marik | Reino das Sombras | `evs1_45` |
| 4 | Yami Yugi (chefe) | Arena da torre | `evs1_59` |

As linhas dos Tiers 3 e 4 ficam registradas para as changes deles; o script já copia esses fundos.

### 5. DP, assinatura e prêmio pelo tier do duelista
`BALANCE.baseDPByTier = {1: 300, 2: 400, 3: 500, 4: 600}`; `rewards.ts` acha o tier do duelista (não o atual). A
assinatura (10ª vitória) e o pacote-prêmio do chefe usam os dados do tier dele; o prêmio vale se a primeira vitória for
até o último dia da janela do tier do chefe.

### 6. Loja por tier com dias relativos
Cada tier lista as caixas com `offset` em dias (T1: LOB 0, MRD 0, MRL 2, PSV 4; T2: LON 0, LOD 2, PGD 4); o dia de
abertura é `tierOpenDay + offset`. `packs.ts` mostra: as abertas (tiers abertos), as do tier atual ainda fechadas
(bloqueio por dia) e as do próximo tier (bloqueio "Tier N · dia D" pelo prazo). Preços em `BALANCE.packPrices`
(LON/LOD/PGD 250). O `packs.json` ganha LON, LOD e PGD a partir do `boosters.json`, com a capa desenhada se o nativo não
tiver a dele.

### 7. Encontro sem laço
`EncounterScreen`/`Dialogue` escondem corações e "Conversar" quando `bond` é falso; `bond.ts` ignora esses duelistas
(sem afinidade, eventos ou epílogo). A tela de Laços continua só com o Tier 1.

### 8. Receitas do YGOPRODeck escolhidas por simulação
- `scripts/fetch_deck_recipes.py` busca, por personagem, as receitas `format=Anime Decks` (paginando de 20 em 20, com
  pausa entre pedidos) e grava em `raw/decks/<personagem>.json` (fora do git: são textos de terceiros). Um filtro por
  nome separa as variantes (Yami Yugi × Yugi, Yami Bakura × Bakura, Yami Marik × Marik) e descarta DSoD.
- Os ids passam pelo mesmo `canon` do `export_data.py` (arte alternativa → id original); candidatas são as receitas com
  ao menos 85% do Main no pool, até 6 por personagem (as mais vistas).
- Cartas fora do pool são trocadas por uma carta da era com o mesmo papel; a troca vai num comentário no `decks.json`.
- `proto/deck-pick.ts` (no mesmo `DuelDriver` do `monkey.ts`) faz um torneio entre as candidatas de cada personagem
  (cada uma contra as outras e contra os decks dos comuns do tier, 30 duelos por par) e grava a vencedora em
  `src/campaign/data/decks.json` (versionado: só ids, a URL da receita e os comentários).
- O pool inteiro vale para todos, sem limite pelas caixas do tier: é o pedido do usuário ("a melhor receita possível").
- `scripts/build_decks.py` grava o `decks.json` a partir das vencedoras, com as trocas revisadas à mão (`REPLACE`) e os
  ajustes de força (`TUNE`) comentados no deck. `proto/tier-balance.ts` confere o cenário "Chefe mais forte" com os decks
  finais. Na implementação, o Pegasus ficou em 46% contra os comuns do T2 (o Ritual quase nunca sai com a CPU); com o
  Black Illusion Ritual, o Ultimate Offering e os Jar of Greed trocados por Change of Heart, Mirror Force, Raigeki e
  Dark Hole, foi a 55%. O Yugi ficou em 52% contra os comuns do T1.
*Alternativa:* limitar as receitas às caixas abertas até o tier do personagem. Rejeitada pelo usuário.

### 9. Falas curtas escritas na PWA
Escritas em pt-BR no tom das do Tier 1 (curtas, uma ideia por fala, `{nome}` e `{m|f|n}`), 2 a 3 variações por momento,
sem spoiler dos tiers seguintes. O usuário revisa antes de fechar a change.

### 10. Conferência
Presets de depuração novos: `?campaign=tier2` (dia 8, Tier 2 aberto) e `?campaign=pegasus` (os 5 comuns do Tier 2
vencidos). `story-smoke.ts` passa a contar tiers abertos, chefes vencidos e prêmios; `economy-smoke.ts` confere os
pacotes novos; os e2e clicam na cabeça (`.pinhead`).

## Elenco planejado dos Tiers 3 e 4

Registrado aqui para as changes seguintes (sem dados nem decks nesta):
- T3, Batalha da Cidade: Espa Roba, Rare Hunter, Arkana e Strings; chefe Seto Kaiba (casaco branco).
- T4, Finais: Ishizu, Odion, Yami Bakura, Marik e Yami Marik; chefe Yami Yugi.
- Fora do elenco: Serenity, Roland, Mokuba, Solomon, Noah, Rebecca, Duke, Lumis e Umbra, Bonz, Para e Dox, e todas as
  variantes DSoD (visual destoa e decks fora da era).

## Risks / Trade-offs

- [Decks fortes em todos os tiers achatam a dificuldade e dão cartas fortes cedo (a carta da vitória sai do deck do
  oponente)] → a progressão fica no DP e nas caixas; a simulação mede a força de cada deck e o relatório do
  `deck-pick.ts` mostra a tabela para o usuário decidir ajustes.
- [Endpoint de decks não documentado pode mudar ou sair do ar] → só o script o usa, uma vez; o jogo usa o `decks.json`
  versionado.
- [Receitas de usuários com erros ou cartas trocadas] → validação de deck, `data.test.ts` e o torneio descartam as ruins.
- [Fundos de 480×272 ficam suaves no iPhone] → a cena já desfoca o fundo; conferir no simulador.
- [Mudar os dias de MRL e PSV muda a economia do Tier 1] → a `economy-smoke` mede o DP médio no fim de cada janela.
- [Os amigos do Tier 1 dividem os períodos com o Tier 2] → 1 a 2 amigos por período; o `story-smoke` confere que as
  rotas e o epílogo continuam alcançados em 200 campanhas.
- [Specs `campanha` e `economia-dp` ainda na `campanha-dm`] → arquivar a `campanha-dm` antes de arquivar esta.

## Migration Plan

Sem passo manual: saves antigos continuam (Decisão 2); os pontos do mapa saem da semente, então mudam uma vez para quem
estava no meio de um período. Deploy normal (os fundos novos vão no envio do `dist/` local, como a arte das cartas).
Reversão: voltar o commit; o campo `bossDefeatedOn` é ignorado pela versão anterior.

## Open Questions

- Capas de LON, LOD e PGD: depende de existirem no nativo; sem elas, a capa desenhada.
