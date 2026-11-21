# Design

## Context

- **Regras de hoje**:
  - o duelo roda em `MODE_MR1`, com LP 8000 e mão de 5;
  - os valores estão espalhados: `session.ts`, `driver.ts`, `narrator.ts`, `track.ts`, `balance.ts` e `lp.ts`;
  - as regras do deck (40–60, Extra ≤ 15) estão em `src/game/decks.ts`;
  - o botão de fase e os chips (`prompt.ts`) contam com a Main 2.
- **A `tabuleiro-plano`** está implementada no diretório de trabalho, sem commit:
  - campo plano;
  - fileira de pilhas de 5 colunas, com Campo, Extra, Banidas, Cemitério e Deck;
  - `removed` e `extra` no `PlayerBoard`;
  - `PileSheet`;
  - placa de 48;
  - voos pelas pilhas;
  - as medidas no `duel.css`.

  Falhou só no iPhone SE: a carta ficou com 35pt.
- **O ocgcore tem o modo Speed** (`OcgDuelMode.MODE_SPEED`): 3 colunas no campo e sem Main Phase 2. O LP e a mão
  inicial são parâmetros da criação do duelo (`startingLP`, `startingDrawCount`), não do modo.
- **A campanha guarda tudo** (coleção, decks, DP, laços) num `CampaignState` com `version: 1`. O `migrate` do
  `progress.ts` já descarta uma campanha de versão desconhecida e mantém o perfil.

## Goals / Non-Goals

**Goals:**

- Um único módulo com as regras do formato, lido por motor, tela, editor e campanha.
- Tabuleiro em retrato com cartas bem maiores que hoje em todos os viewports medidos, iPhone SE incluso.
- Reaproveitar o código da `tabuleiro-plano` sem refazer o que já funciona.

**Non-Goals:**

- **Skills**: ficam para outra change, se um dia vierem.
- **Lista de cartas oficial do Speed Duel**: o pool continua o da era DM.
- **Migrar campanhas em andamento**: a campanha recomeça, por escolha do usuário.
- **Mão cortada pela borda inferior**, como no Duel Links: continua fora.
- **Mudar a economia de DP e os pacotes** (5 cartas, 4+1): só o começo da campanha muda.

## Decisions

### 1. Um módulo de formato

`src/game/format.ts` exporta um objeto `FORMAT` com:

- `mode`: `MODE_SPEED`;
- `lp`: 4000;
- `hand`: 4;
- `columns`: as sequências de zona em jogo;
- `mainMin`: 20, `mainMax`: 30, `extraMax`: 5, `maxCopies`: 3.

O que lê dele:

- **Motor**: `session.ts` (padrões de `flags`, LP e mão), `driver.ts`, `narrator.ts` e `track.ts`.
- **Tela**: `lp.ts` (`START_LP`).
- **Regras do deck**: `decks.ts` (troca `MAIN_MIN`/`MAIN_MAX`/`EXTRA_MAX`).
- **Campanha**: `balance.ts` (`startingLifePoints`).

Os quebra-cabeças de teste usam o mesmo padrão. Testes que dependiam de 5 colunas ou de 8000 são reescritos.

**Alternativa descartada**: manter os dois formatos atrás de uma opção. O usuário quer só Speed, e dois formatos dobram
o balanceamento.

### 2. Colunas em jogo

No modo de 3 colunas, o EDOPro só deixa usar as colunas do meio: `mzone` e `szone` 1, 2 e 3. A Zona de Campo continua
sendo a `szone` 5. A primeira tarefa confirma isso num quebra-cabeça.

- A tela desenha só essas três (`FORMAT.columns`). O `data-loc` continua sendo `p:mzone:seq` com a sequência do motor,
  então a encenação e o `beat-check` não mudam.
- O `PlayerBoard` segue com os arrays de 5 (as posições 0 e 4 vêm vazias). Assim o protocolo não muda.
- `prompt.ts`, `choice.ts` e a CPU não supõem colunas: trabalham pela sequência que o motor manda.

### 3. Tabuleiro como no Duel Links

Cada metade do campo tem 5 colunas visuais: pilhas, as 3 zonas e pilhas. As colunas de pilhas são mais estreitas
(`--pile-w`, ~78% da zona). Do ponto de vista de quem olha a tela:

