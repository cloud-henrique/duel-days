# Design

## Context

O modelo por tiers já trata qualquer número de tiers (veja o design da `tier3-batalha-da-cidade`). Este é o estado atual
do que o Tier 4 toca:

- **`tiers.json`**: tem o Tier 4 ("Finais", dias 23 a 30) com `packs: []` e `duelists: []`. Por isso ele não abre, e o
  Kaiba mostra "o próximo tier chega numa atualização" (`awaitsNextUpdate`).
- **Chefes**: um por tier. `bossOf(t)` acha o `isBoss`, `defeatedBosses` guarda o **número do tier** e `bossDefeatedOn`
  guarda o dia por tier. O `cpuFor` escolhe o perfil `chefe` pelo `isBoss`. Um segundo chefe no mesmo tier não cabe
  nesse modelo.
- **Mapa** (`map.ts`): cada cabeça vai para o anel `k = tier atual − tier do duelista`, e isso já vale para os chefes. O
  problema é que o `RING` (`innerHalf` 0,13, `step` 0,13) só tem espaço até k = 2: o anel k = 3 começa em x ≈ 0,41 do
  centro e o `clamp` empilha as cabeças nas bordas 0,05/0,95.
- **Epílogo**: `epilogueDuelist` escolhe o amigo (mais eventos vencidos, depois afinidade, depois a ordem do conteúdo), ou
  ninguém se não houver nenhum evento vencido.
- **Falas**: o `copy_campaign_data.py` junta os `dialogue-tier*.json` só pela chave `duelists` e exige falas de cada
  duelista de cada tier.
- **Deuses**: os scripts modernos existem (`raw/data/CardScripts/official/c10000000.lua` Obelisk, `c10000010` Ra,
  `c10000020` Slifer). Eles estão fora da base só pelo corte de data OCG e não têm texto em português no
  `text.pt.json`. O `incluir.json` do `import_dm.py` é o caminho previsto para exceções.
- **Assets**: fundos (`kaiba-corp`, `arena-dirigivel`, `cabine-dirigivel`, `cais`, `reino-das-sombras`, `arena-torre`) e
  sprites (`ishizu_ishtar`, `odion`, `yami_bakura`, `marik_ishtar`, `yami_marik`, `yami_yugi`) já estão em `public/`.
- **Coleções**: AST tem 109 cartas no pool e SOD tem 60, cortada pela data.

## Goals / Non-Goals

**Goals:**

- Tier 4 pelo mesmo caminho do T2 e do T3, que é quase todo dado, script e teste.
- Um papel novo de **duelo final**, pequeno e explícito, sem generalizar para "N chefes por tier".
- Os Deuses rodando no motor e na CPU antes de qualquer deck depender deles.
- Mapa legível com 22 cabeças no celular.

**Non-Goals:**

- Laços, eventos, rota e pacote de personagem para o Tier 4.
- Mudar o epílogo ou o fim da campanha no dia 30.
- Deuses à venda ou no sorteio de carta por vitória.
- Uma versão "anime" dos Deuses (regras do Ra do anime, Deuses que só o dono controla). Vale o script oficial.
- Roupas por tier e personalidade de CPU por duelista.
- RDS e coleções posteriores.

## Decisions

### 1. Duelo final como papel próprio (`isFinal`), fora do "chefe do tier"

O Yami Yugi entra no Tier 4 do `tiers.json` com `isBoss: false` e `isFinal: true` (campo opcional no `DuelistData`).
Com isso:

- o `regularsOf` exclui também o `isFinal`, então o "X/N vencidos" continua 4/4 e o `tierCleared` não depende dele;
- o `bossOf` continua achando só o Yami Marik, e `defeatedBosses`/`bossDefeatedOn` não mudam de forma;
- `finalOf(t)` e `isFinalAvailable(s)` (o chefe do tier vencido) entram no `tiers.ts`, e o `present` acrescenta o final
  depois dos chefes;
- o `cpuFor` devolve `chefe` para `isBoss || isFinal`, e o `proto/difficulty-target.ts` dá ao final a meta de 0,90;
- o save ganha um campo opcional, `champion?: { day: number; scene: string }`, com o dia da primeira vitória e a chave da
  cena que tocou (a chave de um amigo ou `generic`). Ele serve para rever a mesma versão e para o status. Ausente quer
  dizer que o jogador não é campeão, então o `CAMPAIGN_VERSION` não muda.

