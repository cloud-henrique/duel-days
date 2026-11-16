# Design

## Context

O que está ruim hoje está em `proposal.md` (Why). Abaixo, o estado do código que condiciona a solução:

- `src/styles.css`, seção Duelo:
  - medidas em px soltos: placa ~85pt, LP 26px, contadores 17px, botão lateral 112px, tarja da mão 17px;
  - `.fieldwrap { width: min(100%, calc(82dvh - 256px)) }` encolhe o campo quando a altura visível cai (Safari com
    barras: ~709pt);
  - as zonas são quase quadradas (`aspect-ratio: 1/1.04`) em todas as fileiras, e a carta ocupa 92% da zona;
  - `--hw: clamp(74px, 12.4dvh, 104px)` define a carta da mão pela altura.
- `src/screens/DuelScreen.tsx`:
  - `Slot` desenha a carta oficial (`/cards/{small,large}/<id>.webp`, imagem em inglês) com uma `<b class="strip">`
    por cima;
  - `Plate` mostra avatar, LP, contadores e cemitério;
  - um toast mostra os eventos, e a barra de fases tem `width: 72%`.
- `DuelScreen.tsx` tem 378 linhas (~27 KB) e mistura várias responsabilidades:
  - ciclo de vida do Worker e watchdog;
  - 17 `useState`;
  - regras puras de prompt (`cardActions`, `highlighted`, o mapa `PHASES`);
  - os componentes `Slot`, `Plate` e `Ico`;
  - os painéis.

  Há números soltos (1300, 100000, 12000, `3.2deg`, `-34px`) e máscaras de bits cruas (`info.type & 2`). O
  `styles.css` tem 24 KB num arquivo só, e a seção Duelo é a maior parte.
- **Não há testes de unidade.** Os testes são scripts em `proto/` (smoke, monkey, e2e no WebKit) rodados com `tsx` e
  Playwright.
- Os nomes e textos já chegam em português: `src/data/cards.ts` sobrepõe `text.pt.json` com `name` + `desc` para
  ~1.590 cartas.
- O service worker já guarda em cache de execução tudo que está em `/cards/` (`CacheFirst`, `card-art`, 5.000
  entradas). Uma pasta nova `cards/cropped/` cai nessa regra sem mudança.
- Referência: o nativo, em `duel-academy/App/DuelAcademy/Duel/Board/BoardMetrics.swift`, `DuelMat.swift`,
  `DuelistPlate.swift`, `PlayerHand.swift`, `PhaseButton.swift` e `Cards/CardFace.swift`.

## Goals / Non-Goals

**Goals:**

- As mesmas proporções do nativo num iPhone de 390×844 (PWA instalado), e degradação limpa de 360 a 430 de largura.
- Uma única fonte de verdade para as medidas: tokens CSS com nome, sem números soltos no layout.
- Uma `DuelScreen` que caiba na cabeça: ela é dividida por responsabilidade, e as regras puras ficam testadas por unidade
  antes de qualquer mudança de comportamento.

**Non-Goals:**

- Animações de eventos: ficam no change `animar-duelo`. Aqui entram só a contagem do LP, o popup e as transições
  simples de estado (borda da placa ativa, chip da fase).
- A face própria da carta no deck builder, na loja e na folha de detalhe.
- Layout de tablet ou paisagem, além de não quebrar.

## Decisions

### 1. Métricas como tokens CSS com unidades de contêiner (sem JS)

O `.duel` vira contêiner (`container-type: size`). As métricas são variáveis CSS nomeadas, declaradas **uma vez** no
topo de `duel.css`, e calculadas com `cqw`/`cqh`. Assim W = `100cqw` e H = `100cqh`. As constantes do nativo ficam
como tokens com nome, em vez de números soltos:

```css
.duel {
  container-type: size;
  /* constantes (BoardMetrics.swift) */
  --zone-max: 96px;  --hand-card-max: 96px;  --mat-max: 500px;  --hand-max: 520px;
  --mat-inset: 40px; --hand-inset: 24px;     --mat-pad: 10px;   --gap: 6px;  --center-gap: 46px;
  --st-ratio: 0.78;  --card-ratio: 0.686;    --zone-h-ratio: 0.10; --hand-card-ratio: 0.25;
  /* derivadas */
  --mat-w:  min(100cqw - var(--mat-inset), var(--mat-max));
  --hand-w: min(100cqw - var(--hand-inset), var(--hand-max));
  --zone:   min(var(--zone-max), (var(--mat-w) - 2 * var(--mat-pad) - 4 * var(--gap)) / 5, 100cqh * var(--zone-h-ratio));
  --st-h:   calc(var(--zone) * var(--st-ratio));
  --hand-card: min(var(--hand-card-max), var(--hand-w) * var(--hand-card-ratio));
}
```

