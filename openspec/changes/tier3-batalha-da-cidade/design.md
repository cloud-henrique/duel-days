# Design

## Context

O modelo por tiers (change `campanha-tiers`) já trata qualquer número de tiers:
- `currentTier` e `tierOpenDay` (`tiers.ts`) abrem o próximo tier pelo chefe ou pelo prazo, e só se ele tiver duelistas;
- `packs.ts` libera as caixas por `offset` e mostra o próximo tier na vitrine;
- `rewards.ts` paga a base do `baseDPByTier` (o T3 já tem 500 DP) e o pacote-prêmio;
- `map.ts` desenha os tiers anteriores em anéis.

O Tier 3 já está no `tiers.json`, mas vazio (`packs: []`, `duelists: []`). Por isso hoje ele não abre e o Pegasus mostra
"Tier 3 chega numa próxima atualização".

O que já existe para ele:
- **Fundos**: `bg-praca-museu`, `bg-beco`, `bg-palco`, `bg-rua-neblina` e `bg-museu` já estão em `public/campaign/`
  (tabela da Decisão 4 do design da `campanha-tiers`).
- **Sprites**: `espa_roba`, `rare_hunter`, `arkana` e `seto_kaiba` estão em `public/characters`. O Strings não existe no
  conjunto baixado. O usuário baixou o zip dele à mão (`~/Downloads/Mobile - Yu-Gi-Oh! Duel Links - Portraits -
  Strings.zip`), com três arquivos: `Chara007` (corpo), `Chara007_1` (neutra) e `Chara007_7` (preocupada).
- **Coleções**: MFC (107 cartas), DCR (106) e IOC (110) estão no `public/data/boosters.json`.
- **Deuses Egípcios**: Obelisk, Slifer e Ra não estão no pool (`cards.json`).
- **Expressões**: o `expressionFor` (`chars.ts`) cai para `neutral` quando falta uma expressão.
- **Metas de dificuldade**: `proto/difficulty-target.ts` tem metas só para T1, T2 e chefe. Um tier sem meta cai na do T2.

## Goals / Non-Goals

**Goals:**
- Tier 3 jogável pelo mesmo caminho do Tier 2, com o mínimo de código novo. A maior parte é dado, script e teste.
- Decks dos cinco pelo mesmo pipeline (receitas, torneio, `REPLACE`/`TUNE`), conferidos contra a meta do T3.
- Mapa legível com até 16 cabeças.

**Non-Goals:**
- Tier 4 (Finais) e o fim da campanha diferente.
- Laços, conversa, eventos e pacotes de personagem dos duelistas do T3 (o T2 também não tem).
- Deuses Egípcios e outras cartas fora do pool.
- Roupas por tier (Joey e Téa casuais): não há sprites.
- Personalidade de CPU por duelista.

## Decisions

### 1. Tier 3 nos dados, do mesmo jeito que o Tier 2
O `tiers.json` preenche o Tier 3:
- caixas: `mfc` offset 0, `dcr` offset 2, `ioc` offset 4;
- os cinco duelistas, com `scene` e `signatureCard`;
- `packNames` das três coleções.

As falas ficam em `src/campaign/data/dialogue-tier3.json`, no formato do `dialogue-tier2.json`. O `copy_campaign_data.py`
junta todos os `dialogue-tier*.json` (glob em vez de nome fixo), para o Tier 4 não precisar mexer no script de novo.

Chaves: `espa`, `rarehunter`, `arkana`, `strings`, `kaiba`.

| Duelista | Lugar | Fundo | Assinatura |
|---|---|---|---|
| Espa Roba | Praça do museu | `praca-museu` | Jinzo (77585513) |
| Rare Hunter | Beco | `beco` | Exodia the Forbidden One (33396948) |
| Arkana | Palco | `palco` | Dark Magic Curtain (99789342) |
| Strings | Rua com neblina | `rua-neblina` | Revival Jam (31709826) |
| Kaiba (chefe) | Museu de Domino | `museu` | Blue-Eyes White Dragon (89631139) |

