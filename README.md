# Duel Days

Visual novel + duelos de Yu-Gi-Oh! (era Duel Monsters) como PWA, para uso pessoal entre amigos.

## Decisões até aqui

- **Plataforma:** PWA único (Vite + React + TypeScript), funciona em iOS e Android sem loja.
- **Regras:** engine oficial ocgcore + scripts Lua rodando em WASM num Web Worker. Deve funcionar sem backend, banco local, contra a CPU; PvP via relay depois.
- **Foco:** história com personagens de Duel Monsters (incluindo variações como DSoD).
- **Distribuição:** privada. O site precisa de acesso protegido (ex.: Cloudflare Access), porque os assets são material da Konami.

## Estrutura

```
assets/characters/   sprites (NÃO versionados) + manifest.json e labels.json (versionados)
scripts/filter_dm.py filtra os personagens para só Duel Monsters
tools/labeler/       site local para mapear as expressões de cada personagem
tools/icon-labeler/  site local para escolher o ícone (atlas do Tag Force) de cada ação do duelo
raw/                 zips originais baixados (NÃO versionado)
```

## Labeler de expressões

```bash
python3 tools/labeler/server.py
.venv/bin/python scripts/extract_action_icons.py && npm run icon-labeler   # ícones de ação (porta 5174)
```

Abra <http://127.0.0.1:5173>. Escolha o personagem, clique num rosto e aperte a tecla da expressão
(N neutro, H feliz, A bravo, U surpreso...). Salva sozinho em `assets/characters/labels.json`.
Use "Não é DM (excluir)" para marcar personagens que não pertencem à lista; os marcados `dm?`
na barra lateral são os que não consegui verificar.

Formato do `labels.json`:

```json
{ "arkana": { "faces": { "arkana/faces/chara007_01.png": "neutral" }, "excluded": false, "note": "" } }
```

## Dados do jogo (pool da era Duel Monsters)

```bash
npm install
npm run fetch-data                 # clona CardScripts e BabelCDB (ProjectIgnis) em raw/data
python3 scripts/fetch_pool.py      # 33 caixas de 2002-2005 (YGOPRODeck): quais cartas e a raridade de cada uma
python3 scripts/export_data.py     # public/data/{cards,pool}.json + public/scripts.json (só cartas que o motor roda)
python3 scripts/fetch_card_text_pt.py   # nomes e efeitos em português (o resto cai para inglês)
.venv/bin/python scripts/fetch_card_art.py  # arte (small/large/cropped + verso, WebP); ~95 MB
.venv/bin/python scripts/copy_card_icons.py # ícones de atributo/tipo/Magia/Armadilha do app nativo e propriedades do atlas do Tag Force 3 no PPSSPP (fora do git)
python3 scripts/copy_sounds.py     # efeitos sonoros do duelo do app nativo (Tag Force), convertidos para .m4a em public/sounds (fora do git; macOS)
npx tsx proto/smoke.ts 500         # CPU x CPU com decks aleatórios: mede travas e erros de Lua
npx tsx proto/economy-smoke.ts     # packs e coleção inicial
npm run dev                        # PWA (use --port se o labeler estiver aberto)
```

- `raw/pool/blocklist.json` lista passcodes que o motor não aguenta (hoje: Rivalry of Warlords). Rode `export_data.py` depois de mudar.
- O pool tem ~1.700 cartas (61 de fusão, que vão para o Extra Deck). 11 foram cortadas por não terem efeito implementado no script oficial.
- Teste em massa (800 duelos): 99,4% terminam; o resto são respostas rejeitadas em `SELECT_SUM` e no menu principal.
- `src/engine/`: sessão do duelo (MR1, regras da era DM), Worker com o ocgcore (build síncrono, sem JSPI) e a CPU. Prompts que a UI não trata são respondidos automaticamente.
- `public/data`, `public/scripts.json` e `public/cards` não são versionados (regeneráveis). A arte não entra na pré-carga do PWA: é guardada conforme vista.

## Diagnóstico e iOS

