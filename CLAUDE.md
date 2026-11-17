# CLAUDE.md

Jogo pessoal de Yu-Gi-Oh! (era Duel Monsters) para ~4 amigos: visual novel com mapa/hub + duelos com regras e cartas
oficiais. PWA único (Vite + React + TypeScript) para iOS e Android, sem loja e sem backend. Tudo em **português (pt-BR)**:
interface, textos, comentários e conversa com o usuário.

## Comandos

```bash
npm run dev                         # dev server (porta 5173; use --port 5180 se o labeler estiver aberto)
npx tsc --noEmit                    # tipos (rode antes de commitar)
npm test                            # testes de unidade (Vitest; arquivos src/**/*.test.ts(x))
npx vite build                      # build de produção (PWA)
npx vite preview --port 5181 --host 127.0.0.1   # serve o dist/ (é o que o túnel do celular aponta)

npx vite build && npx wrangler pages deploy dist --project-name dueldays --branch main   # produção: https://dueldays.pages.dev (Cloudflare Pages + Access)
npx tsx proto/smoke.ts 500          # CPU x CPU com decks aleatórios do pool: travas, laços, erros de Lua
npx tsx proto/monkey.ts 100         # mesmo código do Worker (DuelDriver) com os decks da campanha (5 duelistas + inicial)
npx tsx proto/story-smoke.ts        # 200 campanhas de 30 dias pelo modelo: cenas, eventos, rotas, chefe e epílogo
npx tsx proto/economy-smoke.ts      # pacotes da campanha (70/20/10 no slot) e decks válidos (inicial e oponentes)
npx tsx proto/sort-check.ts         # ordenar o topo do Deck (SORT_CARD) contra o motor real
node proto/webkit-e2e.mjs [url] [normal|rápida|desligada] [--reduzir] [--turno]   # fluxo no WebKit (Playwright) contra o preview
node proto/duel-e2e.mjs [url] [--reduzir]   # duelo inteiro no WebKit, na velocidade normal: mede se fica preso numa encenação
npx tsx proto/move-reason.ts        # confere o `reason` do MSG_MOVE (patch do ocgcore-wasm)
```

Pipeline de dados (gera arquivos NÃO versionados; veja README): `npm run fetch-data`, `python3 scripts/import_dm.py` (era DM:
data OCG até 2004-09-30, caixas TCG, português; correções em `raw/overrides/text.pt.json`),
`python3 scripts/export_data.py` (+ relatório `raw/import/report.md`), `.venv/bin/python scripts/fetch_card_art.py` (small/large/cropped + verso), `.venv/bin/python scripts/copy_card_icons.py` (ícones de atributo/tipo do app nativo e propriedades do `cardicons.png` do Tag Force 3 no PPSSPP → `public/card-icons/`), `python3 scripts/copy_sounds.py` (efeitos do duelo do app nativo, do Tag Force, convertidos com `afconvert` → `public/sounds/*.m4a`; macOS), `python3 scripts/copy_brand.py` (logo "Yu-Gi-Oh!" do título → `public/brand/`, fora do git),
`python3 scripts/copy_campaign_data.py` (Tier 1 do nativo + `tiers.json` + `decks.json` + `dialogue-tier2.json` →
`src/campaign/data/`, versionados; troca arte alternativa pelo id original), decks dos duelistas (`python3 scripts/fetch_deck_recipes.py`
→ `npx tsx proto/deck-pick.ts 40` → `python3 scripts/build_decks.py`: receitas "Anime Decks" do YGOPRODeck escolhidas por torneio
CPU × CPU), `.venv/bin/python scripts/copy_tfs_backgrounds.py` (fundos das cenas do zip "Events" do Tag Force Special, baixado à mão
em `raw/tfs/events.zip` → `public/campaign/bg-*.jpg`, fora do git), `python3 scripts/copy_campaign_assets.py` (mapa, fundos dos lugares, capas dos pacotes e as 8
músicas do nativo → `public/campaign/` e `public/music/`, fora do git), `.venv/bin/python scripts/extract_action_icons.py` (recorta o `actions.png` do Tag Force; o ícone de cada ação se escolhe em `npm run icon-labeler`, porta 5174, e fica em `assets/action-icons/labels.json`), `npm run build-characters`, `.venv/bin/python scripts/build_sprites.py`.
Ícones do PWA (ankh em HUD azul; arte própria, os binários são versionados): edite `assets/app-icon/*.svg` e rode `node scripts/build_app_icons.mjs`
(Playwright; se faltar o Chromium da revisão certa, `CHROMIUM_PATH=<chrome-headless-shell>`) → `public/icons/*` e `public/favicon.ico`.
Fundo de colmeia com circuito (arte própria, versionada): `node scripts/build_circuit.mjs` → `src/ui/circuit.svg`, usado
pelo `.hexbg` do `styles.css`.