A Exodia é limitada a 1 e o jogador pode ganhá-la como assinatura. Ela continua respeitando o limite do deck (`addRefusal`).

*Alternativa:* um arquivo de falas único para todos os tiers. Rejeitada: o arquivo por tier deixa as revisões menores.

### 2. Sprites do Strings pelo pipeline de personagens
O zip vai para `raw/characters/` (fora do git). Os arquivos são copiados para a estrutura do
`assets/characters/README.md`:
- `strings/full_chara007.png` (o corpo);
- `strings/faces/chara007_01.png` e `chara007_07.png`, mantendo o número do jogo.

A entrada no `characters.json` mapeia `neutral` → `_01` e `worried` → `_07`. Depois rodam `build_characters.py` e
`build_sprites.py`.

As falas do Strings usam só `neutral`, e `worried` na derrota. Qualquer outra expressão cai para `neutral` pelo
`expressionFor`, sem código novo. O `chars.ts` ganha as cinco chaves no `CHAR_ID` e as cores de fala, e a pré-carga do
`vite.config.ts` passa a incluir os sprites pelo próprio `CHAR_ID`.

*Alternativa:* deixar o Strings sem retrato. Rejeitada: a cena perde o personagem.

### 3. Decks pelo pipeline existente
- `fetch_deck_recipes.py` ganha os cinco no `CHARACTERS`, com filtro por nome:
  - Espa Roba: "Espa Roba" e "Esper Roba";
  - Rare Hunter: "Rare Hunter", ficando só com as receitas de Exodia;
  - Arkana: "Arkana" e "Pandora";
  - Strings: "Strings" e "Puppet";
  - Kaiba: "Kaiba", excluindo "Legendary", DSoD, "Noah" e "Duelist Kingdom".
- As cartas fora do pool (os Deuses, principalmente) são trocadas no `REPLACE` do `build_decks.py` por cartas da era com
  o mesmo papel, cada troca comentada. Exemplos: Slifer → Mago do Tempo Negro ou um monstro de defesa alta, conforme o
  deck; Obelisk → XYZ-Dragon Cannon ou um terceiro Olhos Azuis.
- O `deck-pick.ts` faz o torneio entre as candidatas de cada um, contra os comuns do T3.
- `proto/difficulty-target.ts` ganha `3: 0.78`. O chefe continua em 0,85.
- O `tier-balance.ts` confere que o Kaiba vence a maioria contra os comuns do T3.

Por que 78%: a meta sobe 15 pontos do T1 para o T2. Do T2 para o T3 sobe menos, porque o chefe já está em 85% e precisa
continuar acima dos comuns do próprio tier.

*Alternativa:* metas de chefe por tier (Kaiba a 90%). Rejeitada por enquanto: o perfil `chefe` já vê a mão do jogador, e
90% contra o deck inicial deixaria o Kaiba quase imbatível para quem não melhorou o deck. O relatório mostra o número
real para o usuário decidir.

### 4. Mapa com 16 cabeças
O `present` não muda: 2 a 4 comuns do T3, os 4 amigos do T1, os 5 comuns do T2 e até 3 chefes. O pior caso, com os 4
comuns do T3 no período, dá 16 cabeças.

No T3 o `ringX` põe:
- o T3 no meio (k = 0);
- o T2 no anel k = 1 (x de cerca de 0,22 a 0,35 e de 0,65 a 0,78);
- o T1 no anel k = 2 (x de cerca de 0,09 a 0,22 e de 0,78 a 0,91).

O teste novo cobre o pior caso por várias sementes e mede a menor distância entre cabeças. Se ela ficar abaixo de
`MIN_GAP` (0,17), duas coisas podem mudar, por esta ordem:
1. aumentar as tentativas e estreitar o `RING.step`;
2. se não bastar, colocar os chefes vencidos de tiers anteriores no anel do tier deles, em vez de no meio.

