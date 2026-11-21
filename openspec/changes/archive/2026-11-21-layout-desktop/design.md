# Design

## Context

Veja proposal.md (Why). Estado atual que molda a abordagem:

- Não existe nenhuma `@media` de layout nas telas. O duelo deriva tudo dos tokens do `.duel` (`container-type: size`,
  `100cqw/100cqh`): a zona é a menor entre a que cabe na largura e a que cabe na altura. Num monitor, a altura limita, e
  as placas (`flex: 1`) e a mão ficam com a largura toda.
- O DOM do duelo é uma coluna: `.foebar` (menu + placa) → `FoeHand` → `Field` → `.mybar` (placa + `.sidebtns`) → mão.
  As camadas por cima são a folha da carta (`CardSheet`, um `scrim.uphand` com `Backdrop`), o painel de prompt
  (`scrim.uphand` com "Ver campo"/`peekbar`), a `ChoiceBar`, a `PileSheet` e o histórico.
- A encenação (`anim/play.ts`) mede os `data-loc` na hora. Placas, zonas, pilhas e mãos podem mudar de lugar sem tocar
  na animação.
- O encontro (`EncounterScreen`) empilha `hud-btn`s em coluna dentro da folha de baixo do `Dialogue`.

## Goals / Non-Goals

**Goals:**
- Um gatilho único de "tela larga", com o mesmo resultado no CSS e no React.
- O retrato continua idêntico, pixel por pixel: os testes e as specs atuais do celular seguem valendo sem mudança.
- Os componentes do duelo (`Plate`, `Field`, `Hand`, `PhaseBar`, `PromptPanel`, `ChoicePanels`) são reaproveitados
  sem fork. Só a composição muda.

**Non-Goals:**
- Mapa, loja, editor, coleção, laços, status e título (ficam para outra change).
- Atalhos de teclado, clique direito ou arrastar com o mouse no duelo.
- Layout próprio para celular deitado (continua o de retrato).

## Decisions

### 1. Gatilho: uma media query, espelhada num hook

`(orientation: landscape) and (min-width: 900px)`. No CSS, ela vai como `@media` nos arquivos que mudam. No React, um
`useWide()` (`matchMedia` + ouvinte de `change`) lê a mesma string, exportada de `src/ui/wide.ts` (`WIDE_QUERY`). O CSS
não importa TS, então um teste (na linha do `palette.test.ts`) confere que todo `@media` de tela larga nos CSS usa
exatamente a string do `WIDE_QUERY`.

- *Alternativa*: classe `.wide` no `<html>` posta pelo JS, com o CSS só por classe. Foi descartada: o primeiro quadro
  sairia errado antes do JS, e o CSS do encontro não precisa de JS.
- *Por que 900*: o iPad mini deitado (1024) entra, e o celular deitado (~844–932 de largura, mas ~390 de altura) fica de
  fora. Para garantir isso, a consulta ganha também `and (min-height: 600px)`. A string final é
  `(orientation: landscape) and (min-width: 900px) and (min-height: 600px)`.

### 2. Duelo: outra composição no JSX, não CSS contorcido

O `DuelScreen` escolhe entre `PortraitLayout` (o JSX de hoje, sem mudança) e `WideLayout` pelo `useWide()`. O
`WideLayout` monta uma grade de 3 colunas (`.duel.wide`) com os mesmos componentes:

```
+-----------+--------------------------+-------------+
| [=] placa |        foehand           |             |
| oponente  |                          |  CardPanel  |
|           |         Field            | (ou prompt) |
| narrador/ |   (altura toda, centro)  |             |
| histórico |                          |             |
| placa     |    ações sobre a carta   |             |
| jogador   |          Hand            | [BATALHA]   |
+-----------+--------------------------+-------------+
```

- *Alternativa*: o mesmo DOM com `grid-template-areas` e `display: contents` no `.foebar`/`.mybar`. Foi descartada:
  `display: contents` perde o `filter: drop-shadow` dos invólucros (o brilho das placas), e o `.sidebtns` precisaria
  sair do `.mybar` só com CSS.
- **Tokens**: em `.duel.wide`, `--zone-h` deriva só da altura (4 fileiras + faixa central + mão do oponente + mão no
  mínimo). A largura do campo fica livre, porque as laterais não disputam espaço com ele. O mínimo da carta da mão acompanha a altura
  (`clamp(64px, 11cqh, 110px)`): numa tela alta, a mão fica legível (~100px), e numa baixa ela cede espaço antes das zonas. As colunas laterais têm
  `--wide-side: clamp(240px, 22cqw, 360px)`. O `--hand-max` sobe. Tudo continua nos tokens do topo do `duel.css`, num
  bloco `.duel.wide { … }`.
- O narrador da coluna esquerda é o mesmo texto do `beatText`. A `PhaseBar` continua na faixa central do campo, e a
  coluna esquerda mostra as últimas linhas do histórico (o `log` que já existe), sem botão.

