# Design

## Context

O `:root` do `src/styles.css` já tem alguns tokens (`--bg`, `--bg2`, `--panel`, `--panel2`, `--line`, `--line-dim`,
`--dim`), mas a maior parte do azul está solta: ~107 hex escuros (`#0a1a3a` 15×, `#061a3d` 11×, `#050a18` 11×, …) e
vários `rgba(…)` azuis distribuídos por `styles.css` (31), `duel.css` (31), `campaign.css` (21), `shop.css` (14),
`deck.css` (10), `title.css` e `src/ui/*.css`, além do degradê de reserva do `campaign/assets.ts`. O `duel.css` também tem
`--c-navy: #050a18` e cores próprias da placa, do tapete e da barra de fases. O fundo `.hexbg` é um radial
`#1a4066 → #050a18` sob o `circuit.svg` (trilhas em `#2ab8ff` com opacidade .07/.12/.16, geradas por
`scripts/build_circuit.mjs`). O PWA fixa `#050c1f` em `index.html` e em `vite.config.ts`; o iOS usa
`apple-mobile-web-app-status-bar-style: black-translucent` (a barra fica sobre o conteúdo).

Motivação e escopo: veja `proposal.md`. Requisitos: `specs/visual-do-jogo` e `specs/pwa-app-icons`.

## Goals / Non-Goals

**Goals:**
- Uma escala de azuis como única fonte, de modo que recalibrar o brilho do jogo seja mudar poucos valores.
- Chegar ao "azul médio" sem perder o contraste do texto, o destaque do neon e a leitura das zonas.
- Um teste que impeça azul escuro avulso de voltar aos CSS.

**Non-Goals:**
- Ajuste de brilho pelo jogador (tema escolhível): a paleta é uma só. Os tokens deixam isso possível depois.
- Mexer na face das cartas, nas cores semânticas (`--me`, `--foe`, `--acc`, `--hl`, `--c-select`, raridades) ou nos
  degradês dos títulos de destaque.
- Refazer o ícone do app.

## Decisions

### 1. Duas camadas de tokens: escala + papéis

```
escala (só no :root)          papéis (o que os CSS usam)
--navy-0  mais escuro    -->  --bg (bordas do fundo, theme_color)
--navy-1                 -->  --well (barra de LP, avatar, campos), --chip
--navy-2                 -->  --panel, --phase
--navy-3                 -->  --panel2, --plate, --mat
--navy-4                 -->  --btn-b
--navy-5                 -->  --btn-a, --glow (centro do fundo)
--navy-6  mais claro     -->  --line-dim
+ --line, --dim, --edge-glow (ciano), --zone-m / --zone-s
```

Os CSS das telas leem só os **papéis**; a escala fica no `:root`. Recalibrar = mexer na escala; trocar o tom de uma
peça = remapear um papel. Os tokens de papel que já existem (`--bg`, `--panel`, `--panel2`, `--line`, `--dim`) mantêm o
nome, para o diff ficar menor. O `--c-navy` do `duel.css` some (vira `--bg`).

*Alternativa:* uma escala em HSL com um único `--l` de luminosidade (`hsl(215 60% calc(var(--l) + …))`). Seria
elegante para calibrar, mas os tons atuais não variam só em luminosidade (o tapete puxa para o ciano, os botões para o
azul royal) e um degrau linear deixa os escuros e os claros mal distribuídos. Hex por degrau, escolhido na calibração,
dá mais controle.

### 2. Transparências derivadas dos tokens

Os `rgba(10,52,84,.96)` e parecidos (tapete, barra de fases, véus internos) viram
`color-mix(in srgb, var(--mat) 96%, transparent)`. O `color-mix` funciona no Safari 16.2+ e no Chrome 111+, que cobrem
os aparelhos dos amigos. O `.scrim` (véu de diálogo, `rgba(2,6,18,.72)`) fica como está: escurecer é o papel dele.

### 3. Valores de partida (direção B) e calibração em dois níveis

