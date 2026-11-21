# Tasks

## 1. Gatilho de tela larga

- [x] 1.1 Criar `src/ui/wide.ts` com `WIDE_QUERY` (`(orientation: landscape) and (min-width: 900px) and (min-height: 600px)`) e o hook `useWide()` (`matchMedia` + ouvinte de `change`, `false` sem `matchMedia`). Verificar com um teste Vitest que troca o valor quando a consulta muda.
- [x] 1.2 Criar o teste `src/ui/wide.test.ts`, que lê os CSS de `src/` e falha se algum `@media` com `min-width: 900px` não usar exatamente a string do `WIDE_QUERY`. Verificar com `npm test`.
- [x] 1.3 Registrar o gatilho no CLAUDE.md (Arquitetura → `src/ui/`, e uma armadilha: "tela larga só pelo `WIDE_QUERY`/`useWide`") e verificar que o texto bate com o código.

## 2. Encontro e diálogo em tela larga

- [x] 2.1 No `campaign.css`/`styles.css`, sob o `@media` de tela larga: menu do encontro em linha (botões de `flex: 1`, mesma altura), caixa de fala e folha de baixo do `Dialogue` com largura máxima (~880px) e centralizadas, `.topicgrid` em 4 colunas (os 4 temas numa linha), respostas de escolha em linha quando couberem. Verificar no navegador em 1440×900 (`?campaign=bond`): Conversar/Duelar/Voltar numa linha só.
- [x] 2.2 Conferir que o retrato não mudou: em 390×844, o menu continua em coluna. Comparar capturas antes/depois no navegador.

## 3. Composição do duelo em três colunas

- [x] 3.1 Separar no `DuelScreen` o ramo de retrato (o JSX de hoje, com as peças em variáveis comuns aos dois layouts) sem mudança de comportamento. Verificar com `npx tsc --noEmit`, `npm test` e `node proto/layout-e2e.mjs`, sem diferença nos 5 viewports.
- [x] 3.2 Criar o ramo de tela larga (grade `.duel.wide`): coluna esquerda com `DuelMenu` + placa do oponente em cima, histórico recente no meio e placa do jogador embaixo; centro com `FoeHand`, `Field` e `Hand`; coluna direita com o painel e o botão de fase (`sideActions`) no pé. O `DuelScreen` escolhe pelo `useWide()`. Verificar no navegador em 1440×900 com `?campaign=…`: duelo jogável até o fim.
- [x] 3.3 Bloco `.duel.wide { … }` de tokens no topo do `duel.css`: `--wide-side`, `--zone-h` só pela altura, `--hand-max` maior, mão que encolhe antes das zonas. Verificar em 1440×900, 1280×650 e 1024×768 que nada transborda e que a zona tem ≥ 46pt.
- [x] 3.4 Histórico recente na coluna esquerda (as últimas linhas do `log`, a mais nova embaixo, sem rolagem manual). Verificar que uma invocação do oponente aparece por último.
- [x] 3.5 Estender o `proto/layout-e2e.mjs` com os viewports 1440×900, 1280×650 e 1024×768 (placas nas colunas, campo centrado, sem transbordar) e conferir que 844×390 continua no retrato. Verificar rodando o script.

## 4. Painel da carta, hover e fixar

- [x] 4.1 Extrair do `CardSheet` o miolo (face + `CardDetails` + notas) para um componente reaproveitado pela folha e pelo `CardPanel`. O `CardSheet` do retrato fica igual. Verificar com `npm test` e `?cardfaces`.
- [x] 4.2 `CardPanel` na coluna direita: mostra `hover ?? pinned` e uma dica sem carta, sem véu nem `Backdrop`. Clicar em outra carta troca, clicar de novo na fixada solta, Esc solta, e nada fixa durante a encenação. Verificar com teste de componente do `CardPanel` e, para fixar/soltar/Esc, no navegador.
- [x] 4.3 Hover: um ouvinte `pointerover` na tela de duelo acha a carta pelo `data-loc` (`cardAtLoc`: zona, mão, topo de Cemitério/Banidas), só com `(hover: hover) and (pointer: fine)`. Carta virada do oponente e verso não mudam o painel. Verificar com teste de unidade do `cardAtLoc` e no navegador.

## 5. Ações sobre a carta

- [x] 5.1 `CardActions` dentro do `.duel` (`position: absolute`, abaixo da trava da encenação e do menu): mede o `[data-loc]` da carta fixada, põe a fileira de `hud-btn act` acima (ou abaixo, sem espaço) e mede de novo em `resize`, a cada board novo e no fim do lift da mão. Solta o `pinned` se o elemento sumir. Usa `cardActions` + `iconFor`, sem lógica nova. Verificar no navegador: Invocar/Baixar acima da carta erguida e Atacar acima da zona na Battle Phase.
- [x] 5.2 Teste de unidade da posição (função pura: retângulo da carta + viewport → topo/esquerda, com o caso "sem espaço acima"). Verificar com `npm test`.

## 6. Pedidos do duelo na coluna direita

- [x] 6.1 Em tela larga, renderizar o `promptPanel` e a `ChoiceBar` na coluna direita (sem `scrim.uphand`), com a carta em foco compacta acima. Sem "Ver campo" e sem `peekbar`. `PileSheet`, histórico, menu e erros continuam modais, com largura máxima. Verificar no navegador com uma corrente real (o painel é o mesmo `promptPanel` do retrato, já coberto pelos testes do `prompt.ts`) e pelo `duel-e2e --larga`.

## 7. Integração

- [x] 7.1 Rodar `npx tsc --noEmit`, `npm test`, `npx vite build` e `node proto/layout-e2e.mjs` sem falhas.
- [x] 7.2 Rodar `node proto/duel-e2e.mjs` com a viewport de 1440×900 (acrescentar o parâmetro se o script não tiver) e conferir que nenhuma encenação fica presa e que os fantasmas saem e pousam nas placas e pilhas novas.
- [ ] 7.3 No simulador de iPad, girar no meio do duelo e voltar: o layout troca e o duelo continua do mesmo ponto. No iPhone em retrato, nada muda.

## Workflow follow-up

- Deploy pelo `wrangler` depois do push (o comando está no CLAUDE.md).
- Arquivar a change (`/opsx:archive`) depois de conferida em produção no desktop.
