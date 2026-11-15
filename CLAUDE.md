# CLAUDE.md

Jogo pessoal de Yu-Gi-Oh! (era Duel Monsters) para ~4 amigos: visual novel com mapa/hub + duelos com regras e cartas
oficiais. PWA único (Vite + React + TypeScript) para iOS e Android, sem loja e sem backend. Tudo em **português (pt-BR)**:
interface, textos, comentários e conversa com o usuário.

## Comandos

```bash
npm run dev                         # dev server (porta 5173; use --port 5180 se o labeler estiver aberto)
npx tsc --noEmit                    # tipos (rode antes de commitar)
npx vite build                      # build de produção (PWA)
npx vite preview --port 5181 --host 127.0.0.1   # serve o dist/ (é o que o túnel do celular aponta)

npx tsx proto/smoke.ts 500          # CPU x CPU com decks aleatórios do pool: travas, laços, erros de Lua
npx tsx proto/monkey.ts 100         # mesmo código do Worker (DuelDriver) contra os decks reais dos personagens
npx tsx proto/story-smoke.ts        # percorre todos os caminhos de todas as cenas
npx tsx proto/economy-smoke.ts      # packs (distribuição/garantia) e coleção inicial
node proto/webkit-e2e.mjs           # fluxo no WebKit (Playwright) contra o preview
```

Pipeline de dados (gera arquivos NÃO versionados; veja README): `npm run fetch-data`, `python3 scripts/fetch_pool.py`,
`python3 scripts/export_data.py`, `python3 scripts/fetch_card_text_pt.py`, `.venv/bin/python scripts/fetch_card_art.py`,
`npm run build-characters`, `.venv/bin/python scripts/build_sprites.py`.

## Arquitetura

- `src/engine/`: ocgcore (EDOPro) em WASM, **build síncrono** (`ocgcore-wasm`, sem JSPI).
  - `session.ts` cria o duelo (modo `MR1`), carrega `constant.lua` e `utility.lua` e **embaralha o deck por conta própria**
    (o core não embaralha; a compra sairia na ordem inversa da lista).
  - `driver.ts` (`DuelDriver`): avança o motor, responde pela CPU (jogador 1) e pelos prompts automáticos, tem orçamento
    de passos/tempo e devolve `prompt`/`end`/`error`. É o mesmo código no Worker e nos testes em Node.
  - `host.ts` trata as mensagens; `worker.ts` é só o invólucro; `inline.ts` roda o motor na thread principal (`?engine=inline`).
  - `cpu.ts`: CPU aleatória com preferências; só responde o que o motor oferece (ex.: `to_ep` pode ser falso).
  - `narrator.ts`: LP/turno/fase, texto dos eventos e a "foto" do tabuleiro para a UI.
- `src/screens/`: `DuelScreen` (jogada pela folha da carta, botões laterais, painéis de prompt), `StoryScreen`, `HubScreen`,
  `DeckBuilder`, `ShopScreen`. `src/components/CardSheet.tsx` (folha da carta + `Backdrop`).
- `src/story/`: `runner.ts` (motor puro da VN), `world.ts` (locais, cenas, `pickScene`), `content.ts` (texto),
  `progress.ts` (save em IndexedDB via Dexie: nome, corações, vitórias, moedas, coleção, decks, cena em andamento).
- `src/game/`: `decks.ts` (regras: 40–60, Extra ≤15, ≤3 cópias, limitado à coleção), `packs.ts`, `economy.ts`.
- `src/data/`: carregador de cartas (sobrepõe o texto em português) e rótulos (atributo, raça, tipo).
- Estilo: `src/styles.css` (HUD azul: `.hud`, `.hud-btn`, chanfro com `clip-path` + camadas `--cut-tl/--cut-br` que
  desenham a borda diagonal; `--fill` troca o fundo de um `.hud`).

## Armadilhas conhecidas (não regrida)

- **Worker em arquivo único** (`vite.config.ts` → `worker.rollupOptions.output.inlineDynamicImports`). Com code-splitting,
  o chunk do WASM importava a entrada do Worker e o Safari do iOS reexecutava o módulo, perdendo o duelo após o primeiro
  pedido. O estado do duelo fica em `globalThis.__duel`.
- **iOS só entrega toques confiáveis a `<button>`**: fundos que fecham usam `Backdrop`, a cena usa `.tapzone`. Não use
  `onClick` em `div` para ações importantes.
- O PWA se atualiza sozinho (`registerSW({ immediate: true })`); a arte das cartas (~70 MB) fica fora da pré-carga
  (cache em tempo de execução).
- Fichas (tokens) precisam estar em `cards.json` (o export inclui), senão cartas como Scapegoat dão erro de Lua.
- Cartas que o motor não aguenta vão em `raw/pool/blocklist.json` (rode `export_data.py` depois).

## Diagnóstico

- `?debug=1` mostra no duelo um painel com as etapas do Worker e manda os logs para o servidor (dev/preview), que grava em
  `/tmp/ygo-device.log`. Serve para depurar o iPhone físico pelo túnel.
- Simulador de iOS (Safari real) reproduz bugs de WebKit que o Chrome e o Playwright não pegam.

## Regras do projeto

- **Nunca versione material da Konami**: `raw/`, `assets/characters/*/`, `public/{cards,characters,data}`,
  `public/scripts.json` estão no `.gitignore`. Só metadados leves (manifest, labels, characters.json) entram no git.
- Hospedagem só com acesso protegido (ex.: Cloudflare Access); repositório privado. O túnel `cloudflared` é temporário.
- Personagens: só Duel Monsters (e variações como DSoD); sprites do Duel Links, variante `chara007`, rosto 240×240
  sobreposto ao corpo em (260, 120).
- Antes de mudanças grandes ou ambíguas, pergunte. Teste no navegador (viewport de celular) e, para iOS, no simulador.