## Arquitetura

- `src/engine/`: ocgcore (EDOPro) em WASM, **build síncrono** (`ocgcore-wasm`, sem JSPI).
  - `session.ts` cria o duelo (modo `MR1`), carrega `constant.lua` e `utility.lua` e **embaralha o deck por conta própria**
    (o core não embaralha; a compra sairia na ordem inversa da lista).
  - `driver.ts` (`DuelDriver`): avança o motor, responde pela CPU (jogador 1) e pelos prompts automáticos, tem orçamento
    de passos/tempo e devolve `prompt`/`end`/`error` com os **`steps`**: os beats (acontecimentos visíveis) desde a última
    mensagem, em ordem. O retrato do tabuleiro vai só no **último beat de cada passo do motor** (a consulta só vê o fim do
    passo); o primeiro beat depois de cada jogada da CPU leva `think`. É o mesmo código no Worker e nos testes em Node.
  - `beats.ts` (puro): `toBeats` (mensagem → beat; `MOVE` + `SUMMONING`/`SET` viram um beat só; movimentos seguidos tocam
    juntos), `classifyMove` (pelo `reason` do `MSG_MOVE`), `beatText` (o **único** texto do narrador e do histórico) e
    `locKey` (a chave de lugar `p:zone:seq`, também o `data-loc` da tela).
  - `host.ts` trata as mensagens; `worker.ts` é só o invólucro; `inline.ts` roda o motor na thread principal (`?engine=inline`).
  - `cpu.ts`: CPU aleatória com preferências; só responde o que o motor oferece (ex.: `to_ep` pode ser falso).
  - `narrator.ts`: orquestra o `beats.ts`, mantém LP/turno/fase e tira a "foto" do tabuleiro para a UI.
- `src/screens/duel/`: a tela de duelo, dividida por responsabilidade.
  - `DuelScreen.tsx` compõe; `useDuelEngine.ts` (Worker/inline, mensagens, watchdog, reinício).
  - `prompt.ts` (puro: ações por carta, destaques, botões de fase, chips) com fixtures reais em `__fixtures__/`
    (`npx tsx proto/capture-fixtures.ts` regrava).
  - `Field`, `Hand`, `Slot`, `Plate` (+ `lp.ts`: contagem e cor do LP), `PhaseBar` (chips + narrador), `DuelMenu`
    (Desistir), `PromptPanel`, `choice.ts` + `ChoicePanels` (escolha de cartas: no tabuleiro quando tudo está no campo/mão,
    senão em fileira; conferência em dev com `?choices`), `SortCards`.
  - Zonas de campo (szone 5) nas pontas da faixa central (`.midrow`), a barra de fases entre elas; `fieldArt.ts`
    (`fieldBackdrop`) escolhe a Magia de Campo cuja arte recortada cobre o `.field` a 50% (`.fieldart`).
  - `duel.css`: **métricas do BoardMetrics nativo como tokens** no topo (`.duel` é contêiner; `cqw`/`cqh`). Mude
    medidas ali, não com números soltos; `node proto/layout-e2e.mjs` confere a spec `duel-hud` em 4 viewports.
  - `anim/`: a encenação (change `animar-duelo`). `pacing.ts` é a **única fonte dos tempos** (`PACING`, teto de 1,5 s por
    trava); `effects.ts` (`effectFor`: efeito, durações, trava e som de cada beat, e a regra de "reduzir movimento");
    `queue.ts` (`runSteps`, pura, testada com relógio falso); `useBeatQueue.ts` (liga a fila à tela: `staging` trava a mão,
    toque acelera, destaque, pilha da corrente e moeda); `play.ts` (o único que conhece o DOM e a Web Animations: voo dos
    fantasmas entre os `data-loc` medidos, pilar, giros, ataque, quebra); `Splash`, `ChainStack`, `Toss`, `Intro`, `Outro`.
  - Lugares na tela: zonas, mãos, deck, cemitério e placa têm `data-loc` = `locKey`. Sem lugar visível (banidas, Extra,
    fora do jogo), a animação sai da placa do dono.
