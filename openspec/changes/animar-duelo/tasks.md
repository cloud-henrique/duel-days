# Tarefas

Pré-requisito: o change `polir-hud-duelo` aplicado. Ele traz o Vitest, a `DuelScreen` dividida em `src/screens/duel/`, o `CardFace`, as placas com popup de LP e o narrador na barra.

Regra deste change: **nenhuma mudança de comportamento sem um teste que a cubra antes**. Cada grupo traz os próprios testes.

## 1. Beats no motor

- [x] 1.1 Escrever os testes de caracterização do texto atual do narrador: para cada mensagem tratada hoje por `Narrator.describe`, o texto produzido. Verificar: `npm test` passa contra o código atual.
- [x] 1.2 Spike para ler o `reason` do `MSG_MOVE`, estendendo o parser do `ocgcore-wasm` (patch-package ou leitura do buffer cru). Verificar: um script em `proto/` imprime `reason` com DESTROY/BATTLE num duelo com batalha. Se não der, registrar a decisão de usar heurística no `design.md`.
- [x] 1.3 Definir `Beat`/`Step` em `src/engine/protocol.ts`. Criar `src/engine/beats.ts` com `toBeats`, `classifyMove` e `beatText`, todos testados por unidade com mensagens sintéticas (um caso por tipo da união, agrupamento de `MOVE`, cada regra de `classifyMove`). `beatText` deve passar nos testes do 1.1. Verificar: `npm test`.
- [x] 1.4 Fazer o `Narrator` usar `beats.ts`, guardando o retrato depois de cada beat que muda o tabuleiro. Trocar `events` + `shows` por `steps` nas mensagens `prompt`/`end`, e remover o `shows` e o texto duplicado do `describe`. Verificar: `tsc`, `npm test` e o histórico do duelo com os mesmos textos de antes.
- [x] 1.5 Validar os beats no `proto/monkey.ts` e no `proto/smoke.ts`:
  - localizações válidas;
  - o último `board` dos steps é igual ao `board` final;
  - a soma das travas do `PACING` por turno alerta acima de 15s.

  Feito em `proto/beat-check.ts`. A disposição do último retrato é comparada sem ATK/DEF (efeitos contínuos os recalculam
  em passos sem beat). Medido: 300/300 duelos, 0 lugares inválidos, 30 de 7.105 turnos acima de 15s (máx. 26,4s).

  Verificar: `npx tsx proto/monkey.ts 100` e `npx tsx proto/smoke.ts 500` passam.

## 2. Ritmo e fila (puros primeiro)

- [x] 2.1 Criar `anim/pacing.ts` (a tabela do design como dados com nome, mais `MAX_BLOCK_MS`) e `anim/effects.ts` (`effectFor(beat, { reducedMotion })`), com testes: um caso por beat, o "reduzir movimento" trocando por fade e nenhuma trava acima de 1,5s. Verificar: `npm test`.
- [x] 2.2 Criar `anim/queue.ts` (`runSteps` com `play` e `apply` injetados), com testes de relógio falso:
  - ordem;
  - `apply` depois de cada `play`;
  - 0,5×;
  - aceleração no meio;
  - `off` sem `play`;
  - abort aplicando o último tabuleiro;
  - beats simultâneos juntos.

  Verificar: `npm test`.
- [x] 2.3 Adicionar `settings: { anim, sound }` com `withDefaults(saved)` em `progress.ts`, com testes (save sem `settings`, parcial e completo), e os ajustes no `DuelMenu`. Verificar: `npm test`, e mudar para "rápida", recarregar e ver a escolha mantida.

## 3. Camada de animação