_Alternativa:_ `bosses: string[]` por tier, com `defeatedBosses` por chave. Rejeitada porque mexe no formato do save, na
regra do pacote-prêmio e em todos os testes de tier por um caso único.

_Alternativa:_ um "Tier 5" só com o Yami Yugi. Rejeitada porque exigiria janela, loja vazia e a regra do "último tier"
num tier falso.

### 2. Slifer na primeira vitória

No `rewards.ts`, a assinatura sai quando `nth === (d.isFinal ? 1 : BALANCE.signatureWins)`. O caminho de assinatura
atrasada (`lateSignature`) continua igual. O `data.test.ts` passa a aceitar a fala de vitória do final mencionando o
Slifer, mas só para o `isFinal`, e a regra "nenhuma fala de vitória entrega carta" continua valendo para os outros.

### 3. Cena de campeão

- As falas ficam no `dialogue-tier4.json`, numa chave nova de primeiro nível, `champion: { joey, tea, tristan, bakura,
yugi, generic }`. O `copy_campaign_data.py` passa a juntar também o `champion`, além do `duelists`, e falha se faltar
  alguma das 6 cenas.
- Quem escolhe a versão é a `championScene(s)` (em `bond.ts`, ao lado do epílogo), que usa o próprio
  `epilogueDuelist(s)`. Com `null`, vale a `generic`. Usar o mesmo critério garante que a cena de campeão e o epílogo
  falem do mesmo amigo.
- A cena não depende da rota: amizade e romance tocam a mesma versão. A cena genérica tem vários falantes (o
  Yami Yugi e os cinco amigos), e as dos amigos têm dois (o Yami Yugi e o amigo).
  - _Achado na implementação:_ o `Dialogue` mostrava sempre o `stage.duelist` do outro lado do jogador.
  - Agora esse lado mostra quem falou por último (sprite, nome e cor).
  - Nas cenas de um duelista só nada muda, porque o último falante é sempre ele.
- O fundo é o da Arena da torre (`arena-torre`). Ela toca pelo mesmo `Dialogue` da cena avulsa (`Screen` "cena avulsa"
  do `App`), logo depois da fala de derrota do Yami Yugi no fim do duelo, e grava o `champion` antes de tocar.
- "Rever cena de campeão" no Status e na `CampaignEnd` lê o `champion.scene` e ignora o laço atual.

### 4. Mapa com quatro anéis

O `RING` é recalculado para caber até k = 3 dentro de x 0,03–0,97: `innerHalf` cerca de 0,12 e `step` cerca de 0,115.
O anel 3 fica com cerca de 0,10 de largura de cada lado e recebe os 4 amigos do T1 e o Yugi. O chefe já vai para o anel
do próprio tier, que é a regra atual do `tierOf`. O Yami Marik e o Yami Yugi ficam no meio, com os comuns do T4.

Para não mudar o mapa de quem está no T2 ou no T3, os valores novos só valem com o tier atual = 4
(`RING_BY_TIER`, ou um parâmetro pelo número de anéis): os saves em andamento veem os mesmos pontos.

O teste novo cobre o pior caso do Tier 4 (22 cabeças) com várias sementes e mede a menor distância contra o `MIN_GAP`.
Se não couber, os passos são, nesta ordem:

1. mais tentativas;
2. `MIN_GAP` só para o anel externo (cerca de 0,15);
3. aceitar o anel 3 no limite do panorama, com as cabeças rolando.

_Resultado na implementação:_ com o Tier 4 sintético, em 1007 mapas cheios (22 cabeças) e 200 tentativas, 13% tinham
algum par abaixo de 0,17, e o pior caso foi 0,150. Posicionar o anel de fora primeiro não ajudou. Ficaram os passos 1
e 2: 600 tentativas só no Tier 4 e, quando nenhuma chega ao `MIN_GAP`, vale a mais longe encontrada. O pior caso ficou
em 0,155, e o 5º percentil em 0,17. A cabeça tem ~0,1, então sobra folga e nenhuma encosta em outra. O teste exige
≥ 0,15.

