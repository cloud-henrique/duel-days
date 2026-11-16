# Design

## Context

O motivo do change está em `proposal.md` (Why). Abaixo, o estado do código que condiciona o desenho.

- `DuelDriver.run()` (`src/engine/driver.ts`) avança o motor até o próximo pedido ao jogador 0 ou até o fim. No
  caminho, responde pela CPU e devolve uma única mensagem: `{ board, events: string[], shows }`.
  - `board` é o retrato **final**, feito por `narrator.snapshot`.
  - `shows` são as últimas 3 ativações (`CHAINING`), usadas pelo destaque central atual.
  - Uma resposta pode, portanto, conter o turno inteiro da CPU.
- O motor roda num Worker. O mesmo `DuelDriver` roda em Node (`proto/monkey.ts`) e na thread principal
  (`?engine=inline`).
- As mensagens do `ocgcore-wasm` (tipos em `node_modules/ocgcore-wasm/dist/index.d.ts`) trazem, entre outras:
  - `MOVE`: `card`, `from: OcgLocPos` e `to: OcgLocPos`. **Sem `reason`**: o core manda, mas o parser do pacote
    descarta.
  - `POS_CHANGE`: `prev_position` e `position`.
  - `SUMMONING`, `SPSUMMONING`, `FLIPSUMMONING`, `SET`, `DRAW`.
  - `CHAINING` (código e zona), `CHAIN_SOLVING`, `CHAIN_SOLVED`, `CHAIN_NEGATED`, `CHAIN_DISABLED`, `CHAIN_END`.
  - `ATTACK` (atacante e alvo ou `null` para ataque direto), `BATTLE`.
  - `DAMAGE`, `RECOVER`, `PAY_LPCOST`, `LPUPDATE`.
  - `EQUIP` (carta e alvo), `TOSS_COIN`, `TOSS_DICE`, `NEW_TURN`, `NEW_PHASE`, `WIN`.
- Pelo `polir-hud-duelo`, a tela terá:
  - a `DuelScreen` dividida em `src/screens/duel/` (`useDuelEngine`, `Field`, `Hand`, `Plate`, `PhaseBar`);
  - o `CardFace`;
  - as métricas como tokens CSS;
  - o Vitest;
  - placas com o popup de LP e a contagem;
  - o narrador na barra de fases.
- O texto do narrador hoje é montado em `Narrator.describe` (um `switch` sobre as mensagens), e o `shows` é uma lista
  paralela só para as ativações.
- Referência de tempos e efeitos: `duel-academy/App/DuelAcademy/Duel/DuelPresentation.swift`, `DuelViewModel.swift`
  (`stage`, `DuelPacing`) e `Duel/Board/{AttackLunge,SummonGlow,ActivationSplash,ChainStack,DuelIntro,CoinToss,DieRoll}.swift`,
  além de `Duel/DuelEndOverlay.swift`.

## Goals / Non-Goals

**Goals:**

- Cada acontecimento relevante do motor fica visível, na ordem certa, inclusive no turno da CPU.
- Os tempos ficam próximos aos do nativo, com nenhuma animação isolada travando o jogo por mais de 1,5s, exceto a
  abertura.
- Com as animações desligadas, ou com "reduzir movimento", o duelo funciona igual e sem esperas.

**Non-Goals:**

- Partículas complexas, shaders ou WebGL: só CSS e Web Animations API.
- Animações fora do duelo (loja, mapa, deck builder).
- Vibração no iOS: não há API.
- Vozes dos personagens (o nativo tem; podem vir depois).

## Decisions

### 1. O driver devolve uma lista de beats, cada um com o tabuleiro logo depois

O `Narrator` passa a emitir `Beat`. É uma união discriminada com **um tipo por acontecimento visível**. Não há
sobreposição: invocar, baixar e equipar não são também um `move` genérico.

```ts
type Beat =
  | { k: 'draw'; p: Side; count: number }
  | { k: 'summon'; from: Loc; to: Loc; code: number; how: 'normal' | 'special' | 'flip' }
  | { k: 'set'; from: Loc; to: Loc }
  | { k: 'move'; from: Loc; to: Loc; code: number; why: 'destroy' | 'grave' | 'banish' | 'hand' | 'deck' | 'other' }
  | { k: 'pos'; at: Loc; code: number; reveal: boolean; defense: boolean }   // reveal: virou de face para cima
  | { k: 'activate'; at: Loc; code: number; p: Side }
  | { k: 'chainSolve'; link: number; result: 'ok' | 'negated' | 'disabled' }
  | { k: 'attack'; from: Loc; to: Loc | null }
  | { k: 'lp'; p: Side; delta: number }
  | { k: 'equip'; from: Loc; to: Loc; target: Loc; code: number }
  | { k: 'toss'; what: 'coin' | 'dice'; p: Side; results: number[] }
  | { k: 'turn'; p: Side; n: number }
  | { k: 'phase'; phase: OcgPhase };
interface Step { beat: Beat; board?: Board }   // board: só nos beats que mudam o tabuleiro
```

