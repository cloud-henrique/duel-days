# Proposta

## Why

No celular em retrato, as cartas do campo ficam pequenas: ~42pt de largura num iPhone de 390. Com 5 colunas não há como
crescer muito, porque a largura é o limite. A `tabuleiro-plano` (campo plano com uma fileira de pilhas de cada lado) chegou
a 58pt num iPhone de 390, mas no iPhone SE a carta cai para 35pt.

O Speed Duel resolve na raiz. Com 3 zonas por fileira, as pilhas vão para as laterais, como no Duel Links, e as duas
fileiras de pilhas deixam de roubar altura. Os duelos também ficam mais curtos (LP 4000, mão de 4, sem Main Phase 2), o
que combina com partidas no celular. O jogo passa a ser só Speed Duel, sem Skills.

Esta change absorve a `tabuleiro-plano`, que foi implementada mas não commitada. O campo plano, Banidas e Extra no
retrato, a lista das pilhas, a placa fina e a encenação pelas pilhas são reaproveitados. A disposição de 5 colunas nunca
vai para produção.

## What Changes

- **BREAKING (regras): o duelo passa a ser Speed Duel.** O motor roda no modo Speed do ocgcore:
  - LP 4000;
  - mão inicial de 4;
  - 3 zonas de monstro e 3 de Magia/Armadilha por duelista, mais a Zona de Campo;
  - sem Main Phase 2.

  Não há Skills. As cartas continuam as do pool da era DM, com a mesma lista de limitadas.
- **BREAKING (deck):** o deck principal passa a ter de 20 a 30 cartas, o Extra Deck até 5, e o limite de 3 cópias
  continua. O editor, a validação e o duelo da campanha seguem essas regras.
- **BREAKING (save): a campanha recomeça.** Saves de campanha anteriores são descartados ao abrir o app. O perfil, as
  estatísticas e os ajustes ficam.
- **Deck inicial e decks dos duelistas com 30 cartas.**
  - A coleção inicial continua sendo as 40 cartas do deck inicial do nativo.
  - O deck ativo inicial é um corte fixo de 30 delas.
  - Os decks dos duelistas são regerados pelo `build_decks.py` com até 30 cartas (Extra ≤ 5) e rebalanceados no formato
    Speed contra a meta de cada tier.
- **Tabuleiro como no Duel Links**, plano e sem perspectiva:
  - 3 colunas de zonas no meio;
  - uma coluna de pilhas de cada lado do campo de cada duelista:
    - jogador: Campo e Extra Deck à esquerda; Banidas (ficha pequena), Cemitério e Deck à direita;
    - oponente: a mesma disposição girada 180°;
  - as zonas na proporção da carta, com o tamanho tirado da largura e da altura.
- **Da `tabuleiro-plano`, sem mudança de comportamento**:
  - Banidas e Extra no retrato do tabuleiro;
  - um toque numa pilha abre a lista (Cemitério e Banidas dos dois, Extra só do jogador);
  - placa fina sem cemitério nem deck;
  - voos da encenação de e para as pilhas;
  - acabamento visual (moldura com chanfro, luz no lado de quem joga, emblema nas zonas vazias).
- **Barra de fases e botão de avanço sem Main 2**: depois da Battle Phase, o botão é FIM DO TURNO.

## Capabilities

### New Capabilities

- `formato-do-duelo`: as regras do duelo do jogo (Speed Duel sem Skills): LP, mão inicial, zonas em jogo, fases e
  tamanho do deck e do Extra. É a fonte única das regras usadas pela tela, pelo editor e pela campanha.

### Modified Capabilities

- `duel-hud`:
  - medidas (3 colunas de zonas e as colunas de pilhas, tamanho pela largura e pela altura);
  - campo plano;
  - pilhas nas laterais e as listas delas;
  - Zona de Campo na coluna de pilhas;
  - placa fina;
  - botão de avanço e chips sem Main 2;
  - LP de exemplo em 4000.
- `duel-animacoes`: invocação, destruição, banimento e retorno vão e vêm das pilhas das laterais.
- `editor-de-deck`: contagens e limites do cabeçalho e do "Pôr no deck" (20–30 e Extra até 5).
- `campanha`: validação dos decks dos duelistas no formato novo, receita cortada para 30 e save antigo de campanha
  descartado.
- `economia-dp`: o começo da campanha passa a ter a coleção de 40 cartas e o deck ativo de 30.

## Impact

- **Motor**:
  - `src/engine/session.ts` e `driver.ts` (modo Speed, LP e mão inicial, todos vindos de um módulo só de formato);
  - `narrator.ts` e `track.ts` (LP inicial);
  - `protocol.ts` (Banidas e Extra, vindos da `tabuleiro-plano`);
  - a CPU (`evaluate.ts`: pesos de LP conferidos para 4000);
  - os quebra-cabeças de teste (`__testing__/duel.ts`), que precisam do modo novo.
- **Tela de duelo**:
  - `duel.css` (tokens para 3 colunas e as colunas de pilhas);
  - `Field.tsx`;
  - `PileRow.tsx` → as colunas de pilhas;
  - `PileSheet.tsx`, `Plate.tsx`, `DuelScreen.tsx`;
  - `prompt.ts` (fases);
  - `lp.ts`;
  - a encenação em `anim/play.ts`.
- **Deck e campanha**:
  - `src/game/decks.ts` (limites e `randomDeck`);
  - `DeckEditor.tsx`;
  - `src/campaign/state.ts` (versão do save);
  - `balance.ts` (LP inicial no bônus de DP);
  - `decks.ts` (deck inicial de 30);
  - `scripts/build_decks.py` e `decks.json`;
  - `proto/deck-pick.ts`, `difficulty.ts` e `tier-balance.ts`, rodados de novo.
- **Ferramentas**:
  - `proto/smoke.ts`, `monkey.ts`, `economy-smoke.ts`, `layout-e2e.mjs` e `duel-e2e.mjs` no formato novo;
  - fixtures do `prompt.ts` regravadas.
- **Documentação**: `CLAUDE.md` (o formato Speed, a tela e a nota de que a campanha recomeça).
- **Para os amigos**: o progresso da campanha atual se perde no primeiro acesso depois do deploy.