Mostrar só parte dos comuns antigos foi descartado, porque mudaria o spec de "todos continuam aparecendo".

### 5. Preços e economia
`BALANCE.packPrices` ganha `mfc`, `dcr` e `ioc` a 300 DP (a base da vitória sobe 25% do T2 para o T3, e o pacote sobe
20%). O `economy-smoke.ts` confere as três coleções (raridades e os 70/20/10 do slot) e o DP médio no fim da janela do T3.

### 6. Capas das coleções
O `copy_campaign_assets.py` copia `pack-mfc`, `pack-dcr` e `pack-ioc` se o app nativo tiver essas capas. Se não tiver,
vale a capa desenhada que a loja já usa como reserva (`assets.ts`).

### 7. Conferência
- Presets novos no `debug.ts`:
  - `?campaign=tier3`: dia 15, Tier 3 aberto pelo prazo, com 2000 DP;
  - `?campaign=kaiba`: dia 18, os 4 comuns do T3 vencidos.
- O `story-smoke.ts` passa a contar o Tier 3 aberto, o Kaiba vencido e os prêmios. Rotas e epílogos do T1 precisam
  continuar sendo alcançados nas 200 campanhas.
- `data.test.ts` confere os duelistas do T3, as falas de todos os momentos e as assinaturas dentro do deck de cada dono.

### 8. Resposta automática recusada (achado na implementação)
O `monkey.ts` travou 2 duelos do Strings. A Amazoness Archers obriga a atacar, mas o comando de batalha continua
oferecendo "ir para a Main 2". A política barata escolhia essa opção, o motor recusava (RETRY), e o driver devolvia ao
jogador o último prompt dele, que o motor também recusava, então o duelo travava. Agora o driver tenta outra resposta do
mesmo pedido (`alternatives` no `cpu.ts`, testado no `retry.test.ts`) e só vira erro visível quando nenhuma serve. O bug
já existia antes; os decks do T3 só o deixaram à vista.

## Risks / Trade-offs

- [Poucas receitas "Anime Decks" para Strings ou Arkana, ou receitas com o Deus como peça central] → trocas comentadas
  no `REPLACE`, e o torneio descarta as ruins. Se nenhuma candidata passar de 85% do Main no pool, o deck é montado à mão
  a partir da melhor receita, com cada troca comentada (o spec "Receita do deck" já permite trocas).
- [Rare Hunter de Exodia vence do nada ou nunca vence (depende de comprar as 5 peças)] → a meta de dificuldade mede o
  efeito real. Se ficar fora, o `TUNE` acrescenta proteção e compra, sem tirar o tema.
- [O Kaiba no sprite do Duel Links não usa o casaco branco da Batalha da Cidade] → aceito: é o sprite que existe.
  Conferir no simulador.
- [O Strings com só duas expressões fica parado nas cenas] → combina com o personagem (fantoche do Marik).
- [16 cabeças apertam o mapa no celular] → teste de distância mínima e conferência no simulador (Decisão 4).
- [Saves parados no Tier 2 depois do dia 15 abrem direto no Tier 3, com as três caixas já liberadas] → é a regra atual
  de abertura retroativa (spec `progressao-por-tiers`). O jogador vê tudo novo de uma vez, sem perder nada.

## Migration Plan

Sem passo manual: o save não muda de formato. Deploy normal pelo `wrangler`, depois do push. Os sprites do Strings e as
capas vão no envio do `dist/` local, como o resto da arte. Para reverter, basta voltar o commit: com o Tier 3 vazio de
novo, o modelo volta a tratá-lo como "tier sem conteúdo", e os saves continuam abrindo.

## Open Questions

- Se as receitas do Strings e do Arkana vão precisar de deck montado à mão. Só se sabe depois do
  `fetch_deck_recipes.py`, e nos dois casos o caminho já está decidido (Risks).