- **Ajustes da implementação (tarefa 1.3)**, para o texto do narrador sair só do beat: `draw` leva `codes` (o texto
  do jogador nomeia cada carta), `attack` e `equip` levam o `code` (consultado no motor), `lp` leva `why`
  (`damage`/`recover`/`cost`), `chainSolve` leva `of` (tamanho da corrente, para tocar a pilha só com 2+ elos) e há um
  beat `win`. `Loc` é `{ p, zone, seq }`, com `zone` em texto (`hand`, `mzone`…; `none` para ficha criada). O
  `Step` ganha `together` para os movimentos consecutivos do mesmo momento.
- **O texto sai do beat.** Uma função pura `beatText(beat, name)` substitui o `switch` de texto do `describe`. Ela é a
  única fonte do narrador e do histórico. Os textos atuais são preservados por testes de caracterização escritos antes
  da troca.
- O `shows` (lista paralela de ativações) deixa de existir, porque `activate` é um beat.
- A mensagem `prompt`/`end` ganha `steps: Step[]` no lugar de `events` + `shows`, e o `board` final continua no mesmo
  lugar.
- Mensagens consecutivas do mesmo momento entram como um beat só. Por exemplo, vários `MOVE` para o cemitério no fim
  de uma corrente viram um `move` por carta, tocados juntos (ver item 3).
- **Divisão:** o `Narrator` (56 linhas) já tem estado de LP, turno, fase e retrato. A tradução de mensagem para beat
  fica num módulo puro, `src/engine/beats.ts`, com as funções `toBeats(msg, ctx)` e `classifyMove`. Assim ela pode ser
  testada sem WASM, com mensagens sintéticas, e o `Narrator` só orquestra.

- **Decisão da implementação (tarefa 1.4): o retrato é por passo do motor.** A consulta ao motor só vê o estado do fim
  de cada passo (`step()`), e um passo traz várias mudanças de uma vez (ex.: 6 destruições e a Magia indo ao cemitério).
  Por isso só o **último beat de cada passo** leva o `board`; a tela anima o grupo a partir do tabuleiro anterior e
  aplica o novo no fim dele. Os demais beats do passo não têm `board`.
- **Decisão da implementação (tarefa 1.4): os `steps` substituem os quadros (`frames`).** O mecanismo de quadros com
  a pausa de 700ms por jogada da CPU (`screens/duel/pacing.ts`), que entrou depois deste design, sai. O driver marca
  com `think: true` o primeiro beat depois de cada resposta da CPU (no turno dela, ou uma ativação dela no turno do
  jogador), e a fila espera o tempo de "pensar" antes dele. Esse tempo passa a morar no `PACING` (`PACING.think`).
  Até a fila do grupo 2 existir, a tela toca os steps com as pausas de hoje.
- *Por que o tabuleiro em cada beat:* a tela anima a partir da posição medida no tabuleiro anterior e só então aplica
  o tabuleiro seguinte. Não precisa reconstruir o estado com deltas na interface, e o motor já sabe o estado exato.
  Um retrato tem ~40 cartas, e um turno de CPU dá ~10–40 beats, o que é pouco para `postMessage`.
- *Alternativa:* deltas aplicados na tela. Foi descartada porque duplica regras de zona (sequências, overlays, fichas)
  na interface.
- *Alternativa:* um round-trip ao Worker por ação da CPU, como o nativo. Foi descartada porque muda o protocolo e o
  driver, e a fila faz o mesmo papel.

### 2. Motivo do movimento (`why`)

Destruir e enviar ao cemitério são o mesmo `MOVE` (campo → cemitério); a diferença está no `reason`, que o pacote
descarta. Ordem de preferência:

1. **Ler o `reason`** estendendo o parser do pacote: `patch-package`, ou ler o buffer cru do `MSG_MOVE`, em que
   `reason: uint32` vem logo depois de `to`. Uma tarefa de spike confirma a viabilidade.
