# Design

## Context

Veja `proposal.md` (Why). O ponto de partida na PWA:

- **História**:
  - `src/story/` tem um motor de VN puro (`runner.ts`, nós `say`/`choice`/`duel`/`goto`), o mundo fixo (`world.ts`) e
    os textos (`content.ts`);
  - o `App.tsx` decide entre mapa (`HubScreen`), cena (`StoryScreen`) e duelo;
  - o save (`progress.ts`, Dexie) guarda perfil, `coins`, coleção, decks, `run` (cena em andamento), `hearts`,
    `wins`/`losses` e `settings`.
- **Duelo**:
  - `DuelScreen` recebe dois decks e devolve `onEnd(won: boolean)`;
  - o `Outro` calcula o DP sozinho (`WIN_COINS`/`LOSS_COINS`).
- **Pool**: `raw/pool/pool.json` (~1.700 cartas das caixas 2002–2005) gera `public/data/cards.json`. Dos pacotes e
  decks do nativo, faltam 26 cartas de deck (ex.: Dark Magician 46986414, Sengenjin, Cyber Commander) e algumas de
  pacotes (2 do LOB, 1 do MRL, 1 do PSV e 3 a 13 em cada pacote de personagem).
- **Personagens**: os sprites do Duel Links da PWA já têm `tristan_taylor`, `tea_gardner`, `joey_wheeler`, `bakura`,
  `yugi_muto` e `solomon_muto`. As expressões variam um pouco das do nativo.
- **Nativo**:
  - `Sources/DuelCampaign/` tem o modelo e os dados: `campaign.json`, `dialogue.json` e `packs.json`;
  - `App/DuelAcademy/GameArt/` tem o mapa e os fundos (do *Tag Force*);
  - `App/DuelAcademy/Sounds/music-*.m4a` tem a trilha.

## Goals / Non-Goals

**Goals:**
- Um modelo de campanha **puro e testável** em TypeScript, espelhando as regras do nativo (calendário, sorteio, laços,
  recompensas, pacotes), sem React nem Dexie.
- Reaproveitar o que a PWA já tem: o leitor de falas (`StoryScreen`), o duelo, o editor de deck, a loja (adaptada), o
  `GameIcon`/`Dp`/`.hud`.
- O mesmo estado dá o mesmo resultado (semente), para os testes e para reabrir o app.

**Non-Goals:**
- Visual da loja e do editor do nativo: balconista, detalhes do pacote, rasgar o pacote, maleta (change seguinte).
- Séries GX, tiers 2+, duelo rápido, histórico, conquistas.
- Reproduzir bit a bit os sorteios do nativo: a semente é do jeito da PWA.
- CPU mais esperta: os oponentes usam a CPU de hoje, só com os decks novos.

## Decisions

### 1. Dados do nativo copiados para o repositório, como estão
`campaign.json`, `dialogue.json` e `packs.json` (só o Tier 1 e os pacotes usados) vão para `src/campaign/data/` por um
script (`scripts/copy_campaign_data.py`), que filtra o que é da GX. São texto próprio do nativo e ids de cartas, e por
isso versionáveis. Tipos TS espelham o esquema.

- *Por quê:* importar o JSON direto mantém as 384 falas idênticas e permite refazer a cópia quando o nativo mudar.
- *Alternativa:* converter para o `content.ts` atual. Seria trabalho manual sujeito a erro, e o formato do nativo já é
  o certo (cenas com `speaker`/`expression`/`text`).

### 2. Modelo em `src/campaign/` (funções puras sobre um `CampaignState`)
- **Arquivos**:
  - `state.ts`: o estado, espelhando os campos do nativo que valem para a DM:
    - `seed`, `day`, `period`, `dp`;
    - `collection`, `activeDeck`;
    - `victories`, `defeatedBosses`, `unopenedPacks`, `packsOpened`;
    - `wins`, `losses`, `totalDPEarned`, `concluded`;
    - `affinity`, `bondEventsDone`, `bondRoutes`, `lastConversationDay`, `lastBondEventLossDay`, `metDuelists`.
  - `rng.ts`: semente e mistura. Um hash de 32 bits (`mix(seed, ...partes)` com murmur/splitmix) e um gerador
    `mulberry32` por sorteio, para não depender de BigInt.
  - `calendar.ts`: avançar o período e o fim.
  - `map.ts`: quem aparece (2 a 4 por período) e quando o chefe aparece.
  - `encounter.ts`: qual saudação, qual fala antes e depois, qual tema ruim.
  - `bond.ts`: `addAffinity` com teto e piso, evento aberto, rota, epílogo.
  - `rewards.ts`: DP com bônus, carta da vitória, assinatura, prêmio do chefe.
  - `packs.ts`: catálogo, preço, liberação, caixa e o conteúdo do pacote.
  - `text.ts`: `{nome}` e `{m|f|n}`.
- **Duelo**: `applyDuel(state, {duelist, kind, result, lpLeft, turn})` devolve `{state, reward, after}`, onde `after` é
  a cena de depois, calculada antes de aplicar, como no nativo.

- *Por quê:* as regras são muitas e cheias de ordem ("o que vale primeiro"); funções puras testadas uma a uma são o
  jeito barato de garantir que batem com o nativo.
- *Alternativa:* manter o `runner.ts` com nós `duel`. O fluxo da campanha não é um roteiro linear, é estado mais regras.