O espaçamento e o ângulo do leque dependem de `n`, que a mão grava inline em `--n` (como já faz hoje com `--n1`):
`--hand-step: min(0.8 * card, (hand-w − 32px − card) / max(1, n − 1))` e `--hand-angle: min(4deg, 16deg / n)`.

- *Por que não um hook JS:* nada no React precisa desses números neste change. O `animar-duelo` mede os retângulos
  reais no DOM em vez de recalcular posições (ver o design dele). Um hook com `ResizeObserver` seria uma abstração
  antes de existir a necessidade, e criaria uma segunda fonte de verdade.
- *Alternativa:* `calc()` em cima de `vw`/`dvh`. Foi descartada porque mede a janela e não o contêiner, e porque o
  `dvh` foi justamente o que encolheu o campo.
- Suporte: `cqw`/`cqh` existem no Safari 16+ (o iPhone 11 Pro roda iOS 17+).

Com 390×844: mat 350, zone 61, st-h 48, hand-card 91. Os testes de layout (item 13) medem esses valores no navegador.

### 2. Teto por altura só na mão

Quando a altura visível é baixa (Safari com barras), quem cede é a mão e o espaço flexível entre a placa e a mão: a
mão ganha um terceiro termo no `min()` de `--hand-card`, dado pela altura que sobra
(`100cqh − placas − campo − margens`), com nome próprio (`--hand-room`). O campo nunca encolhe por altura além de `H*0,10` na zona. O alvo principal é o PWA instalado, onde as
fórmulas reproduzem o nativo.

### 3. Campo: inclinação 22° no centro

`.field { transform: perspective(P) rotateX(22deg); transform-origin: 50% 50% }`. P é calibrado para equivaler ao
`perspective 0.45` do SwiftUI, cerca de `matW * 2.2`; o valor final é ajustado comparando lado a lado com o print do
nativo.

As zonas são desenhadas:

- monstro: `zone × zone`;
- Magia/Armadilha: `zone × stH`;
- faixa central: 46, com zona de campo, barra de fases e zona de campo.

Fundo laranja (monstro) ou verde (M/A) a 33% sobre preto, contorno tracejado ciano a 50%.

A carta ocupa a altura toda da zona. Em defesa, gira 90° e os selos giram de volta para ficar em pé.

### 4. Face própria da carta: componente `CardFace`

É um componente React com HTML e CSS (não canvas), escalado por uma única variável `--w`. Todas as medidas internas
são frações de `--w`, como no `CardFace.swift`:

```
+----------------------+   moldura: cor por tipo (normal, efeito, fusão, ritual, magia, armadilha, ficha)
| NOME EM PT       (A) |   nome: serifada, 1 linha, encolhe para caber; (A) = selo do atributo
| * * * *              |   estrelas (monstro) ou ícone do tipo (M/A)
| +------------------+ |
| |  arte recortada  | |   /cards/cropped/<id>.webp, object-fit: cover
| +------------------+ |
| [   2000 / 1500    ] |   tarja: ~13,75% da largura, serifada black; M/A: MAGIA / ARMADILHA
+----------------------+
```

Há dois tamanhos lógicos:

- `compact`: mão, campo e verso;
- `full`: o destaque de ativação, que mostra também uma linha de tipo.

Sem arte recortada, o fallback é a `small` oficial com `object-fit` sobre a área da arte, para não deixar buraco.

- *Alternativa:* manter a carta oficial com selo pequeno. O usuário escolheu o template (fica igual ao nativo e
  resolve a imagem em inglês).
- *Alternativa:* pré-renderizar as faces em imagens. Foi descartada porque multiplicaria o peso e travaria o texto
  em PT na hora do build.

### 5. Arte recortada no pipeline

`scripts/fetch_card_art.py` ganha a variante `'cropped': ('cards_cropped', 256)`:

- origem: `images.ygoprodeck.com/images/cards_cropped/<id>.jpg`;
- saída: `public/cards/cropped/<id>.webp` com qualidade ~68;
- tamanho estimado: 20–30 MB.