Partida: fundo `#26507f` (centro) → `#173a63` (bordas), painel `#2c609c`, tapete `#2d6a9a`, barra de fases `#22518c`,
chip `#2f64a8`, botão `#3a74c4 → #2c5ea8`, poço `#163c6b`, `--dim` por volta de `#c4d7f2`, `--line` por volta de
`#7fc0ff`.

Com os tokens prontos, calibrar em duas versões da escala: **intermediária** (entre a A e a B) e **B cheia**. Tirar
screenshots do duelo, do mapa, da loja e do editor em viewport de celular (375×812) e no simulador do iOS, e escolher
com o usuário. A escala vencedora fica; a outra é descartada (sem tema escolhível).

### 4. Neon reajustado, não removido

Sobre um fundo mais claro, o mesmo `drop-shadow(… rgba(42,184,255,.35))` quase some. Os alfas dos brilhos (`.matwrap`,
`.foebar`/`.mybar`, moldura do avatar, luz do turno) sobem até o destaque parecer o de hoje, e as bordas ciano
(`--edge` do tapete e das placas) ficam mais claras/opacas. A luz do turno do oponente (vermelha) segue a mesma regra.

### 5. Zonas com tinta mais definida

As tintas atuais (laranja e verde a ~13–20% de alfa) ficam barrentas sobre o tapete mais claro (cinza-marrom no
protótipo). Elas passam a ter mais saturação e alfa, com o tracejado mais nítido, mantendo os emblemas apagados. Os
valores saem da calibração, como tokens `--zone-m-*` e `--zone-s-*` (os `--zone-m-fill`/`--zone-s-fill` já existem).

### 6. Circuito pelo gerador

As opacidades das trilhas (.07/.12/.16) sobem no `scripts/build_circuit.mjs` e o `circuit.svg` é regerado; o SVG não é
editado à mão. A cor segue `#2ab8ff`.

### 7. Cores de tema = `--bg`

`index.html` e `vite.config.ts` usam o mesmo hex do `--bg` (as bordas do degradê). Como não leem CSS, um teste confere
que os três valores batem com o `--bg` do `styles.css`.

### 8. Teste-guarda

Um teste de unidade (como o que procura "moedas" em `src/ui/Dp.test.tsx`) lê os CSS de `src/` e falha se achar um azul
escuro avulso fora das declarações de tokens do `:root`. "Azul escuro" = hex ou `rgb(a)` com o canal azul dominante e
luminância baixa. Ficam de fora o `cardface.css` e o `.scrim`. O mesmo teste confere as cores de tema do item 7.

## Risks / Trade-offs

- [Texto apagado e bordas perdem contraste num fundo mais claro] → `--dim` e `--line` clareiam junto, e o contraste do
  narrador, dos chips e dos contadores é medido (`getComputedStyle` + cálculo WCAG no navegador) antes de fechar.
- [O neon perde o "brilho" que dá identidade] → alfas reajustados (Decisão 4) e comparação lado a lado com screenshots
  do antes.
- [Cartas e verso parecem menos destacados sem o fundo preto] → conferir nas screenshots; se preciso, uma sombra um
  pouco mais forte sob as cartas (sem brilho, que a spec proíbe na mão).
- [Fundos das cenas da campanha (arte escura do Tag Force) contrastam com a folha clara] → a folha e a `TopBar` usam a
  paleta; a arte e o filtro do período não mudam. Conferir no simulador nos três períodos.
- [iOS mantém a abertura antiga do app instalado até reinstalar] → aceitável; a barra de status segue o
  `black-translucent` sobre o conteúdo, que já é a cor nova.
- [Um seletor de outra tela dependia de uma cor solta que vira papel e muda de tom] → a troca é arquivo por arquivo,
  com screenshot de cada tela antes e depois e os e2e da loja e do editor.

## Migration Plan

Sem dados nem save envolvidos. Implementar, conferir (testes, e2e, simulador) e publicar como de costume
(`npx vite build && npx wrangler pages deploy …`). Para voltar atrás, basta reverter o commit: a escala é a única fonte.
