# YGO Story PWA (nome provisório)

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
raw/                 zips originais baixados (NÃO versionado)
```

## Labeler de expressões

```bash
python3 tools/labeler/server.py
```

Abra <http://127.0.0.1:5173>. Escolha o personagem, clique num rosto e aperte a tecla da expressão
(N neutro, H feliz, A bravo, U surpreso...). Salva sozinho em `assets/characters/labels.json`.
Use "Não é DM (excluir)" para marcar personagens que não pertencem à lista; os marcados `dm?`
na barra lateral são os que não consegui verificar.

Formato do `labels.json`:

```json
{ "arkana": { "faces": { "arkana/faces/chara007_01.png": "neutral" }, "excluded": false, "note": "" } }
```

## Protótipo do motor (ocgcore em WASM)

```bash
npm install
npm run fetch-data          # clona CardScripts e BabelCDB (ProjectIgnis) em raw/data
npm run export-proto-data   # gera public/data/cards.json e public/scripts/*.lua (29 cartas clássicas)
npm run smoke               # duelo CPU x CPU em Node (valida o motor)
npm run dev                 # PWA em http://localhost:5173 (use --port se o labeler estiver aberto)
```

- `src/engine/session.ts`: cria o duelo (modo MR1, regras da era DM). O host precisa carregar `constant.lua` e `utility.lua`.
- `src/engine/worker.ts`: roda o ocgcore (build síncrono, sem JSPI) num Web Worker; a CPU (`cpu.ts`) joga como jogador 1.
- `src/App.tsx`: UI mínima; todos os prompts (`SELECT_*`) viram botões. Zona/posição ainda são automáticas.
- `public/data` e `public/scripts` não são versionados (regeneráveis).

## História (visual novel)

```bash
python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt
npm run build-characters                 # assets/characters/characters.json (a partir dos rótulos)
.venv/bin/python scripts/build_sprites.py  # public/characters/ (WebP + index.json)
npx tsx proto/story-smoke.ts             # percorre todos os caminhos do capítulo
```

- O sprite de corpo vem com o rosto em branco; o rosto 240x240 se sobrepõe sempre em (260, 120) (medido nos 44 personagens).
- `src/story/runner.ts`: motor puro (say, show/hide, choice, set/if/goto/label, duel, end). O estado cabe num save JSON.
- `src/story/chapters/ch1.ts`: capítulo de exemplo (Yugi, Joey e Kaiba). Cada `duel` abre a tela de duelo e volta pelo resultado.
- `src/story/save.ts`: save em IndexedDB (Dexie), gravado a cada passo. Um duelo em andamento recomeça se a página recarregar.

## Arte das cartas

```bash
.venv/bin/python scripts/fetch_card_art.py   # baixa de images.ygoprodeck.com (uso pessoal) e converte para WebP
```

- Para cada carta de `public/data/cards.json`: `public/cards/small/<id>.webp` (268 px, campo e mão) e `public/cards/large/<id>.webp` (540 px, zoom). Originais em `raw/cards/` (não versionados).
- Pausa entre requisições e pula o que já existe. Rode de novo ao ampliar o pool.
- Toque numa carta abre o zoom com o texto do efeito (hoje em inglês, vindo do banco oficial). Cartas baixadas do oponente aparecem com o verso e não abrem.

## Direitos

Sprites do Duel Links e artes de cartas pertencem à Konami. Repositório e site são de uso pessoal;
não publique os assets, não coloque o repo como público com eles e não distribua o app fora do grupo.
