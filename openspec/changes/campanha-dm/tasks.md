# Tasks

## 1. Dados do nativo e cartas no pool

- [x] 1.1 `scripts/copy_campaign_data.py`: copiar `campaign.json` (Tier 1), `dialogue.json` (5 duelistas + vovô) e os
  pacotes usados do `packs.json` (lob, mrd, mrl, psv e os 5 de personagem) para `src/campaign/data/`, com os tipos em
  `src/campaign/data/types.ts`. Verificar: `npx tsc --noEmit` importando os três JSON.
- [x] 1.2 `fetch_pool.py` lê os ids extras dos JSON copiados; rodar `fetch_pool.py`, `export_data.py`,
  `fetch_card_text_pt.py` e `fetch_card_art.py`. Verificar: um teste confirma que todo id de deck, pacote, assinatura
  e carta do laço existe em `cards.json`.
- [x] 1.3 `npx tsx proto/smoke.ts` e um `proto/monkey.ts` com os 5 decks da campanha mais o deck inicial. Carta que
  quebre o motor vai para a `blocklist.json`, com a troca anotada no `copy_campaign_data.py`. Verificar: 300 duelos sem
  erro de Lua nem trava.
- [x] 1.4 `scripts/copy_campaign_assets.py`: copiar do nativo para `public/campaign/` e `public/music/` (no
  `.gitignore`):
  - o mapa (3 períodos);
  - os 5 fundos e o `domino-night`;
  - as capas LOB, MRD, MRL e PSV;
  - as 8 músicas.

  Verificar: os arquivos existem e o `git status` não os mostra.

## 2. Modelo da campanha (puro)

- [x] 2.1 `src/campaign/state.ts` (`CampaignState`, `newCampaign(seed)` com 0 DP, o deck inicial e 3 LOB) e `rng.ts`
  (mistura determinística e gerador). Verificar: testes de reprodutibilidade (mesma entrada, mesmo resultado).
- [x] 2.2 `calendar.ts` (avançar período, virar o dia, fim após a noite do dia 30) e `map.ts` (2 a 4 por período,
  chefe após vencer os 4). Verificar: testes de avanço, de fim e do sorteio estável por dia e período.
- [x] 2.3 `text.ts` (`{nome}`, `{m|f|n}`) e `encounter.ts` (saudação pela rota ou proximidade, fala antes, cena depois
  na ordem do nativo, tema ruim do dia). Verificar: testes de cada ramo, mais um teste que percorre todas as falas nos
  3 tratamentos sem sobrar `{` e com no máximo 160 caracteres.
- [x] 2.4 `bond.ts`: `addAffinity` com teto e piso, conversa (+20/−15/+5, uma por dia), evento aberto (vitória antes
  do 1º, escolha antes do 4º, sumiço até o dia seguinte após derrota), rota e epílogo (desempate). Verificar: testes
  com os cenários dos specs de `lacos`.
- [x] 2.5 `rewards.ts` (300 DP com os 3 bônus e o teto de +50%, 60 DP na derrota, carta por vitória sem limitadas nem
  3 cópias, assinatura na 10ª, prêmio do chefe até o dia 7, carta do laço) e `applyDuel`. Verificar: testes com os
  cenários de `economia-dp`.
- [x] 2.6 `packs.ts`: catálogo, preço, liberação por dia (MRL 11, PSV 21) e por vitórias (personagem 5), caixa de 20
  com desconto e o conteúdo 4+1 com a queda de raridade. Verificar: testes, e o `proto/economy-smoke.ts` refeito
  (distribuição de 10.000 pacotes perto de 70/20/10).

## 3. Save novo

- [x] 3.1 `progress.ts`: versão nova do Dexie com `campaign: CampaignState | null` e `pendingDuel`, mantendo o perfil,
  as estatísticas e os `settings`; o save antigo vira `campaign: null`. Verificar: teste com um save antigo (perfil
  intacto, campanha nula) e um de ida e volta do estado.
- [x] 3.2 Remover a história antiga (`world.ts`, `content.ts`, `runner.ts` se não servir, `HubScreen`, a economia
  antiga) e ajustar o `proto/story-smoke.ts` para percorrer a campanha (todos os duelistas, eventos e rotas por um
  driver de estado). Verificar: `npm test`, `npx tsc --noEmit` e `npx tsx proto/story-smoke.ts`.

## 4. Mapa e encontro

