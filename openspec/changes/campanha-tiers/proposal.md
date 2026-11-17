# Proposta

## Why

A campanha só tem o Tier 1: depois do dia 7 (ou do Yugi vencido), os mesmos 5 duelistas e as mesmas 4 coleções seguem
até o dia 30. A `colecao-dm` trouxe a base inteira da era e as caixas TCG reais como dados; falta o jogo usá-las: liberar
as caixas em ordem cronológica conforme a campanha avança, com novos duelistas a cada tier, como no Tag Force Special:
um mapa só (Domino), as cabeças de quem está por perto e, no encontro, o fundo do lugar onde aquele duelista está naquela
fase da história.

## What Changes

- **Tiers no calendário**: 4 tiers em 30 dias (T1 dias 1–7, T2 8–14, T3 15–22, T4 23–30). Vencer o chefe do tier antes
  do fim da janela abre o próximo tier no período seguinte e dá um pacote-prêmio; chegar ao fim da janela abre o próximo
  sem prêmio. Enquanto um tier não tiver conteúdo (hoje, T3 e T4), o tier atual continua e o jogo avisa que o próximo
  chega numa atualização.
- **Elenco por tier** (todos no mapa de Domino):
  - T1, Antes do Reino: Tristan, Téa, Joey e Bakura; chefe Yugi (como hoje, com laços);
  - T2, Reino dos Duelistas: Weevil Underwood, Rex Raptor, Mako Tsunami, Bandit Keith e Mai Valentine; chefe
    Maximillion Pegasus;
  - T3, Batalha da Cidade (planejado): Espa Roba, Rare Hunter, Arkana e Strings; chefe Seto Kaiba;
  - T4, Finais (planejado): Ishizu, Odion, Yami Bakura, Marik e Yami Marik; chefe Yami Yugi.
  Esta change implementa T1 e T2; T3 e T4 ficam registrados para changes próprias.
- **Mapa no estilo do Tag Force Special**: sem lugares fixos nem nomes de lugar; só as cabeças de quem está por perto,
  espalhadas pelo panorama de Domino em pontos sorteados. Tocar numa cabeça abre o encontro direto. A loja fica só no
  atalho "Loja". **BREAKING (mapa do Tier 1)**: os 5 lugares e o painel do lugar saem.
- **Fundo do encontro por duelista e tier**: cada duelista tem a cena dele (fundo e nome do lugar), tirada dos fundos do
  Tag Force Special (escola, loja de jogos, parque; castelo do Pegasus, floresta e navio do Reino dos Duelistas; museu,
  praça, ruas; Kaiba Corp, dirigível, cais). A arte é da Konami e fica fora do git.
- **Decks com a melhor receita**: o deck de cada duelista, inclusive os amigos do T1 e o Yugi, sai das receitas "Anime
  Decks" do YGOPRODeck: candidatas filtradas para o pool da era, cartas fora do pool trocadas por cartas da era, e a
  vencedora escolhida por simulação CPU × CPU. **BREAKING (dificuldade do Tier 1)**: os decks do nativo saem.
- **Loja por tier**: cada tier aberto libera as suas caixas TCG em ordem cronológica, e as dos tiers anteriores continuam
  à venda. T1: LOB, MRD, MRL, PSV; T2: LON, LOD, PGD; T3: MFC, DCR, IOC; T4: AST, SOD, RDS. **BREAKING (economia do
  Tier 1)**: MRL e PSV passam a abrir dentro da janela do T1 (dias 3 e 5), em vez dos dias 11 e 21.
- **DP por tier do oponente**: a base da vitória passa a depender do tier de quem foi vencido (T1 300, T2 400, T3 500,
  T4 600); os bônus continuam os mesmos.
- **Tier 2 com falas curtas** (saudação, antes e depois do duelo, entrada e derrota do chefe) e carta-assinatura na 10ª
  vitória, como no T1. Sem corações, eventos de laço nem pacotes de personagem para os novos, por enquanto.
- **Os amigos do Tier 1 continuam** no mapa depois que o T2 abre, com conversas, eventos de laço e epílogo; duelar com
  eles paga o DP do Tier 1.
- **Cabeçalho e status** mostram o tier atual, o progresso dele e o dia em que o próximo abre.

Fora do escopo: duelistas, decks e falas dos Tiers 3 e 4 (só o elenco e as cenas ficam registrados), Deuses Egípcios,
laços e pacotes de personagem dos duelistas novos, mapa próprio da ilha (descartado: destoa do resto).

## Capabilities

### New Capabilities
- `progressao-por-tiers`: as janelas dos tiers no calendário, como o próximo tier abre (chefe ou prazo), o pacote-prêmio,
  o tier sem conteúdo e o que o cabeçalho e o status mostram do tier.
- `elenco-tier2`: os duelistas do Tier 2 (cena do encontro, falas curtas, assinaturas e o chefe Pegasus).

### Modified Capabilities
- `campanha` (da change `campanha-dm`): o mapa sem lugares (cabeças em pontos sorteados), quem aparece em cada período
  (amigos do T1 junto com o tier atual), o chefe do tier atual, o fundo do encontro por duelista e o deck do duelista
  pela receita escolhida.
- `economia-dp` (da change `campanha-dm`): DP da vitória pelo tier do oponente, coleções à venda por tier e as
  cartas-assinatura do Tier 2.

## Impact

- Dados: `src/campaign/data/campaign.json` passa a ter a lista de tiers (T1 do nativo + T2 novo), sem `locations`: cada
  duelista ganha `scene` (fundo e nome do lugar) e o mapa ganha a lista de pontos; `tier2.json` e `decks.json`
  (versionados, só ids e metadados); `packs.json` ganha LON, LOD e PGD; `dialogue.json` ganha as falas do T2.
- Scripts: `copy_campaign_data.py` (junta o T2 e os decks), `scripts/fetch_deck_recipes.py` (receitas do YGOPRODeck →
  `raw/decks/`), `scripts/copy_tfs_backgrounds.py` (zip dos fundos do Tag Force Special em `raw/tfs/` →
  `public/campaign/bg-*.jpg`, fora do git), `proto/deck-pick.ts` (escolhe a receita pela simulação).
- Modelo (`src/campaign/`): `calendar.ts`, `map.ts`, `rewards.ts`, `packs.ts`, `balance.ts`, `encounter.ts`, `state.ts`
  (o tier atual sai do dia e dos chefes vencidos; campo opcional com o dia de cada chefe, sem migração), `decks.ts`,
  `debug.ts`.
- Telas: `MapScreen`/`CampaignHeader`, `EncounterScreen`/`Dialogue` (fundo da cena; duelista sem corações),
  `StatusScreen`, `ShopScreen`, `chars.ts` (sprites dos 6 novos, que entram na pré-carga pelo `vite.config.ts`).
- Testes e smokes: `story-smoke.ts`, `economy-smoke.ts`, `monkey.ts` (decks novos), e2e com o seletor das cabeças.
- Depende de a `campanha-dm` ser arquivada antes desta (os specs `campanha` e `economia-dp` nascem lá).