O verso oficial também é baixado uma vez para `public/cards/back.webp`. Tudo isso já está no `.gitignore`
(`public/cards`). A regra do service worker para `/cards/` cobre a pasta nova. O README ganha o passo.

### 6. Chakra Petch Bold

É servida de `public/fonts/ChakraPetch-Bold.woff2`, com `OFL.txt` ao lado: é a mesma fonte do nativo e é OFL, então
pode ser versionada. Usa `@font-face` com `font-display: swap` e entra na pré-carga (cerca de 30 KB). Vale só para
números (`.num`). Rótulos continuam na fonte do sistema.

### 7. Placa do duelista

A placa tem ~60pt de altura e padding 8:

- avatar 44;
- nome em caixa alta, peso heavy;
- LP 22 em Chakra Petch;
- barra de LP 7×120, com degradê verde (≥50%), amarelo (≥25%) ou vermelho (abaixo disso);
- contadores (deck e mão) 13;
- cemitério 26×38 com a carta do topo, tracejado quando vazio.

A borda fica ciano a 30% e passa a 100% com brilho no duelista da vez. A transição é curta (~200ms).

O popup "−500"/"+500" fica num espaço reservado à direita do LP, com a largura de "−8000" para não empurrar o layout:

- entra com escala de 0,6 a 1 e opacidade;
- fica 1,2s;
- sai com fade.

O número do LP conta em 24 passos de 30ms.

### 8. Barra de fases e narrador

A barra fica centrada na faixa central e com largura pelo conteúdo, não 72%. Ela tem:

- "T{n}";
- um chip por fase (DP, SP, M1, BP, M2, EP), com o ativo em #FFC61A;
- abaixo, uma linha de 16pt com o último texto do narrador.

Uma linha nova empurra a anterior para cima (transição de ~200ms). O toast é removido; o histórico completo continua
no botão "⋯".

### 9. Botões e menu

- Botão lateral 64×60: BATALHA, MAIN 2 ou FIM DO TURNO, rótulo 11pt black.
- "Encerrar" compacto, no estilo caption2.
- O botão de menu (44×40, engrenagem) fica no canto da placa do oponente e abre uma folha (`Backdrop`) com
  "Desistir". O "Desistir" pede confirmação, como hoje.

Todos os alvos de toque são `<button>`, por causa da regra do iOS.

### 10. Mão do oponente e mão do jogador

- **Oponente:** cartas de 24pt de largura com espaçamento −12, usando a imagem do verso oficial.
- **Jogador:** o leque usa `handStep` e `handAngle` do item 1. O deslocamento vertical é `|i−meio|·4`. A carta
  selecionada sobe.

### 11. ATK/DEF "?"

O motor usa `-2` para "?". Chega como `4294967294` porque passa por uint32 em algum ponto do caminho
`cards.json`/narrador. A tarefa começa por um teste que reproduz o valor e acha a origem. A conversão é corrigida
nesse ponto, e uma `formatStat(v)` em `src/data/labels.ts` (onde já ficam os rótulos) passa a ser o **único** lugar que
formata ATK/DEF: tarja, selo e folha.

- `v < 0` ou `v >= 0x7fffffff` vira `?` (o limite tem nome: `STAT_UNKNOWN_MIN`);
- os demais valores aparecem como estão.

### 12. Testes de unidade com Vitest

É o test runner do ecossistema Vite: reaproveita o `vite.config.ts` e o TypeScript sem configuração nova de build.
O ambiente padrão é `node`. Testes de componente usam `happy-dom` com `@testing-library/react`. O script
`npm test` (`vitest run`) entra no fluxo junto com o `tsc`. Os scripts de `proto/` continuam como testes de
integração; eles não são reescritos.

Cada feature nova deste change entra com teste:

| Unidade | O que o teste cobre |
|---|---|
| `formatStat` | −2, 0x7fffffff, 4294967294, 0, 2500 |
| `frameOf(card)` (moldura da face) | um caso por tipo: normal, efeito, fusão, ritual, magia, armadilha, ficha |
| `lpTween(from, to, step)` (contagem do LP) | início, fim, passos intermediários, cura e dano |
| `lpTone(lp, start)` (cor da barra) | limites de 50% e 25% |
| `phaseChips(phase)` | fase ativa para cada bit, com BP agrupando os sub-passos |
| `CardFace` (componente) | nome em PT, tarja de monstro/magia/armadilha, fallback da arte, `?` no ATK |
| `Plate` (componente) | popup de dano/cura, borda ativa, cemitério vazio/cheio |
| `PhaseBar` (componente) | todos os chips presentes, narrador mostrando o último texto |
| `DuelMenu` (componente) | Desistir pede confirmação; tocar fora fecha |