- `src/audio/sfx.ts`: efeitos com Web Audio (buffers decodificados uma vez, anti-repetição de 60 ms, `settings.sound`), os do
  duelo e os da interface (`tap`, `back`, `dialogue`, `purchase`). `buttonSounds.ts`: **todo botão fora do `.duel` toca o
  som de toque** por um ouvinte só no documento (voltar/fechar/cancelar e `.danger` tocam o `back`; `data-sound` troca ou
  cala); não chame `sfx.play('tap')` nas telas.
  `src/audio/music.ts`: uma faixa em laço por tela (`<audio>` com fade cruzado de 1 s, a que sai volta ao começo, o laço
  desce e sobe pelo `loopEnvelope`; no iOS, volume por um `GainNode` do contexto dos
  efeitos; pausa em segundo plano; silêncio sem o arquivo). A faixa sai do `trackFor(screen)` do `App.tsx`; vitória/derrota,
  do `DuelScreen`.
- `src/ui/` (change `visual-base`): o visual compartilhado. `icons.tsx` (`GameIcon`: **um conceito, um ícone**, a tabela
  do `GAME_ICONS` do nativo, Phosphor `fill` + a lápide do MDI; `big` dá o degradê branco → ciano), `Dp.tsx` (o único jeito
  de mostrar dinheiro: ícone de moedas + número + "DP"), `titles.tsx` (`DisplayTitle` para
  DUELO!/VITÓRIA!/DERROTA/EMPATE e o `Wordmark` metálico), `coin.tsx` (`Coin` e `Die` desenhados), `Choice.tsx`
  (`SettingsChoices`, os mesmos ajustes no título e no duelo), `TopBar.tsx` (a `GameTopBar` do nativo: título na fonte
  do jogo com brilho ciano e subtítulo), `BondHearts.tsx` (corações do laço do nativo, enchidos pela fração), `.hud-btn.secondary`. Fontes: `--font-game` (Chakra Petch, classe
  `.num` para números e `.game-title`/`.sheet h4` para títulos) e `--font-display` (serifada preta itálica).
- Entrada do app (`App.tsx`): sem save → `Welcome` (nome, avatar entre os 14 duelistas genéricos, tratamento); com save →
  `TitleScreen` (Campanha/Continuar com dia, período e DP; Meu deck; perfil e ajustes). O `App` guarda a tela atual
  (`Screen`): mapa, encontro, duelo, loja, deck, laços, status, cena avulsa (rever evento, epílogo), fim e "duelo
  interrompido". O jogador é sempre o avatar do perfil (`src/story/profile.ts`: `profileOf`, `PLAYER_AVATARS`,
  `playerStats`, `say`), nunca o Yugi.
- `src/campaign/` (changes `campanha-dm` e `campanha-tiers`): a campanha Duel Monsters por tiers, **modelo puro** (funções
  que recebem um `CampaignState` e devolvem outro, testadas):
  - `data/` (`campaign.json`, `dialogue.json`, `packs.json` gerados pelo `copy_campaign_data.py`; escritos à mão:
    `tiers.json` (Tier 2+, cenas, pontos do mapa, dias das coleções) e `dialogue-tier2.json`; `decks.json` gerado; `types.ts`
    com `TIERS`, `DUELISTS`, `duelistByKey`);
  - `tiers.ts` (tier atual derivado do dia e dos chefes: o próximo abre pelo chefe vencido ou pelo primeiro dia da janela,
    só se tiver duelistas; `bossDefeatedOn` opcional no save);
  - `state.ts` (o save), `rng.ts` (**todo sorteio sai da semente**: `generator(PURPOSE.x, seed, dia, …)`), `balance.ts`;
  - `calendar.ts` (30 dias × manhã/tarde/noite; **só o duelo gasta período**), `map.ts` (2 a 4 do tier atual + 1 a 2 amigos
    do T1 a partir do T2, chefes liberados, pontos do panorama sorteados), `encounter.ts` (qual fala toca), `bond.ts` (afinidade com teto/piso, conversa, eventos, rota, epílogo),
    `rewards.ts` (`applyDuel`: DP com bônus, carta, assinatura, chefe, laço e o período), `packs.ts` (loja e sorteio 4+1),
    `flow.ts` (conhecer, `pendingDuel`), `text.ts` (`{nome}` e `{m|f|n}`), `debug.ts` (`?campaign=last-evening|bond|boss|tier2|pegasus`
    em dev ou com `?debug=1`).