- `?debug=1` na URL mostra, no duelo, um painel com o que o Worker faz (etapas, cada passo do motor) e se ele está vivo.
- O Worker é gerado como **arquivo único** (`worker.rollupOptions.output.inlineDynamicImports`). Com code-splitting, o chunk do
  WASM importava de volta a entrada do Worker e o Safari do iOS reexecutava o módulo, perdendo o duelo depois do primeiro pedido.
- No iOS, toques só chegam de forma confiável a `<button>`: fundos que fecham (`Backdrop`) e a área de avançar o diálogo são botões.
- `proto/monkey.ts` (mesmo código do Worker, decks reais dos personagens) e `proto/webkit-e2e.mjs` (Playwright/WebKit) testam o duelo.
- Depois de publicar uma versão nova, o PWA troca de versão na segunda abertura (service worker).

## Economia, coleção e decks

- Início: 300 moedas e 40 cartas Normais (forma um deck válido). Duelo: vitória +100, derrota +30. Pack: ◎100, 5 cartas, 1 rara garantida (N 61%, R 28%, SR 9%, UR 2%).
- Deck: 40 a 60 cartas no principal, até 15 no Extra, até 3 cópias, limitado pela coleção. Até 5 decks; o duelo usa o deck ativo e é bloqueado se ele for inválido.
- `src/game/{decks,packs,economy}.ts` são puros. `src/screens/{DeckBuilder,ShopScreen}.tsx` são as telas.

## História (visual novel + mapa)

```bash
python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt
npm run build-characters                   # assets/characters/characters.json (a partir dos rótulos)
.venv/bin/python scripts/build_sprites.py  # public/characters/ (WebP + index.json)
npx tsx proto/story-smoke.ts               # percorre todos os caminhos de todas as cenas
```

- O sprite de corpo vem com o rosto em branco; o rosto 240x240 se sobrepõe sempre em (260, 120) (medido nos 44 personagens).
- `src/story/runner.ts`: motor puro (say, show/hide, choice, set/if/goto/label, heart, duel, end). O estado de uma cena cabe num JSON.
- `src/story/world.ts`: locais e cenas. Cada personagem tem cenas na ordem `intro` (única), `bond` (única, exige 4 corações) e `rematch` (repetível). `pickScene` escolhe a primeira elegível.
- `src/story/content.ts`: o texto das cenas (Joey, Bakura, Kaiba). `{nome}` vira o nome do jogador.
- `src/story/progress.ts`: progresso em IndexedDB (Dexie): nome, corações, vitórias, cenas vistas e a cena em andamento. Corações vêm de nós `heart` e valem ao terminar a cena.
- Um duelo em andamento recomeça se a página recarregar.

## Arte das cartas

```bash
.venv/bin/python scripts/fetch_card_art.py           # todas as variantes; baixa de images.ygoprodeck.com (uso pessoal) e converte para WebP
.venv/bin/python scripts/fetch_card_art.py cropped   # só uma variante
```

- Para cada carta de `public/data/pool.json`:
  - `public/cards/small/<id>.webp` (200 px, deck builder, loja e fallback);
  - `public/cards/large/<id>.webp` (380 px, folha da carta);
  - `public/cards/cropped/<id>.webp` (256 px, só a ilustração, usada pela face própria da carta no duelo).
- O verso fica em `public/cards/back.webp`. Originais em `raw/cards/` (não versionados).
- Sem Pillow? `python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt`.
- Pausa entre requisições e pula o que já existe. Rode de novo ao ampliar o pool.
- Toque numa carta abre o zoom com o texto do efeito (hoje em inglês, vindo do banco oficial). Cartas baixadas do oponente aparecem com o verso e não abrem.

## Direitos

Sprites do Duel Links, artes de cartas e os efeitos sonoros do duelo (do *Yu-Gi-Oh! ARC-V Tag Force Special*, extraídos pelo
app nativo `duel-academy`) pertencem à Konami. Repositório e site são de uso pessoal;
não publique os assets, não coloque o repo como público com eles e não distribua o app fora do grupo.