- [x] 3.1 Marcar com `data-loc` todos os lugares do tabuleiro (zonas, mão, faixa de versos, cemitério, placa, deck) a partir de uma única função `locKey(loc)`, que também é usada por `beats.ts`. Teste de unidade da `locKey`. Verificar: `npm test`, e no navegador `document.querySelectorAll('[data-loc]')` cobre todas as zonas dos dois lados.
- [x] 3.2 Criar o `useBeatQueue` (liga `runSteps` ao estado; `staging` trava a mão e os botões; toque para acelerar) e o `play.ts` com o voo do fantasma entre retângulos medidos e o fallback de fade. Verificar: com `anim: 'off'`, o `webkit-e2e.mjs` passa igual a antes; com `normal`, uma invocação da mão e uma destruição em batalha saem e chegam nos lugares certos com o campo inclinado.
- [x] 3.3 Adicionar ao `play.ts`, lendo o `effectFor`:
  - pilar de luz (invocar e equipar);
  - baixar;
  - giro 3D (`reveal`) e giro de 90° (`pos`).

  Verificar: os cenários "Invocação", "Baixar carta", "Virar carta" e "Mudança de posição" da spec no viewport de celular.
- [x] 3.4 Criar o `Splash` (destaque de ativação com halo pela cor de `frameOf`, substituindo o destaque atual) e a `ChainStack` (elo em resolução, negado e anulado). Teste de componente da `ChainStack` para as três marcas. Verificar: `npm test` e os cenários "Ativação" e "Resolução de corrente".
  Conferido no navegador: "Ativação" (halo magenta de Armadilha, giro 3D antes do destaque). A corrente de 2 elos não saiu em
  9 turnos de jogo automático: a pilha está coberta pelos testes (`ChainStack`, `nextChain`); conferir no teste em aparelho (6.2).
- [x] 3.5 Adicionar ataque (vetor entre centros medidos, flash e tremida), quebra na destruição, banimento, retorno à mão e retorno ao deck. Verificar: os cenários "Ataque", "Destruição" e "Banimento, retorno e equipamento".
  Conferido no navegador (medindo os fantasmas): ataque direto avançando até a placa com flash, e a quebra (flash, 4 pedaços,
  fantasma menor ao cemitério). Banimento e retornos não saíram no jogo automático; conferir no simulador (6.2).
- [x] 3.6 Criar o `Toss` (moeda e dado). Verificar: um duelo com Time Wizard (ou carta de moeda do pool) mostra o giro e o resultado em até 1,5s.
  Testes do `Toss` (moeda por resultado, legenda) e trava de 1,3s no `PACING`. O Mago do Tempo não chegou à mão em 10 turnos
  de jogo automático; conferir o giro na tela no simulador (6.2).
- [x] 3.7 Ligar o "reduzir movimento" (`matchMedia('(prefers-reduced-motion: reduce)')`) ao `effectFor`. Verificar: emular a preferência no Playwright e conferir o cenário "Ataque com reduzir movimento".
  Conferido com `node proto/webkit-e2e.mjs <url> normal --reduzir --turno`: 0 de 6 efeitos com deslocamento/giro/escala, ataque
  só com o flash no alvo, sem pilar; sem `--reduzir`, 5 de 5 se movem.

## 4. Sons

- [x] 4.1 Converter os `.caf` do nativo com `afconvert` para `public/sounds/*.m4a`: comprar, invocar, baixar, virar, ativar, atacar, dano, cura, destruir, fim de turno, moeda, vitória e derrota. Registrar a origem no README. Verificar: os arquivos tocam no Safari e no Chrome, e o total fica abaixo de 3 MB.
  Feito com `scripts/copy_sounds.py` (13 sons, 111 KB, AAC mono). Os sons são do Tag Force: ficam fora do git (decisão do
  usuário; ver `design.md`, item 6). Origem registrada no README (pipeline e direitos). Tocar no Safari/Chrome: ver 4.2.