### 3. Telas e fluxo
- **Telas**:
  - `src/screens/campaign/`: `MapScreen` (panorama que rola, pinos por lugar, painel, cabeçalho), `EncounterScreen`
    (saudação → menu → conversa ou duelo ou evento), `BondsScreen`, `StatusScreen` e `CampaignEnd`;
  - o leitor de falas sai do `StoryScreen`, generalizado para receber uma lista de falas com `speaker` (duelista ou
    jogador) e um fundo.
- **App**: o `App.tsx` passa a ter as views `campaign` (mapa), `encounter`, `duel`, `shop`, `decks`, `bonds`, `status` e
  `end`. O que é "onde estou" volta a ser derivado do `CampaignState` mais um estado de tela efêmero. O único
  persistido é `pendingDuel` (duelista e tipo), que faz o "Duelo interrompido" funcionar sem gastar período.
- **Duelo**:
  - `DuelScreen` passa a devolver `onEnd({result: 'win'|'lose'|'draw', surrendered, lpLeft, turn})`;
  - o `Outro` recebe um `reward` calculado pelo App (DP com bônus, cartas, laço), via uma prop `rewardFor(summary)`
    chamada quando o duelo acaba, para mostrar o encerramento sem esperar o toque.

### 4. Save: nova versão do Dexie, recomeço da campanha
O `Progress` ganha `campaign: CampaignState | null` e perde `run`, `hearts`, `seen`, `coins`, `collection` e `decks` da
história antiga: a coleção e os decks passam a ser da campanha. O perfil, as estatísticas e os `settings` continuam.
Um save antigo carrega com `campaign: null`, e o título oferece "Campanha".

- *Alternativa:* migrar a coleção antiga para a campanha. O usuário aceitou recomeçar, e a economia nova pressupõe o
  deck inicial do nativo.

### 5. Cartas que faltam no pool
O `fetch_pool.py` ganha uma lista de ids extras lida do `campaign.json`/`packs.json` copiados. O export, a arte, o texto
em PT e o `proto/smoke.ts` rodam sobre eles. Uma carta que o motor não aguentar vai para a `blocklist.json`; o
`copy_campaign_data.py` avisa e a troca por uma equivalente da época, anotada no `design` dos dados.

### 6. Arte e música da Konami fora do git
`scripts/copy_campaign_assets.py` copia do nativo:
- o mapa (manhã, tarde e noite);
- os fundos dos 5 lugares e o `domino-night`;
- as capas dos pacotes LOB, MRD, MRL e PSV;
- as 8 músicas.

Eles vão para `public/campaign/` e `public/music/`, que entram no `.gitignore`. As telas caem para um degradê, e a
música para o silêncio, quando o arquivo falta. Vale a mesma regra do logo.

### 7. Expressões
Um mapa fixo traduz as expressões do nativo para as da PWA: `happy` → `happy` ou `laugh`, `blushing` →
`embarrassed`, e as outras com o mesmo nome. Uma expressão sem par cai para `neutral`.

### 8. Música com `HTMLAudioElement` e fade por volume
`src/audio/music.ts` usa um elemento `<audio loop>` por faixa, com fade por `requestAnimationFrame` no `volume`. O som
continua no Web Audio. As telas declaram a faixa por um `useMusic(track)` e uma faixa igual não reinicia. O som é
liberado no mesmo `installUnlock()` dos efeitos, e a música pausa no `visibilitychange`.

- *Por quê:* faixas longas no Web Audio exigiriam decodificar megabytes na memória. O `<audio>` faz streaming e
  respeita o cache do service worker.
- *Risco:* no iOS, o `volume` do `<audio>` é só leitura. Nesse caso, o volume e o fade usam um `GainNode` via
  `MediaElementAudioSourceNode` (ver Riscos).

## Risks / Trade-offs

- **iOS ignora `audio.volume`** → ligar o `<audio>` ao `AudioContext` dos efeitos por `createMediaElementSource` e
  fazer o volume e o fade num `GainNode`; testar no simulador e no iPhone 11 Pro.
- **Cartas novas que o motor não aguenta** (Lua faltando, fichas) → rodar `proto/smoke.ts` e `proto/monkey.ts` com os
  decks da campanha antes das telas; blocklist mais troca anotada.
- **Change grande** → tarefas em grupos que já funcionam sozinhos: dados e modelo (testes), mapa e encontro, duelo e
  recompensas, laços, fim, loja, música. Cada grupo é verificado antes do seguinte.
- **Texto do `dialogue.json` com marcação diferente** (`{masculino|feminino|neutro}`) → um teste percorre todas as falas
  e confere que não sobra `{` depois da troca, nos três tratamentos, e que nenhuma passa de 160 caracteres.
- **Precache do PWA com música e mapa** → música e fundos ficam fora do precache, no cache em tempo de execução, como a
  arte das cartas.

## Migration Plan

1. O deploy segue normal (Cloudflare Pages a partir do `dist/` local, com os arquivos da Konami copiados).
2. Ao abrir, um save antigo vira `campaign: null`, sem perder o perfil.
3. Para voltar atrás, fazer o deploy anterior. O save novo não abre na versão antiga (que espera `run`/`coins`), e por
   isso o `loadProgress` antigo cai para "sem save". Esse risco é aceito para um jogo de 4 amigos.