2. **Fallback por heurística:**
   - `MOVE` campo → cemitério logo depois de `BATTLE` ou dentro da resolução de um elo é `destroy`;
   - na Main Phase, com `SUMMONING` em seguida, é `grave` (tributo);
   - mão → cemitério é `grave` (descarte).

**Resultado do spike (tarefa 1.2): opção 1 adotada.** O patch do `ocgcore-wasm` (`patches/`) passou a ler
`reason: u32` depois de `to` no `MSG_MOVE` (e o tipo `OcgMessageMove` ganhou o campo). O `proto/move-reason.ts`
confirmou em 30 duelos: 1.604 `MOVE`, todos com `reason`, com `DESTROY|BATTLE`, `DESTROY|EFFECT`,
`RELEASE|MATERIAL|SUMMON` (tributo), `EFFECT|DISCARD` e `COST|DISCARD` bem separados. A heurística acima fica só como
reserva, sem uso. Regra do `classifyMove` para o cemitério: com `REASON_DESTROY` é `destroy`; senão é `grave`.

O resto vem direto das localizações:

- deck → mão é `draw`;
- campo → mão é `hand`;
- para `REMOVED` é `banish`;
- para o deck é `deck`.

### 3. Fila de animação na tela

A lógica da fila é uma função pura de agendamento, `runSteps(steps, { play, apply, speed, signal })`, em
`src/screens/duel/anim/queue.ts`. O `play` é injetado, e isso é o que permite testá-la com relógio falso sem DOM nem
Web Animations. Na tela, um hook fino (`useBeatQueue`) só liga a fila ao estado do React. Não há classe nem
"engine" de animação. A fila recebe `steps` e toca um por vez; beats marcados como simultâneos (os `move` de um mesmo
momento) tocam juntos:

```
para cada step:
  rects = medir origem/destino no DOM (data-loc="p:loc:seq" em zonas, mão, cemitério, deck, placas)
  await play(beat, rects, speed)            // Web Animations API; retorna Promise; play é injetado
  se step.board: apply(step.board)          // estado novo; o fantasma some quando a carta real aparece
  narrador.push(beatText(step.beat))
no fim: mostrar o prompt (botões e mão liberados)
```

- Durante a fila, a mão e os botões ficam travados (estado `staging`) e um toque em qualquer lugar acelera.
- **Medição:** cada lugar do tabuleiro recebe `data-loc`. O retângulo é medido com `getBoundingClientRect`, que já
  inclui a perspectiva do campo inclinado. A carta fantasma voa numa camada fixa acima de tudo (`position: fixed`), de
  um retângulo ao outro. Quando a origem não está visível, ela sai da placa do duelista: o deck usa a placa do dono, e
  a mão do oponente usa a faixa de versos.
- **Velocidade:**
  - normal: 1×;
  - rápida: 0,5×;
  - desligada: aplica os tabuleiros sem animar, só atualiza o narrador e o LP.

  O toque durante a fila passa a velocidade para 0,25× até o fim da fila atual. "Reduzir movimento"
  (`prefers-reduced-motion`) troca as animações de deslocamento por fades curtos.
- **Proteção:** se o duelo terminar, der erro ou o jogador desistir, a fila é cancelada (`AbortController`) e o último
  tabuleiro é aplicado. O watchdog atual continua valendo.

### 4. Tabela de efeitos

Os tempos abaixo estão em velocidade 1×. "Trava" é o tempo em que a fila espera antes do próximo beat.

Os números moram **num único lugar**: `PACING` em `src/screens/duel/anim/pacing.ts`, com nomes como
`PACING.summon.flight` e `PACING.summon.block`. Os outros parâmetros também ficam ali, com nome:
- recuo e avanço do ataque;
- amplitudes da tremida;
- escala do destaque;
- intervalo anti-repetição dos sons.

A fila lê a trava de lá e os efeitos leem as durações de lá. As keyframes de CSS **não** carregam durações; quem
dispara é a Web Animations API com valores do `PACING`, para não duplicar números entre CSS e TS. A tabela abaixo é
a especificação do conteúdo inicial do `PACING`.