- `src/screens/campaign/`: `MapScreen` (só as cabeças nos pontos, como no Tag Force Special; + `CampaignHeader`, `Hearts`),
  `EncounterScreen` (cena do duelista: fundo e lugar; sem corações nem Conversar para quem não tem laço), `Dialogue` (o palco do
  nativo: `TopBar` com lugar e subtítulo, placa de corações, fundo desfocado com o filtro do período e o circuito,
  personagem a 60% da altura abaixo da barra, folha de baixo com placa do nome e brilho na cor de quem fala, "Pular"), `BondsScreen`, `StatusScreen`, `CampaignEnd`, `chars.ts`
  (chave do nativo → sprite; expressões), `assets.ts` (arte com degradê de reserva), `campaign.css`.
- `src/screens/`: `DeckBuilder` e `ShopScreen` (sobre o `CampaignState`), `title/`, `profile/`. `src/components/`:
  `CardSheet.tsx` (folha da carta + `Backdrop`) e `CardFace.tsx` (face própria da carta em PT, medidas da carta de
  referência de 320 em `cardface.css`; conferência em dev com `?cardfaces`).
- `src/story/`: `progress.ts` (save em IndexedDB via Dexie: perfil, estatísticas, `settings` de animação/som/música, lidas
  sempre com `withDefaults`, e a `campaign`; `migrate` lê o save da história antiga mantendo o perfil) e `profile.ts`.
- `src/game/decks.ts`: regras do deck (40–60, Extra ≤15, ≤3 cópias, limitadas a 1, limitado à coleção) e `randomDeck`
  (só nos protótipos).
- `src/data/`: carregador de cartas (sobrepõe o texto em português) e rótulos (atributo, raça, tipo, moldura, `formatStat`).
- Estilo: `src/styles.css` (HUD azul: `.hud`, `.hud-btn`, chanfro com `clip-path` + camadas `--cut-tl/--cut-br` que
  desenham a borda diagonal; `--fill` troca o fundo de um `.hud`).

## Armadilhas conhecidas (não regrida)

- **Worker em arquivo único** (`vite.config.ts` → `worker.rollupOptions.output.inlineDynamicImports`). Com code-splitting,
  o chunk do WASM importava a entrada do Worker e o Safari do iOS reexecutava o módulo, perdendo o duelo após o primeiro
  pedido. O estado do duelo fica em `globalThis.__duel`.
- **Áudio no iOS**: o `AudioContext` só é liberado num gesto do usuário. O `installUnlock()` roda no `main.tsx` (qualquer
  toque no app, já na história); antes disso `sfx.play` não faz nada. O Web Audio segue a chave de silencioso do iPhone.
- **Os sons e a arte são da Konami**: `public/sounds/` (Tag Force) e `public/brand/` (logo), via app nativo, ficam fora do
  git, como `public/cards/`. O título esconde o logo se o arquivo faltar.
- **Nada de caractere fazendo papel de ícone** (◎, ☰, ⋯, ▼, ♥): use o `GameIcon`. Dinheiro é sempre `Dp`; um teste procura
  "moedas" nas telas.
- **Classe `.field` é o campo do duelo** (`duel.css`): os campos do perfil usam `.pfield`.
- **`filter` numa face 3D quebra o `backface-visibility`** (a moeda mostrava a coroa pela frente): sombra no contêiner.
- **Tempos da encenação só no `PACING`**: as keyframes de CSS não têm duração; quem dispara é a Web Animations com valores
  do `PACING`. A camada dos fantasmas é um portal no `body` (o `.duel` é contêiner e mudaria a referência do `fixed`).
- **iOS só entrega toques confiáveis a `<button>`**: fundos que fecham usam `Backdrop`, a cena usa `.tapzone`. Não use
  `onClick` em `div` para ações importantes.
- O PWA se atualiza sozinho (`registerSW({ immediate: true })`); a arte das cartas (~70 MB) fica fora da pré-carga
  (cache em tempo de execução).
- **ATK/DEF "?"** é −2 no motor, mas a consulta devolve sem sinal (4294967294): o narrador converte (`signed`) e a UI
  formata só com `formatStat`.