- [x] 4.1 Título: botão **Campanha**/**Continuar** com "Dia X · Período" e DP, começando uma campanha nova quando não
  há. Verificar: teste do `TitleScreen` nos 3 estados (sem campanha, em andamento, terminada).
- [x] 4.2 `MapScreen`:
  - cabeçalho (dia, período, DP, barra dos dias, progresso do tier);
  - panorama que rola na horizontal, com o tom por período;
  - lugares com o número de duelistas, o "!" e o chefe com coroa;
  - painel do lugar e o da loja (Entrar na loja / Encontrar);
  - atalhos (Deck, Coleção, Laços, Loja, Status).

  Verificar: print no simulador de iOS de manhã, de tarde e de noite, ao lado de `docs/nativo/prints/11`, `30`, `47`
  e `56`.
- [x] 4.3 Leitor de falas generalizado (a partir do `StoryScreen`):
  - fundo do lugar no tom do período;
  - duelista de corpo inteiro, com as expressões mapeadas;
  - o avatar do jogador entra quando ele fala, e quem não fala fica escurecido;
  - "Pular".

  Verificar: testes do mapa de expressões e print da cena de primeira vitória (`45`, `46`).
- [x] 4.4 `EncounterScreen`: saudação → menu (evento, Conversar, Duelar, Voltar) → conversa com 4 temas e corações
  animados; Conversar indisponível depois da conversa do dia. Verificar: teste do fluxo com o modelo e prints `15`,
  `16` a `18`.

## 5. Duelo na campanha

- [x] 5.1 `DuelScreen.onEnd` passa a devolver o resumo (resultado, desistência, LP restante, turno), e o `Outro`
  mostra o `reward` (DP base e bônus, cartas com NOVA, laço). Verificar: testes do `IntroOutro` e da extração do
  resumo.
- [x] 5.2 Ligar o duelo:
  - fala antes → duelo com o deck do oponente → resultado → `applyDuel` → fala depois → mapa no período seguinte;
  - `pendingDuel` para o "Duelo interrompido" sem gastar o período;
  - deck inválido leva ao editor.

  Verificar: `node proto/duel-e2e.mjs` e `node proto/webkit-e2e.mjs` adaptados ao fluxo novo (um duelo completo
  avança o período e paga o DP).
- [x] 5.3 Chefe: entrada, derrota, faixa de chefe e prêmio até o dia 7. Verificar: teste do modelo e print `49`.

## 6. Laços e fim

- [x] 6.1 Evento de laço no encontro: cena antes → duelo obrigatório → cena depois; a escolha amizade/romance no 3º (e
  de novo, se o app fechou antes de escolher); a carta do laço no 4º. Verificar: teste do fluxo e print `55`.
- [x] 6.2 `BondsScreen` (corações, rota, eventos vencidos com "Rever") e `StatusScreen`. Verificar: prints `39`, `40`.
- [x] 6.3 Epílogo e `CampaignEnd` (resumo, Rever epílogo, Ver a coleção, Nova campanha com confirmação); campanha
  terminada não aceita duelo. Verificar: teste do modelo e um caminho de DEBUG (`?campaign=last-evening`) para
  conferir no simulador, com os prints `58` e `59`.

## 7. Loja adaptada

- [x] 7.1 `ShopScreen` sobre o catálogo novo:
  - pacotes ganhos para abrir;
  - coleções com preço, bloqueio "Dia N" e "faltam N DP";
  - pacotes de personagem com "N/5";
  - caixa de 20.

  O visual atual se mantém. Verificar: teste do componente com os estados e um fluxo de compra no navegador
  (DP descontado, cartas na coleção com NOVA).
- [x] 7.2 Editor de deck e coleção sobre a coleção da campanha (sem campanha, o "Meu deck" do título explica que o deck
  nasce na campanha). Verificar: teste do `DeckBuilder` e print do estado vazio (`09`).

## 8. Música

- [x] 8.1 `src/audio/music.ts` (`<audio loop>` por faixa ligado a um `GainNode`, fade, mesma faixa não reinicia,
  pausa no `visibilitychange`, silêncio sem arquivo) e `useMusic(track)` nas telas, conforme a tabela do spec.
  Verificar: testes com um relógio falso e um áudio de mentira.
- [ ] 8.2 Ajustes de música (interruptor e volume) no título e no menu do duelo, salvos nos `settings`. Verificar: teste
  do `SettingsChoices` e, no simulador de iOS, a troca mapa → duelo → vitória com fade e o volume obedecendo.

## 9. Integração

- [x] 9.1 Rodar `npx tsc --noEmit`, `npm test`, `npx tsx proto/story-smoke.ts`, `npx tsx proto/economy-smoke.ts`,
  `node proto/webkit-e2e.mjs`, `node proto/duel-e2e.mjs` e `node proto/layout-e2e.mjs`. Verificar: todos passam.
- [x] 9.2 Atualizar o `CLAUDE.md` (campanha, dados do nativo, scripts de cópia, música, save novo) e o
  `docs/HANDOFF.md`. Verificar: as seções refletem o código.

## Workflow follow-up

- Teste no iPhone físico pelo usuário (uma semana de campanha, um evento de laço, a loja), depois arquivar o change.
- Próximo change: a loja e o editor de deck no visual do nativo.