| Beat | Visual | Duração (trava) | Som |
|---|---|---|---|
| draw | fantasma (verso) sai da placa e entra na mão; o leque se reorganiza | 350ms (300) | draw |
| summon | voo até a zona, depois o pilar de luz (degradê amarelo → laranja, `mix-blend-mode: plus-lighter`, sobe de 5% a 100% e some) | voo 400 + pilar 750 (650) | summon |
| set | voo até a zona, com giro de 90° se for monstro; face para baixo | 400 (400) | set |
| pos (`reveal`) | **giro 3D** em Y (`rotateY` 0 → 180 com troca de face no meio) e, se mudar de posição, giro de 90° junto | 450 (450) | flip |
| pos (só posição) | giro de 0 ↔ 90° | 350 (350) | — |
| activate | destaque central (`CardFace` full, 180pt) com halo na cor do tipo, escala de 0,6 a 1 com mola | 1100 (650 para M/A; 400 para efeito de monstro) | activate |
| chainSolve | pilha à esquerda; o elo atual cresce 1,15× com contorno amarelo; risco vermelho se negado; "sem efeito" se anulado | 700 por elo, só com 2+ elos (700) | — |
| attack | atacante: recuo de −8%, avanço até +85% do vetor entre o centro do atacante e o do alvo, ambos **medidos no DOM** (ou o centro da placa do oponente no ataque direto), volta; escala 1,2; flash branco no alvo e tremida da tela (x 9, −7, 5, −2, 0) | 560 (440) | attack no impacto |
| lp | popup e contagem já existentes na placa (`polir-hud-duelo`) | 1200 (0, corre em paralelo) | damage / heal |
| move destroy | **quebra**: flash vermelho-branco, a carta se parte em 4 pedaços (`clip-path`) que se afastam e somem; depois um fantasma pequeno voa até o cemitério | 300 + 400 (650) | destroy |
| move grave/hand/deck | voo direto até o destino (deck: até a placa, com fade) | 400 (350) | grave: —; hand: draw |
| move banish | a carta encolhe com fade e brilho frio | 350 (300) | destroy |
| equip | voo até a zona M/A, depois o pilar sobre o monstro equipado | 400 + 750 (650) | activate |
| toss | moeda em `rotateY` (3 voltas + ½ para coroa) ou dado girando; depois a legenda | 900 + 400 (1300) | coin-toss |
| turn | borda da placa ativa, chip e narrador (já no HUD) | 0 (0) | end-turn |

A trava máxima por beat é de 1,3s (moeda), dentro do teto de 1,5s. Um teste de unidade percorre o `PACING` e garante
que nenhuma trava passe de `MAX_BLOCK_MS = 1500`.

A escolha do efeito é uma função pura, `effectFor(beat, { reducedMotion })`, que devolve
`{ kind, durations, block, sound }` a partir do `PACING`. Com "reduzir movimento", ela devolve `kind: 'fade'` para
voo, avanço, giro 3D e quebra, e zera a tremida. Isso concentra a regra de acessibilidade num lugar testável, em vez
de `if`s espalhados pelos componentes.

### 5. Abertura e fim

**Abertura**, num componente sobreposto no início do duelo:

1. moeda (quem começa);
2. faixas com retrato e nome entram dos lados (mola de 0,45s);
3. "DUELO!" com escala de 3 a 1 (mola de 0,35s);
4. saída com fade.

Dura ~2,9s. Um toque pula, e o motor só começa a tocar beats depois da abertura. Com animações desligadas, ela é
pulada.

**Fim:** fundo escuro com degradê radial na cor do resultado e o título "VITÓRIA!", "DERROTA" ou "EMPATE" com escala de
2,2 a 1. O retrato do vencedor dá um pulo (−10pt) e o do perdedor fica a 50%. Os botões atuais de saída ficam abaixo.

### 6. Sons

- Origem: os `.caf` do nativo em `duel-academy/App/DuelAcademy/Sounds/`, convertidos com `afconvert` para AAC `.m4a`
  (Safari e Chrome tocam) em `public/sounds/` pelo `scripts/copy_sounds.py`.
- **Correção da implementação (tarefa 4.1):** os efeitos do nativo não são livres: desde 28/10 vêm do *ARC-V Tag Force
  Special* (Konami). Por decisão do usuário, ficam os mesmos sons, **fora do git** (`public/sounds/` no `.gitignore`, como
  a arte), e vão para produção pelo `dist/`. São 13 arquivos, ~111 KB no total, e entram na pré-carga do PWA (offline).
- Reprodução: um `AudioContext` com buffers decodificados. O contexto é liberado no primeiro toque do jogador, porque
  o iOS exige um gesto.
- O mesmo som não se repete em menos de 60ms. Os volumes são os do nativo (fim de turno a 0,7).
- Opções no save: `sound: boolean`, com padrão ligado.
- *Alternativa:* `HTMLAudioElement`. Foi descartada por causa da latência e do limite de reprodução simultânea no iOS.

### 7. Preferências no save