_Alternativa:_ esconder parte dos comuns antigos. Rejeitada pelo usuário: todos continuam aparecendo.

### 5. Deuses: spike antes dos decks

1. O `raw/import/incluir.json` ganha 10000000, 10000010 e 10000020. Rodam `import_dm.py` e `export_data.py`. Os boosters
   ficam iguais, porque os Deuses não estão em nenhuma caixa da era.
2. O `raw/overrides/text.pt.json` ganha nome e texto em português: "Obelisco, o Atormentador", "Slifer, o Dragão do
   Céu" e "O Dragão Alado de Rá", com o texto do script oficial traduzido.
3. O `LIMITED` do `src/game/decks.ts` ganha os três. Com isso eles caem fora do sorteio por vitória, pela regra atual
   das limitadas.
4. **Spike** num quebra-cabeça (`src/engine/__testing__/duel.ts`): cada Deus é invocado com 3 tributos no Speed
   (3 zonas), os efeitos rodam (o do Obelisk tributando 2, o ATK do Slifer pela mão, o pagamento de LP do Ra) e a CPU,
   pela busca, decide usar e não usar cada um. Depois, um `proto/smoke.ts` com decks aleatórios que incluem os Deuses.
   Se um Deus travar ou laçar, ele vai para o `alternatives` do `cpu.ts` ou ganha um ajuste de política. Só se não
   houver saída o Deus é trocado no deck por uma carta da era, e o usuário é consultado antes.
5. A arte dos três sai do `fetch_card_art.py` como as outras.

### 6. Dados e decks do Tier 4

- **`tiers.json`**:
  - caixas: `ast` offset 0 e `sod` offset 2;
  - `packNames`;
  - os seis duelistas, com `scene` e `signatureCard`.

| Chave        | Duelista           | Lugar               | Fundo               | Assinatura                         |
| ------------ | ------------------ | ------------------- | ------------------- | ---------------------------------- |
| `ishizu`     | Ishizu Ishtar      | Kaiba Corp          | `kaiba-corp`        | Exchange of the Spirit (17484499)  |
| `odion`      | Odion              | Arena do dirigível  | `arena-dirigivel`   | Embodiment of Apophis (28649820)   |
| `yamibakura` | Yami Bakura        | Cabine do dirigível | `cabine-dirigivel`  | Dark Necrofear (31829185)          |
| `marik`      | Marik              | Cais                | `cais`              | Obelisk the Tormentor (10000000)   |
| `yamimarik`  | Yami Marik (chefe) | Reino das Sombras   | `reino-das-sombras` | The Winged Dragon of Ra (10000010) |
| `yamiyugi`   | Yami Yugi (final)  | Arena da torre      | `arena-torre`       | Slifer the Sky Dragon (10000020)   |

- **Decks**:
  - o `fetch_deck_recipes.py` ganha os seis, com filtro por nome (Ishizu; Odion/Rishid; Yami Bakura/Thief King
    excluindo "Bakura" do T1 e "Necrofear" fora de era; Marik; Yami Marik; Yami Yugi/Atem, Battle City);
  - o `build_decks.py` usa o `KEEP` para o Deus de cada dono e o `REPLACE`/`TUNE` para o resto fora do pool, com cada
    troca comentada;
  - Marik com Obelisk e Yami Marik com Ra seguem a decisão do usuário, mesmo invertida em relação ao anime.
- **Metas** no `proto/difficulty-target.ts`: `4: 0.82`, chefe 0,85, final 0,90. O `tier-balance.ts` confere que o
  Yami Marik vence a maioria dos comuns do T4 e que o Yami Yugi vence a maioria contra o Yami Marik.
- **Preço**: `ast` e `sod` a 350 DP no `BALANCE.packPrices`.
- **Capas**: `pack-ast` e `pack-sod` pelo `copy_campaign_assets.py` se o nativo tiver. Se não tiver, vale a capa de
  reserva desenhada.
- **`chars.ts`**: as seis chaves → sprite, com as cores de fala. A pré-carga do `vite.config.ts` já segue o `CHAR_ID`.

### 7. Falas e dupla identidade