### 13. Testes de layout no navegador

As medidas da spec (`duel-hud`) são de CSS e não aparecem num teste de unidade. Um script Playwright novo,
`proto/layout-e2e.mjs`, no mesmo padrão do `webkit-e2e.mjs`, abre o duelo no WebKit em 360×780, 390×844, 390×709 e
430×932 e mede pelo `getBoundingClientRect`:

- largura do campo;
- zonas;
- proporção M/A;
- faixa central;
- carta da mão;
- chips inteiros;
- ausência de overflow horizontal.

### 14. Divisão da `DuelScreen`, com rede de testes primeiro

A divisão é por responsabilidade, só onde já há código real para mover. Nada de pastas vazias ou camadas genéricas:

```
src/screens/duel/
  DuelScreen.tsx     composição + estado da tela
  useDuelEngine.ts   Worker/inline, mensagens, watchdog, reinício (hoje espalhado em 3 useEffect)
  prompt.ts          puro: cardActions, highlighted, sideActions, phaseChips (hoje dentro do componente)
  Field.tsx          fileiras e zonas
  Hand.tsx           leque do jogador e versos do oponente
  Plate.tsx          placa (+ popup de LP)
  PhaseBar.tsx       chips + narrador
  DuelMenu.tsx       menu com Desistir
  duel.css           seção Duelo, saída do styles.css (os tokens do item 1 ficam aqui)
src/components/CardFace.tsx   reutilizável (o deck builder e a loja podem adotar depois)
```

Ordem de trabalho para **não mudar comportamento sem teste**:

1. Testes de caracterização das funções puras como estão hoje (`cardActions`, `highlighted`, o mapa de fases e o
   cálculo dos botões laterais) com prompts reais capturados do `monkey.ts`.
2. Mover o código sem mudar comportamento. Os testes e o `webkit-e2e` continuam passando.
3. Só então mudar o visual, com os testes novos da tabela do item 12.

A pasta de componentes fica dentro de `screens/duel/` porque só o duelo os usa. O `CardFace` vai para
`src/components/` porque tem um segundo uso previsto e já é parecido com a `CardSheet`.

### 15. Sem números mágicos

- **CSS:** medidas com nome em tokens (item 1). Cores e durações do HUD também viram tokens:
  - `--c-cyan #2AB8FF`;
  - `--c-select #FFC61A`;
  - `--c-navy #050A18`;
  - `--t-quick 200ms`.
- **TS:** os tempos (1300 do destaque, 1200 do popup, 30 ms × 24 da contagem, o watchdog de 12000 e de 100000)
  viram constantes com nome no módulo que as usa. O que é tempo de animação fica preparado para ir para o `PACING` do
  `animar-duelo`.
- As máscaras de tipo (`type & 2`) e de fase passam a ser constantes com nome em `src/data/labels.ts`, como
  `TYPE_SPELL` e `TYPE_TRAP`. Elas vêm direto de `OcgType`/`OcgPhase`, que o `ocgcore-wasm` exporta, e não são
  redeclaradas.

## Risks / Trade-offs

- **Arte recortada ausente** (carta nova no pool, ou falha de download): o fallback do item 4 evita o buraco. O
  script lista as cartas que faltam.
- **Nome longo em PT no tamanho compacto (~22px de largura de fonte):** o texto encolhe até um mínimo e depois corta
  com reticências. O teste visual usa os 20 nomes mais longos do pool.
- **Performance com 30+ faces na tela** (HTML com várias camadas): cada face tem ~6 elementos, não usa sombras caras e
  usa `contain: layout paint`. A medição é feita no iPhone 11 Pro físico.
- **Perspectiva CSS diferente da do SwiftUI:** a calibração é visual, por comparação com o print. O valor fica numa
  constante.
- **O narrador numa linha só pode esconder eventos rápidos:** o histórico "⋯" continua. O `animar-duelo` vai cadenciar
  os eventos.

## Migration Plan

O change entra num único deploy do PWA, que se atualiza sozinho. Antes do build é preciso rodar o fetch da arte
recortada, senão vale o fallback do item 4. Para reverter, basta um revert do commit, porque não há dado salvo novo.