### 3. Carta em foco: hover mostra, clique fixa

Estado no `DuelScreen`: `pinned` (o `sheet` de hoje) e `hover`. O `CardPanel` mostra `hover ?? pinned`. Sem nenhum dos
dois, mostra uma dica curta. Ele usa `CardFace detail="full"` + `CardDetails` + `sheetnotes` (as ligações), ou seja, o
miolo do `CardSheet` extraído, sem `scrim` nem `Backdrop`.

- O hover só existe com `(hover: hover) and (pointer: fine)`: iPad com dedo não tem hover. Os ouvintes são
  `onPointerEnter`/`onPointerLeave` nas cartas visíveis (zona, mão, topo do cemitério/banidas). Carta virada do oponente
  e verso do deck não mudam o painel.
- O clique segue o caminho de hoje (`tap`): escolha no tabuleiro tem prioridade, depois o clique fixa. Clicar de novo
  na carta fixada solta. `Esc` também solta: é o mínimo de teclado, para não prender a carta.
- Durante a encenação, o hover atualiza o painel (só leitura), mas o clique não fixa (igual ao `tap` de hoje).

### 4. Ações ancoradas na carta

`CardActions` fica dentro do `.duel`, em `position: absolute` (z 14: acima da mão, abaixo da trava da encenação e do
menu). Um portal no `body`, como a `fxlayer`, ficaria acima de tudo da tela, até do menu e do encerramento: o `.duel`
tem contenção de layout, que cria um contexto de empilhamento próprio. Como o `.duel` ocupa a tela inteira, as
coordenadas são as do `[data-loc=locKey(pinned)]` (`getBoundingClientRect`) menos as do `.duel`. A fileira de
`hud-btn act` fica centrada acima da carta e presa às bordas (`actionsPos`, pura e testada). Ela é medida de novo em
`resize`, a cada `board` novo e no `transitionend` (a carta da mão sobe). Os botões vêm do mesmo
`cardActions(prompt, ref)` + `iconFor`, sem lógica nova.

- *Alternativa*: botões dentro do `CardPanel`. Foi descartada porque o usuário pediu as ações sobre a carta, e assim o
  olho não precisa ir até a lateral para agir.
- Para uma zona do oponente (raro: Ativar algo que mira lá não abre ações nela), a fileira vai abaixo da zona se não
  couber acima.

### 5. Prompts e escolhas na coluna direita

Em tela larga, o `panel` (o `promptPanel` de hoje) e a `ChoiceBar` renderizam dentro da coluna direita, no lugar do
`CardPanel`. Enquanto há prompt, o painel da carta vira uma faixa compacta acima dele (nome + ATK/DEF da carta em foco),
para o hover continuar útil. "Ver campo" e a `peekbar` não existem em tela larga, porque o campo nunca fica coberto. A
`PileSheet`, o histórico, o menu e os diálogos de erro continuam modais, centrados e com largura máxima.

### 6. Encontro e diálogo: só CSS

Sob o `@media` de tela larga: o menu do encontro vira `flex-direction: row` com botões de `flex: 1` e altura igual. A
folha de baixo do `Dialogue` e a caixa de fala ficam com `max-width: ~880px`, centradas. Os tópicos (`.topicgrid`)
viram 3 colunas. As respostas de escolha (amizade/romance, `pick`) ficam em linha quando cabem.

## Risks / Trade-offs

- [Duas composições do duelo podem divergir] → Os dois layouts usam os mesmos componentes e o mesmo estado. O
  `WideLayout` só arruma o lugar de cada um. Os testes de unidade da tela rodam nos dois modos (mockando o
  `matchMedia`).
- [Ações ancoradas desalinhadas depois de animação ou rolagem] → Medir de novo nos eventos citados. O duelo não rola
  (`overflow: hidden`). Se o elemento sumir (a carta saiu da zona), soltar o `pinned`.
- [Trocar de orientação no meio do duelo (tablet)] → O `useWide` troca a composição. O estado vive no `DuelScreen`, e o
  Worker não é afetado. A encenação em andamento termina nos lugares novos, porque mede a cada beat. Isso precisa de
  teste manual girando o simulador de iPad.
- [Hover dispara re-render demais] → O `hover` guarda só o `ref`/`code`, e o `CardPanel` é memoizado por `code`.
- [Tela larga baixa, ex. 1280×720 com barras do navegador ~600 de altura] → O `min-height: 600px` do gatilho e a mão que
  encolhe primeiro (a regra atual) cobrem. O `layout-e2e` confere 1280×650.

## Migration Plan

Só front-end, sem save nem dados. O deploy é o normal pelo `wrangler`. Para desfazer, basta remover o `@media`/`useWide`
(o retrato é o layout padrão).