```
 oponente:  [Deck ] [M/A][M/A][M/A] [Extra]
            [Cemit] [Mon][Mon][Mon] [Campo]
            [Ban  ]
            ------- barra de fases e narrador -------
                                    [Ban  ]
 jogador:   [Campo] [Mon][Mon][Mon] [Cemit]
            [Extra] [M/A][M/A][M/A] [Deck ]
```

- **Coluna da esquerda do jogador**: a Zona de Campo, que continua sendo um `Slot` (destaque, seleção e folha), na
  altura dos monstros; o Extra Deck na altura das M/A.
- **Coluna da direita do jogador**:
  - Banidas é uma ficha de meia altura no topo, apagada com "0" quando vazia. Ela continua na tela porque é o destino
    do voo do banimento;
  - Cemitério e Deck ficam abaixo dela, como cartas pequenas.

  As três dividem a altura das duas fileiras.
- **Oponente**: a mesma disposição girada 180°. O Deck fica no alto à esquerda e a Zona de Campo, à direita na altura dos
  monstros.
- **Acabamento**: o conteúdo de cada pilha (topo, verso, espessura em degraus, tom violeta nas Banidas, quantidade) e o
  visual da `tabuleiro-plano` não mudam.

O `PileRow` vira `PileColumn` (lado + `side: 'left' | 'right'`) e reaproveita as células de hoje.

**Alternativas**:

- **Pilhas do mesmo tamanho das zonas**: a largura volta a limitar a carta (~63pt num iPhone de 390). Com colunas mais
  estreitas, chega a ~70pt.
- **Banidas só como aba na lista do Cemitério**: o usuário preferiu a ficha.

### 4. Medidas

```
--pile-w   = --zone-w * .78
--zone-w   = (largura - 2·mat-pad - 2·borda - 4·gap) / (3 + 2·.78)   (pela largura)
--zone-h   = min( (--zone-w - 2·zone-pad) / card-ratio,
                  (altura que sobra - mão mínima) / 4 )               (pela altura)
```

- As partes fixas ficam iguais às da `tabuleiro-plano`, menos as duas fileiras de pilhas e os espaçamentos delas
  (−92pt): placas 48, versos 26, faixa central 38, espaçamentos e bordas.
- A regra da mão continua: ela encolhe primeiro, até 60pt de largura de carta.

Estimativa da carta do campo:

| Viewport | Carta do campo |
|---|---|
| 390×844 | ~70pt (pela largura) |
| 375×667 | ~50pt (pela altura) |
| 390×709 | ~60pt |

Os números finais saem do `layout-e2e`. A spec pede no mínimo 60pt em 390×844 e 46pt em todos os viewports.

**Revisão depois da primeira conferência no simulador**: a mão em arco reservava ~37pt de altura (a queda das pontas e
metade da subida da carta selecionada) e, com a altura limitando as zonas, sobravam faixas nas laterais. Agora:

- **A mão é reta** e não reserva altura: a carta selecionada sobe por cima da placa.
- **O campo avança sobre a margem lateral**, até `--field-edge` (4pt) de cada lado; as placas e a mão ficam na margem
  de 12.
- **As pontas de pilhas** ficam com `--pile-k` de 0,7 da zona e, quando a altura é que limita, crescem até a largura de
  uma zona para preencher as laterais.

Resultado (`layout-e2e`): carta do campo de 70,8pt em 390×844, 63,7pt em 390×709, 79,9pt em 430×932 e 56,5pt no SE.

### 5. Fases sem Main 2

- O `PHASES` do `prompt.ts` perde o chip M2.
- O botão de avanço segue a regra de hoje, sem a Main 2: BATALHA na Main 1 (se houver batalha) e FIM DO TURNO na Battle
  Phase ou quando não houver outra fase.
- O `cpu.ts` (alternativas para "deve atacar") e o `search.ts` não citam a Main 2 como fase obrigatória. Uma conferência
  por `grep` fica nas tarefas.

### 6. Deck inicial, decks dos duelistas e o recomeço da campanha

- **Save**: o `CampaignState` passa para `version: 2`. O `migrate` já devolve `campaign: null` para outra versão. O título
  mostra "Campanha" do dia 1, com o perfil intacto. As estatísticas de duelo do perfil ficam.
