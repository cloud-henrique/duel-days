# Proposal

## Why

O Tier 4 (Finais, dias 23 a 30) existe no `tiers.json`, mas não tem nada dentro. Por isso, quem vence o Kaiba fica nos
mesmos oponentes até o fim, e a campanha acaba sem um clímax. Os fundos das Finais já foram copiados. Também já existem
os sprites da Ishizu, do Odion, do Yami Bakura, do Marik, do Yami Marik e do Yami Yugi, e as coleções AST e SOD estão
no pool. Com isso, o último tier é quase só conteúdo, mais duas peças novas: os Deuses Egípcios e um duelo final que
fecha o torneio.

## What Changes

- **Tier 4, Finais da Batalha da Cidade**, com quatro duelistas comuns e um chefe. Cada um tem a sua cena, a sua
  carta-assinatura e falas curtas, e nenhum tem laço:
  - Ishizu (Kaiba Corp), com Exchange of the Spirit;
  - Odion (Arena do dirigível), com Embodiment of Apophis;
  - Yami Bakura (Cabine do dirigível), com Dark Necrofear;
  - Marik (Cais), com Obelisk the Tormentor;
  - Yami Marik, o chefe (Reino das Sombras), com The Winged Dragon of Ra.
- **Duelo final com o Yami Yugi** (Arena da torre). Ele aparece no mapa só depois do Yami Marik vencido, junto com os 4
  comuns do Tier 4. Joga no perfil de chefe e entrega o Slifer the Sky Dragon já na **primeira** vitória. É a única
  exceção à regra de "assinatura só na 5ª vitória".
- **Cena de campeão**: na primeira vitória sobre o Yami Yugi, toca uma cena final. Ela muda conforme o amigo do Tier 1
  de laço mais forte (5 versões, pelo mesmo critério do epílogo). Sem laço, toca uma versão genérica, com o Yami Yugi e
  os cinco amigos. A campanha **não termina**: o jogo segue livre até a noite do dia 30, e então vem o epílogo como hoje.
- **Deuses Egípcios no pool**: Obelisk, Slifer e Ra entram como exceção explícita ao corte de 30/09/2004. São
  **limitados a 1** e nunca saem em pacote nem como carta sorteada de vitória. O jogador só os ganha como assinatura.
- **Yami Yugi e Yami Bakura convivem** com o Yugi e o Bakura do Tier 1 no mapa. As falas os tratam como "o outro lado",
  e os laços não mudam.
- **Loja**: o Tier 4 vende Ancient Sanctuary (AST) no dia em que o tier abre e Soul of the Duelist (SOD) 2 dias depois,
  a 350 DP cada.
- **Dificuldade**: a meta dos comuns do Tier 4 é cerca de 82% contra o deck inicial, a do Yami Marik continua em 85% e
  a do Yami Yugi é 90%.
- **Mapa com até ~21 cabeças**: os chefes vencidos de tiers anteriores passam para o anel do próprio tier, e todos os
  comuns antigos continuam aparecendo.
- **Fim do aviso de "próximo tier numa atualização"**: o Tier 4 é o último. Depois do Yami Marik, o progresso passa a
  apontar para o duelo final.
- **Presets de depuração** `?campaign=tier4`, `?campaign=yamimarik` e `?campaign=final`. Os testes de fumaça e de
  dificuldade passam a cobrir o Tier 4.

## Capabilities

### New Capabilities

- `elenco-tier4`: os duelistas do Tier 4 (cenas, falas, assinaturas), o chefe Yami Marik e o duelo final com o Yami
  Yugi (liberação, perfil, Slifer na primeira vitória).

### Modified Capabilities

- `campanha`:
  - quem aparece no Tier 4, com o Yami Yugi depois do chefe;
  - os pontos do mapa, com os chefes antigos no anel do tier deles;
  - a cena de campeão pelo laço mais forte.
- `progressao-por-tiers`:
  - o Tier 4 é o último e não tem aviso de atualização;
  - depois do Yami Marik, o progresso mostra o duelo final;
  - os cenários de "tier sem conteúdo" deixam de citar o Tier 4.
- `economia-dp`:
  - AST e SOD à venda no Tier 4;
  - a exceção do Slifer na primeira vitória;
  - os Deuses fora do sorteio de carta por vitória.
- `cpu-do-duelo`: meta de 82% para os comuns do Tier 4 e de 90% para o duelo final, que joga no perfil de chefe.
- `base-de-cartas`: os três Deuses Egípcios entram no pool como exceção ao corte, fora de qualquer booster.
- `formato-do-duelo`: os Deuses Egípcios são limitados a 1.

## Impact

- **Dados**:
  - `raw/import/incluir.json` (os 3 Deuses), seguido de `import_dm.py` e `export_data.py`;
  - `src/campaign/data/tiers.json` (Tier 4, AST/SOD, papel de duelo final);
  - `dialogue-tier4.json` (novo, com as 6 vozes e as 6 cenas de campeão);
  - `decks.json`, `campaign.json` e `packs.json`, regerados.
- **Scripts**:
  - `fetch_deck_recipes.py` (seis personagens);
  - `build_decks.py` (`REPLACE`/`TUNE`/`KEEP` do Tier 4);
  - `copy_campaign_assets.py` (capas `pack-ast`/`pack-sod`, se existirem no nativo).
- **Código**:
  - `src/game/decks.ts` (`LIMITED` com os Deuses);
  - `src/campaign/`:
    - `types.ts` (duelo final);
    - `tiers.ts`;
    - `map.ts` (chefes no anel, Yami Yugi);
    - `rewards.ts` (Slifer na 1ª vitória, campeão);
    - `state.ts` (dia da vitória final, opcional);
    - `calendar.ts` (sem aviso no último tier);
    - `bond.ts` ou um módulo novo (cena de campeão);
    - `balance.ts` (preços);
    - `debug.ts` (presets).
  - `src/screens/campaign/` (`MapScreen` e `StatusScreen` com o duelo final; a cena de campeão pelo `Dialogue`);
  - `chars.ts` (6 personagens);
  - `proto/difficulty-target.ts` e `vite.config.ts` (pré-carga dos sprites).
- **Motor**: os três Deuses precisam rodar no ocgcore no formato Speed (3 zonas, tributo de 3) e com a CPU de busca,
  sem travas nem laços. Isso é um _spike_ antes dos decks.
- **Saves**: o formato muda pouco (um campo opcional para a vitória final). Quem está no Tier 3 com o Kaiba vencido e o
  tier inteiro limpo passa a abrir no Tier 4.
- **Arte da Konami fora do git**: os sprites e os fundos já estão em `public/`, e as capas de AST e SOD só entram se
  existirem no nativo.
