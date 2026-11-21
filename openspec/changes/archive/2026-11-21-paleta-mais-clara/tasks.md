# Tasks

## 1. Escala de tokens e teste-guarda

- [x] 1.1 Tirar screenshots "antes" (duelo, título, mapa, encontro/diálogo, loja, abertura de pacote, editor, Coleção, modal das Opções) em 375×812 no dev server e guardá-las no scratchpad para comparar; conferir que todas as telas foram capturadas
- [x] 1.2 Criar no `:root` do `src/styles.css` a escala `--navy-0`…`--navy-6` com os valores de partida da direção B e os papéis da Decisão 1 do design (`--bg`, `--well`, `--chip`, `--panel`, `--panel2`, `--phase`, `--plate`, `--mat`, `--btn-a`, `--btn-b`, `--glow`, `--line`, `--line-dim`, `--dim`, `--edge-glow`, `--zone-*`); verificar com `npx tsc --noEmit` e o app abrindo sem erro no console
- [x] 1.3 Escrever o teste-guarda (Decisão 8): lê os CSS de `src/`, falha com azul escuro avulso fora do `:root` (exceto `cardface.css` e `.scrim`), com uma lista temporária dos arquivos ainda não migrados; verificar com `npm test` passando e falhando ao inserir um `#0a1a3a` de propósito num arquivo já migrado

## 2. Base compartilhada (`styles.css` e `src/ui/`)

- [x] 2.1 Migrar `.hexbg` (radial `--glow → --bg`), `.hud`, `.hud-btn` (e `.primary`), campos, `.sheet` e as demais cores azuis do `styles.css` para os papéis; tirar o arquivo da lista do teste e verificar com `npm test` e screenshot do título
- [x] 2.2 Migrar `src/ui/{modal,coin,icons,titles}.css` e o `src/screens/title/title.css`; tirar da lista e verificar com `npm test` e screenshots do título e do modal das Opções
- [x] 2.3 Subir as opacidades das trilhas no `scripts/build_circuit.mjs`, regerar com `node scripts/build_circuit.mjs` e verificar na screenshot do título que a colmeia continua visível sobre o azul médio

## 3. Duelo (`duel.css`)

- [x] 3.1 Migrar placa, poço da barra de LP e do avatar, tapete (com `color-mix` nas transparências), barra de fases, chips, pilhas e menu do duelo; remover o `--c-navy`; tirar da lista e verificar com `npm test` e `node proto/layout-e2e.mjs`
- [x] 3.2 Reajustar o neon (Decisão 4): alfas do `.matwrap`, `.foebar`/`.mybar`, moldura do avatar e luz do turno dos dois lados; verificar comparando com a screenshot "antes" que o brilho continua perceptível e a placa da vez brilha mais
- [x] 3.3 Reajustar as tintas das zonas de monstro e de Magia/Armadilha/Campo (Decisão 5); verificar em screenshot de um duelo com cartas no campo que as zonas não ficam barrentas e que os emblemas apagados continuam legíveis

## 4. Campanha, loja e editor

- [x] 4.1 Migrar `campaign.css` (mapa, cabeçalho, diálogo: folha, placa do nome e `TopBar`; laços, status, Coleção, fim) e o degradê de reserva do `src/screens/campaign/assets.ts`; tirar da lista e verificar com `npm test` e screenshots com `?campaign=bond` nos três períodos
- [x] 4.2 Migrar `shop.css` (balcão, vitrine, detalhe do pacote, abertura); tirar da lista e verificar com `npm test` e `node proto/shop-e2e.mjs`
- [x] 4.3 Migrar `deck.css` (cabeçalho, painel do deck, gaveta, maleta, `DeckSheet`); tirar da lista e verificar com `npm test` e `node proto/deck-e2e.mjs`
- [x] 4.4 Esvaziar e remover a lista temporária do teste-guarda; verificar com `npm test` passando sem exceções além de `cardface.css` e `.scrim`

## 5. PWA

- [x] 5.1 Trocar `#050c1f` pelo hex do `--bg` no `<meta name="theme-color">` do `index.html` e no `theme_color`/`background_color` do `vite.config.ts`, e estender o teste-guarda para conferir que os três batem com o `--bg`; verificar com `npm test` e `npx vite build` gerando o manifest com a cor nova
- [x] 5.2 Conferir que o ícone não mudou (`assets/app-icon/*.svg` e `public/icons/*` fora do diff); verificar com `git diff --stat`

## 6. Calibração e conferência final

- [x] 6.1 Montar as duas versões da escala (intermediária e B cheia), tirar screenshots do duelo, mapa, loja e editor em 375×812 com cada uma e mandar ao usuário para escolher; aplicar a escolhida na escala
- [x] 6.2 Medir no navegador (`getComputedStyle` + fórmula WCAG) o contraste do narrador, dos chips apagados, dos contadores da placa e do texto apagado do mapa e da loja; verificar que todos ficam em 4,5:1 ou mais
- [x] 6.3 Rodar `npx tsc --noEmit`, `npm test`, `node proto/layout-e2e.mjs`, `node proto/shop-e2e.mjs`, `node proto/deck-e2e.mjs` e `node proto/duel-e2e.mjs`; verificar que todos passam
- [x] 6.4 Abrir o build (`npx vite build && npx vite preview`) no simulador do iOS e conferir duelo, diálogo e loja e a barra de status sem faixa escura; mandar as screenshots ao usuário
- [x] 6.5 Atualizar o CLAUDE.md (seção de estilo: escala `--navy-*` e papéis, nenhum azul escuro solto, teste-guarda); verificar lendo o trecho atualizado

## Workflow follow-up

- Arquivar a change depois da revisão (`/opsx:archive`), sincronizando `visual-do-jogo` e `pwa-app-icons`.
- Publicar com `npx vite build && npx wrangler pages deploy dist --project-name dueldays --branch main` após o push.