`progress.ts` ganha `settings: { anim: 'normal'|'fast'|'off'; sound: boolean }`. Quando falta (save antigo), vale o
padrão (`normal`, `true`); não há migração destrutiva. A leitura passa por uma função pura,
`withDefaults(saved)`, que é testada. O menu do duelo (do `polir-hud-duelo`) ganha os dois ajustes, além do
"Desistir".

### 8. Módulos

Os arquivos só são criados quando há código para eles; cada um tem uma responsabilidade:

```
src/engine/beats.ts              puro: toBeats, classifyMove, beatText (sem WASM)
src/screens/duel/anim/
  pacing.ts                      PACING + MAX_BLOCK_MS (só dados)
  effects.ts                     puro: effectFor(beat, opts)
  queue.ts                       puro: runSteps(steps, { play, apply, speed, signal })
  useBeatQueue.ts                liga a fila ao React (staging, toque para acelerar)
  play.ts                        Web Animations: voo, pilar, giro, ataque, quebra (lê effectFor)
  Ghost.tsx, Splash.tsx, ChainStack.tsx, Toss.tsx    camadas visuais
  Intro.tsx, Outro.tsx           abertura e fim
src/audio/sfx.ts                 AudioContext, unlock, throttle (puro: shouldPlay(name, now, last))
```

O `play.ts` é o único arquivo que conhece a Web Animations API e o DOM medido. O resto é testável em `node`.

- *Não fazer:* um sistema genérico de "timeline" ou de plugins de efeito. Os efeitos são uma tabela fechada; um
  `switch` em `play.ts` sobre `effectFor(...).kind` basta.

### 9. Testes

Cada feature nova entra com teste de unidade (Vitest, configurado no `polir-hud-duelo`):

| Unidade | O que o teste cobre |
|---|---|
| `beatText` | caracterização: os textos atuais do narrador para cada mensagem, escritos **antes** de trocar o `describe` |
| `toBeats` | mensagens sintéticas → beats, um caso por tipo da união, incluindo o agrupamento de `MOVE` simultâneos |
| `classifyMove` | `reason` (se o spike der certo) e cada regra da heurística: batalha → destroy, tributo, descarte, banir, mão, deck |
| `effectFor` | um caso por beat; o "reduzir movimento" troca por fade; o teto de 1,5s vale para todo o `PACING` |
| `runSteps` | ordem; `apply` chamado depois de cada `play`; velocidade 0,5×; aceleração no meio da fila; `off` sem `play`; abort aplica o último tabuleiro |
| `withDefaults` | save sem `settings`, parcial e completo |
| `shouldPlay` | anti-repetição de 60ms por som, sons diferentes não se bloqueiam |
| `Intro` / `Outro` (componente) | o toque pula a abertura e chama `onDone`; o título certo para vitória, derrota e empate |

Os testes de integração continuam nos scripts de `proto/` (item 1.4 das tarefas). Eles cobrem os beats com o motor
real e o fluxo no WebKit.

## Risks / Trade-offs

- **`reason` indisponível no pacote** → a heurística do item 2 pode errar destruição contra envio ao cemitério em
  casos raros. O efeito do erro é visual (quebra ou só voo), sem impacto de regra. O spike decide.
- **Turno longo da CPU** (muitos beats) → a velocidade rápida e o toque para acelerar resolvem. O `monkey.ts` mede a
  duração total de beats por turno com os tempos da tabela e alerta acima de 15s.
- **Retângulo errado quando a carta muda de lugar no mesmo beat** (ex.: fichas, Scapegoat) → os retângulos são medidos
  antes de aplicar o tabuleiro e, quando não há origem, a carta aparece com fade, sem voo.
- **Desempenho no iPhone 11 Pro** com flash, tremida e fantasmas → as animações são só de `transform` e `opacity`,
  numa camada isolada (`will-change` apenas durante a animação). A medição é feita no aparelho físico.
- **Áudio no iOS em modo silencioso** → o Web Audio segue a chave de silencioso do iPhone. Isso é aceitável e fica
  documentado.
- **Payload maior** por causa dos retratos por beat → só os beats que mudam o tabuleiro carregam retrato. Se passar de
  ~200 KB por mensagem, a solução é reduzir o retrato a deltas de zona.

## Migration Plan

Depende do `polir-hud-duelo` já aplicado. Sai num único deploy, e o save antigo funciona com os padrões. Para
reverter, basta um revert do commit. O protocolo é interno ao app (Worker e tela vêm do mesmo build), então não há
versão mista.

## Open Questions

- Calibração fina dos tempos depois de jogar alguns duelos (os números da tabela são o ponto de partida).
