# Proposta

## Why

A história da PWA ainda é um protótipo: 3 lugares, um personagem por lugar, cenas `intro` → `bond` → `rematch`, decks
aleatórios do pool e uma economia de rascunho (100/30 por duelo, pacote genérico). O app nativo (`duel-academy`) já tem a
campanha Duel Monsters (Tier 1) completa, com conteúdo escrito (384 falas, 20 eventos de laço), decks pesquisados da
época e uma economia balanceada. Com o visual base portado, a campanha é o próximo passo combinado.

## What Changes

- **BREAKING: a história atual sai.** Mapa de 3 lugares, corações, cenas `intro`/`bond`/`rematch` e os textos de
  `content.ts` dão lugar à campanha do nativo. O progresso da história, a coleção, os decks e o DP de hoje recomeçam
  (o perfil continua: nome, avatar, tratamento e estatísticas).
- **Calendário**: 30 dias com Manhã, Tarde e Noite. Só o duelo gasta um período (vitória, derrota, empate ou
  desistência). Conversar, a loja, o deck e o mapa não gastam. Depois da noite do dia 30, a campanha termina.
- **Mapa da Cidade de Domino**: 5 lugares fixos, cada um com o seu duelista:
  - Escola Domino (Tristan);
  - Burger World (Tea);
  - Fliperama (Joey);
  - Parque (Bakura);
  - Loja de Jogos do Vovô, que é a loja e onde fica o Yugi.

  Em cada período aparecem de 2 a 4 duelistas comuns, sorteados de forma reproduzível pela semente do save. O chefe
  Yugi aparece depois que o jogador vence os 4 ao menos uma vez. O mapa usa o panorama do *Tag Force Special*, com um
  filtro por período, e rola na horizontal. O cabeçalho mostra dia, período, DP e o progresso do tier.
- **Encontro**:
  - saudação no lugar, com o duelista de corpo inteiro e a caixa de fala;
  - menu com o evento aberto (se houver), Conversar, Duelar e Voltar;
  - falas antes e depois do duelo, a cena de primeira vitória (com o avatar do jogador em cena), a entrada e a
    derrota do chefe;
  - os textos vêm do `dialogue.json` do nativo, com `{nome}` e o trecho pelo tratamento.
- **Conversa**: 4 temas (Duelos, Escola, Hobbies, Boatos), uma conversa por dia por duelista. Um tema ruim é sorteado
  por dia. A conversa muda a afinidade.
- **Laços**:
  - 4 corações de 100 pontos por duelista;
  - afinidade por duelo e por conversa, com teto e piso por coração;
  - 4 eventos por duelista: cena no lugar e um duelo que precisa ser vencido;
  - no fim do 3º evento, a escolha amizade ou romance, que muda o 4º evento, a saudação e o epílogo;
  - o 4º evento dá a carta do laço;
  - uma tela de Laços para rever os eventos.
- **Fim da campanha**: epílogo com o duelista de mais eventos vencidos e uma tela final com o resumo (vitórias,
  derrotas, DP ganho, cartas, chefes). Botões: Rever epílogo, Ver a coleção e Nova campanha.
- **Status**: dia, dias restantes, vitórias, derrotas e DP.
- **Economia do nativo**:
  - começo: 0 DP, o deck inicial de 40 cartas do nativo como coleção e deck ativo, e 3 pacotes LOB fechados;
  - vitória: 300 DP, com bônus de vida, rapidez e "sem arranhão" (teto de +50%); derrota, empate ou desistência:
    60 DP;
  - uma carta do deck do oponente por vitória, e a carta-assinatura na 10ª vitória contra o mesmo duelista;
  - pacotes LOB (150), MRD (200), MRL (200, do dia 11) e PSV (225, do dia 21);
  - pacotes de personagem (250), liberados com 5 vitórias contra o dono;
  - caixa de 20 com desconto;
  - 4 comuns + 1 slot de raridade (Rara 70%, Super 20%, Ultra 10%).

  A **tela da loja de hoje só se adapta** (lista de pacotes, preços, bloqueios, pacotes ganhos); o visual da loja e do
  editor do nativo fica para a change seguinte.
- **Decks dos oponentes do nativo**: Tristan, Tea, Joey, Bakura e Yugi com os decks do `campaign.json`, no lugar dos
  decks aleatórios. As 26 cartas desses decks que faltam no pool da PWA (ex.: Dark Magician, Sengenjin, Cyber
  Commander), e as que faltam nos pacotes, entram no pool.
- **Música por tela**: as 8 faixas do nativo (título, mapa, encontro, loja, duelo, duelo de chefe, vitória, derrota),
  fora do git como os sons. Nos ajustes, a música ganha interruptor e volume próprios.

## Capabilities

### New Capabilities
- `campanha`: calendário e períodos, mapa e quem aparece, encontro e falas, conversa, duelos da campanha (decks dos
  oponentes, resultado), chefe, status, fim e epílogo, e o save da campanha.
- `lacos`: afinidade e corações, eventos de laço com duelo obrigatório, escolha amizade/romance, carta do laço e tela
  de Laços.
- `economia-dp`: DP inicial e por duelo (com bônus), carta por vitória e carta-assinatura, coleção inicial, catálogo
  de pacotes com preços e liberação por dia ou vitórias, conteúdo do pacote e a loja adaptada.
- `musica`: faixa por tela, troca entre telas, interruptor e volume nos ajustes, liberação do áudio no iOS.

### Modified Capabilities
- `tela-de-titulo`: o botão principal vira **Campanha** ("Continuar · Dia X · Período" + DP) e leva ao mapa da
  campanha; os ajustes ganham música (interruptor e volume).
- `duel-animacoes`: o fim do duelo mostra o DP com os bônus e a carta ganha (selo NOVA), e a vitória contra o
  chefe ou o duelo de evento muda a fala seguinte.

## Impact

- **Sai**: `src/story/world.ts`, `content.ts`, as cenas e corações atuais, `HubScreen`, o fluxo de cena do `App.tsx`
  e a economia de `src/game/economy.ts` e `packs.ts` (substituídas).
- **Novo**: `src/campaign/` (modelo puro: calendário, sorteio com semente, encontro, laços, recompensas, pacotes), as
  telas do mapa, encontro, laços, status e fim, e `src/audio/music.ts`.
- **Muda**:
  - `src/story/progress.ts`: o save novo, com nova versão do Dexie e recomeço do progresso, mantendo o perfil;
  - `StoryScreen` reaproveitado para as falas;
  - `ShopScreen` adaptada;
  - `App.tsx`, `TitleScreen` e ajustes.
- **Dados**: cópia do `campaign.json`, `dialogue.json` e `packs.json` do nativo (só metadados e texto próprio do nativo,
  versionáveis). O pool ganha as cartas que faltam (`fetch_pool.py` + `export_data.py`, arte e texto em PT).
- **Fora do git (Konami)**: panorama do mapa, fundos dos lugares e as 8 músicas, copiados do app nativo por um script
  (como `copy_sounds.py`).
- **Testes**:
  - unidade do modelo da campanha (calendário, sorteio, afinidade, eventos, recompensas, pacotes);
  - `proto/story-smoke.ts` e `proto/economy-smoke.ts` refeitos;
  - `proto/monkey.ts` com os decks dos oponentes;
  - os e2e (`webkit-e2e`, `duel-e2e`) ajustados ao fluxo novo.