- **Deck inicial**:
  - a coleção inicial continua sendo as 40 cartas do deck inicial do nativo;
  - o deck ativo tira 10 dessas cartas, listadas à mão no `starterCut` do `tiers.json` (o `copy_campaign_data.py` leva ao
    `campaign.json`);
  - o `economy-smoke` confere que a lista é válida e sai da coleção.
- **Decks dos duelistas**: o `build_decks.py` ganha o corte para 30 (e Extra ≤ 5) depois das trocas do `REPLACE`:
  - sai primeiro a 3ª cópia das cartas que não são de papel principal;
  - depois saem as cartas com menos cópias, pela ordem da receita;
  - um `KEEP` por duelista protege as cartas de assinatura e as de vitória;
  - cada ajuste fica comentado, como no `REPLACE`.

  Depois, `deck-pick` (torneio entre as receitas, agora em Speed), `build_decks` e `difficulty` até cada duelista ficar
  a ±10 pontos da meta, e o `tier-balance` para o chefe.

  **Resultado do torneio em Speed** (`raw/decks/pick-report-speed.txt`, 12 duelos por candidata): 9 duelistas
  ganharam outra receita, mas sempre por 1 a 3 vitórias, o que fica dentro do ruído. As receitas atuais já têm os ajustes
  do `TUNE`, que dependem dos nomes das cartas de cada receita. Por isso ficam as receitas atuais
  (`raw/decks/picks.json`), e o resultado do torneio fica guardado em `picks.torneio-speed.json`. A dificuldade é medida
  nos decks finais, já cortados e ajustados.
- **Rare Hunter (Exodia)**: o corte não acertava a composição (40–53%). Ele ganha uma lista final comentada (`FINAL` no
  `build_decks.py`): as 15 peças, 9 muralhas, 4 de compra e 2 de proteção. Junto, a CPU passou a guardar as peças do
  Exodia (`EXODIA_PIECES`, `cardValue` e `EVAL.exodiaPiece`): antes ela as descartava por terem o menor ATK. Resultado:
  75% contra a meta de 78% (80 duelos).
- **`randomDeck`** (só nos protótipos): 30 cartas (14/9/7), Extra ≤ 5.

### 7. CPU

A busca e a avaliação não dependem do formato. Os pesos do `EVAL` que medem LP são conferidos: se usam o valor absoluto,
passam a usar a fração do LP inicial (`FORMAT.lp`). O `difficulty.ts` é a prova. Não há perfil novo.

## Risks / Trade-offs

- **[Risco] A campanha dos amigos recomeça.**
  → **Mitigação**: avisar no grupo antes do deploy. O perfil fica e a campanha começa do dia 1.
- **[Risco] Cartas da era DM que supõem 5 zonas** (por exemplo, "destrua todas as cartas na coluna", ou efeitos que
  ocupam várias zonas, como Scapegoat com 4 fichas). Com 3 zonas, o motor recusa ou limita.
  → **Mitigação**: o `smoke` e o `monkey` em Speed apontam erros de Lua e laços. Cartas que quebram vão para o
  `blocklist.json`.
- **[Risco] Rebalancear 3 tiers de duelistas custa tempo de máquina.**
  → **Mitigação**: rodar o `deck-pick` por tier (`--only=`), começando pelo Tier 1.
- **[Trade-off] Duelos mais curtos com LP 4000.** As metas de vitória por tier continuam as mesmas. O bônus de DP de
  "metade dos LP" passa a ser 2000.
- **[Risco] Fixtures do `prompt.ts`**: regravar troca as cartas. Agora é inevitável, porque as zonas e as fases mudam.
  → **Mitigação**: regravar com `capture-fixtures.ts` e ajustar os testes de UI ao conteúdo novo.

## Migration Plan

1. Aplicar e commitar com a campanha em `version: 2`.
2. Avisar os amigos que a campanha recomeça.
3. Fazer o deploy pelo `wrangler`.

No primeiro acesso, o save antigo de campanha é descartado. Para reverter, basta voltar o commit, mas campanhas novas
de `version: 2` não abririam numa versão antiga e recomeçariam.