O `dialogue-tier4.json` segue o formato do T3 (2 a 3 variações por momento), mais o `bossIntro`/`bossDefeat` do Yami
Marik e do Yami Yugi. As falas do Yami Yugi e do Yami Bakura deixam claro, sem lore pesado, que são "o outro lado" do
amigo. As falas não citam eventos de laço, para não contradizer rotas.

### 8. Progresso e status

- O `awaitsNextUpdate` devolve `false` no último tier com conteúdo, porque não há `nextTier`. Antes do Tier 4 existir o
  aviso valia; agora o `tiers.json` não terá Tier 5.
- O `tierProgress` ganha um estado final: com o Yami Marik vencido e sem campeão, mostra "Final · vença Yami Yugi"; com
  campeão, mostra "Campeão da Batalha da Cidade".
- O `StatusScreen` mostra o dia do título e o botão "Rever cena de campeão".

### 9. Conferência

- Presets no `debug.ts`:
  - `?campaign=tier4`: dia 23, T4 aberto, 3000 DP;
  - `?campaign=yamimarik`: dia 26, os 4 comuns do T4 vencidos;
  - `?campaign=final`: dia 27, Yami Marik vencido, com eventos de laço do Joey.
- O `story-smoke.ts` passa a contar o T4 aberto, o Yami Marik vencido, o campeão e a distribuição das cenas de campeão.
- O `economy-smoke.ts` cobre AST e SOD.
- O `monkey.ts` e o `smoke.ts` rodam com os decks do T4.
- O `data.test.ts` confere o T4, o `isFinal` único e o `champion` completo.

## Risks / Trade-offs

- [O script moderno do Ra (modos de invocação, pagar LP) confunde a busca da CPU ou abre prompts que a política barata
  responde errado] → o spike vem antes dos decks. A saída são as `alternatives` ou um ajuste de política. A troca do Deus
  só acontece com aval do usuário.
- [O Obelisk no deck de um **comum** puxa o Marik para cima dos 82%] → o `TUNE` ajusta o resto do deck sem tirar o Deus.
  O relatório mostra o número real.
- [Três tributos no Speed (3 zonas) deixam os Deuses quase sem uso: a CPU nunca junta 3 monstros] → aceito como
  fidelidade ao formato. Se nenhum Deus sair nos duelos medidos, o `TUNE` acrescenta peças de apoio (Scapegoat ou fichas)
  aos decks dos donos.
- [22 cabeças no celular] → `RING` só no T4, o teste de distância e a conferência no simulador.
- [Yami Yugi e Yugi no mapa ao mesmo tempo podem estranhar] → decisão do usuário. As falas assumem a dupla identidade.
- [SOD com 60 cartas tem poucas raras] → a regra de "raridade abaixo e depois acima" do pacote já cobre. O
  `economy-smoke` confere.
- [Texto em português dos Deuses não é oficial] → fica no `raw/overrides/text.pt.json` e segue os nomes do anime
  brasileiro.

- [Chefes do T4 no limite dentro do tier] Depois de 4 rodadas de `TUNE`, os seis batem a meta contra o deck inicial
  (Yami Marik 83%, Yami Yugi 88%). Dentro do tier, porém, o Yami Marik vence 47% contra os comuns e o Yami Yugi vence 44%
  contra o Yami Marik (16 duelos por par, margem de ±12 pontos). A meta dos comuns do T4 (82%) é quase a do chefe (85%).
  Aceito pelo usuário como está.

## Migration Plan

- Os saves no Tier 3 com o Kaiba vencido e o tier inteiro limpo passam a abrir no Tier 4, com as coleções contadas a
  partir do `bossDefeatedOn[3]` (spec `progressao-por-tiers`). Nada a migrar: o `champion` é opcional.
- O deploy é o de sempre (`vite build` + `wrangler pages deploy`), depois de rodar `import_dm.py`/`export_data.py` e o
  `fetch_card_art.py` localmente: a base e a arte dos Deuses ficam fora do git.
- Rollback: voltar o `tiers.json` do Tier 4 para vazio faz o jogo voltar ao aviso de atualização. Saves com o `champion`
  continuam válidos.

## Open Questions

- O texto de cada cena de campeão (tom e tamanho) se decide na escrita das falas. Não muda specs nem tasks.
- Se a SOD terá capa própria depende do que o nativo tem. Sem ela, vale a capa de reserva.