- [x] 4.2 Criar `src/audio/sfx.ts`:
  - `AudioContext` liberado no primeiro toque;
  - buffers decodificados;
  - volumes do nativo;
  - `shouldPlay` (anti-repetição de 60ms) testada por unidade;
  - silenciar por `settings.sound`.

  Os sons vêm do campo `sound` de `effectFor`. Verificar: `npm test`; no simulador de iOS, os sons tocam depois do primeiro toque; com o som desligado, nenhum toca.

  Conferido: `npm test` (`shouldPlay`); no navegador, os 13 sons decodificam depois do primeiro toque e nenhum toca com o som
  desligado; no Safari do simulador de iOS (log do `?debug=1`), o contexto passa de `suspended` a `running` no primeiro toque e
  o primeiro som toca ao entrar no duelo. O desbloqueio fica no `main.tsx` (qualquer toque no app, já na história).

## 5. Abertura e fim

- [x] 5.1 Criar a `Intro` (moeda, faixas com retrato e nome, "DUELO!"), que segura a fila até terminar. Teste de componente: o toque pula e chama `onDone`, e com `anim: 'off'` ela não aparece. Verificar: `npm test` e os cenários "Abertura completa" e "Pular abertura".
  Conferido no navegador: abertura completa (moeda em quem joga o turno 1, que é sempre o jogador neste motor; faixas;
  "DUELO!") e a fila só começa depois dela. Testes: toque pula e chama `onDone` uma vez; ~2,9s; `wantsIntro('off')` falso.
- [x] 5.2 Criar o `Outro` ("VITÓRIA!", "DERROTA" ou "EMPATE", com pulo do vencedor e perdedor esmaecido), mantendo os botões atuais de saída. Teste de componente: o título por resultado. Verificar: `npm test`, e ganhar e perder um duelo voltando para a história.
  Conferido no navegador: desistir mostra "DERROTA" com o perdedor esmaecido e o vencedor em destaque, e "Continuar" volta
  à história. A vitória e o empate estão cobertos pelos testes do título; ver a vitória na tela no teste em aparelho (6.2).

## 6. Integração

- [x] 6.1 Rodar `npx tsc --noEmit`, `npm test`, `npx tsx proto/monkey.ts 100`, `npx tsx proto/smoke.ts 500`, `node proto/webkit-e2e.mjs` e `node proto/layout-e2e.mjs`. Verificar: todos passam.
  Resultado: `tsc` e 201 testes ok; monkey 300/300 (0 lugares inválidos; aviso de 30 de 7.105 turnos acima de 15s);
  smoke 500/500; `webkit-e2e.mjs` e `layout-e2e.mjs` ok.
- [ ] 6.2 Testar no simulador de iOS e no iPhone 11 Pro físico pelo túnel: um duelo inteiro em velocidade normal, sem travadas perceptíveis e sem o jogo preso numa animação. Verificar: anotações e prints no PR.
  Parcial (sem o iPhone físico): `node proto/duel-e2e.mjs` jogou duelos inteiros no WebKit na velocidade normal, todos até o fim
  e sem erros (VITÓRIA nos turnos 9 e 15, DERROTA nos turnos 6, 8, 10 e 12; maior encenação contínua 12,9s; com `--reduzir`,
  VITÓRIA no turno 7, 6,2s). As paradas que apareceram eram do roteiro (folha sem ação conhecida, corrente obrigatória) e foram
  corrigidas nele. No Safari do simulador de iOS: abertura, áudio liberado no primeiro toque e invocação. Falta o iPhone 11 Pro.
- [x] 6.3 Atualizar o `docs/HANDOFF.md` (animações, preferências, sons) e o `CLAUDE.md`:
  - protocolo `steps`;
  - `data-loc`/`locKey`;
  - `PACING` como única fonte de tempos;
  - armadilha do áudio no iOS.

  Verificar: as seções refletem o código.
  Feito: `CLAUDE.md` (protocolo `steps`, `beats.ts`/`locKey`, `anim/`, `PACING` como fonte única, áudio no iOS, sons fora do git,
  `copy_sounds.py`, `duel-e2e.mjs`) e `docs/HANDOFF.md` (estado, produção, próximos passos).

## Workflow follow-up

- Arquivar o change depois do teste no iPhone.
- Calibrar os tempos no `PACING` depois de alguns duelos reais (questão aberta do design).