- **Unidades de contêiner não valem no próprio contêiner**: em `.cardface`, `--u` só pode ser usado pelos filhos.
- O WebKit headless (Playwright) desenha o campo inclinado torto; confira a perspectiva no simulador de iOS.
- Fichas (tokens) precisam estar em `cards.json` (o export inclui), senão cartas como Scapegoat dão erro de Lua.
- Subtipo de Magia/Armadilha só via `typeLine` (nomes do Manual Oficial: Equipamento, Campo, Rápida, Ritual, Contínua, Resposta);
  use as constantes `OcgType`, nunca máscaras soltas (os bits já estiveram trocados).
- A face da carta usa `ui-serif` (New York no iOS, igual ao nativo); fora do Safari cai para Georgia.
- **`ocgcore-wasm` tem um patch** (`patches/`, aplicado no `postinstall` pelo patch-package): a resposta de SORT_CARD
  levava um byte de tamanho antes da ordem e o motor a recusava (Classificar Livro de Magia não fazia nada); e o
  `MSG_MOVE` passa a trazer o `reason` (o pacote o descartava). Atualizou o pacote? Refaça o patch e rode
  `proto/sort-check.ts` e `proto/move-reason.ts`.
- Botões da tela de duelo que também são `.hud-btn` precisam de seletor com as duas classes: o `styles.css` carrega
  depois do `duel.css` e o padding do `.hud-btn` ganharia.
- Cartas que o motor não aguenta vão em `raw/pool/blocklist.json` (rode `export_data.py` depois).
- **Cartas da campanha usam o id original**, não o da arte alternativa (sem script no ocgcore): o `copy_campaign_data.py`
  troca pelo `alias`, e o `import_dm.py` acrescenta ao pool os ids da campanha que faltam (o `export_data.py` também troca
  ids de arte alternativa pelo original). Os pacotes LOB/MRD/MRL/PSV do `packs.json` vêm do `public/data/boosters.json`.
- **A arte e a música da campanha são da Konami** (`public/campaign/`, `public/music/`, fora do git e da pré-carga do PWA;
  a música usa cache com `rangeRequests`). Sem os arquivos, fundos em degradê e silêncio.
- **Decks dos duelistas são gerados** (`decks.json`, pelo `build_decks.py`): troca de carta vai no `REPLACE` do script, não
  à mão no JSON. O endpoint de decks do YGOPRODeck não é documentado: só o `fetch_deck_recipes.py` o usa, o jogo nunca.
- **Mapa sem lugares**: os duelistas não têm `location`; a cena do encontro é o `scene` de cada um (`bg-<bg>.jpg`) e as
  cabeças vão nos `mapPoints` do `tiers.json` (pontos no meio do panorama, onde a tela abre).
- **`overflow: clip` na cena** (`.story.campaign-scene`): com `hidden`, o foco num botão rolava o contêiner para o lado.
- Os seletores da campanha que disputam com o `styles.css` (carrega depois) precisam de duas classes (ex.: `.pack.shoppack`).

## Diagnóstico

- `?debug=1` mostra no duelo um painel com as etapas do Worker e manda os logs para o servidor (dev/preview), que grava em
  `/tmp/duel-days-device.log`. Serve para depurar o iPhone físico pelo túnel.
- Simulador de iOS (Safari real) reproduz bugs de WebKit que o Chrome e o Playwright não pegam.

## Regras do projeto

- **Nunca versione material da Konami**: `raw/`, `assets/characters/*/`, `public/{cards,characters,data}`,
  `public/scripts.json` estão no `.gitignore`. Só metadados leves (manifest, labels, characters.json) entram no git.
- Hospedagem só com acesso protegido (ex.: Cloudflare Access); repositório privado. Produção: Cloudflare Pages `dueldays` (conta
  00claudio; perfil `cf` `claudio` ligado a esta pasta), com Access liberando só os e-mails da política "Amigos" (código por e-mail).
  O envio é direto do `dist/` local, porque a arte das cartas não vai ao Git. O manifest usa `useCredentials` por causa do Access. O túnel `cloudflared` é temporário.
- Personagens: só Duel Monsters (e variações como DSoD); sprites do Duel Links, variante `chara007`, rosto 240×240
  sobreposto ao corpo em (260, 120).
- Antes de mudanças grandes ou ambíguas, pergunte. Teste no navegador (viewport de celular) e, para iOS, no simulador.
