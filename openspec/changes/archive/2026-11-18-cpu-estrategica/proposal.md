# Proposal

## Why

Os duelistas dos Tiers 1 e 2 perdem para o deck inicial puro, sem pacotes nem cartas ganhas. A causa é a CPU
(`src/engine/cpu.ts`), não as receitas: ela sorteia entre as opções que o motor oferece e não olha o tabuleiro. Por isso
quase nunca ataca, ataca monstros mais fortes que os dela, equipa Metalmorph no monstro do jogador (o alvo é sempre o
primeiro da lista) e ativa cartas que não mudam nada (Rex buscando a Magia de Campo que já estava ativa). As receitas
também foram escolhidas por um torneio entre essas CPUs aleatórias, então "o deck mais forte" hoje quer dizer "o que
ganha quando os dois lados jogam ao acaso". A API do YGOPRODeck não traz nada sobre dificuldade (as receitas escolhidas
têm 0 comentários, avaliação nula e nenhum torneio): a força tem que ser medida por nós.

## What Changes

- A CPU passa a escolher jogadas: em cada decisão que importa (fase principal, batalha, alvos, correntes), ela simula as
  candidatas no próprio motor e fica com a de melhor avaliação do tabuleiro, dentro de um orçamento de tempo.
- Nenhum duelista erra de propósito. A diferença entre tiers vem do deck e da força da CPU.
- Duelistas comuns jogam de forma honesta: não veem a mão, as cartas viradas nem a ordem do deck do jogador. O chefe de
  cada tier (Yugi no Tier 1, Pegasus no Tier 2) vê a mão e as cartas viradas do jogador e pensa por mais tempo.
- O pensamento da CPU leva até cerca de 1 s por decisão no iPhone (cerca de 2 s no chefe); prompts sem escolha real
  continuam instantâneos.
- A tela de duelo passa à CPU quem é o oponente (comum ou chefe).
- Uma ferramenta mede a dificuldade: cada duelista contra o deck inicial, com os dois lados jogados pela CPU nova. Metas
  de vitória da CPU: Tier 1 cerca de 55%, Tier 2 cerca de 70%, chefes cerca de 85%.
- O torneio de escolha das receitas é refeito com a CPU nova, e as receitas são ajustadas (troca de receita ou
  `REPLACE` do `build_decks.py`) quando um duelista fica longe da meta do tier.

## Capabilities

### New Capabilities
- `cpu-do-duelo`: como a CPU decide as jogadas do oponente (simulação, avaliação, honestidade, orçamento de tempo,
  perfil comum/chefe) e como a dificuldade é medida contra o deck inicial.

### Modified Capabilities
- `campanha`: o requisito "Receita do deck" passa a escolher a receita pelo torneio com a CPU nova e a exigir que cada
  duelista fique perto da meta de vitória do seu tier contra o deck inicial.

## Impact

- `src/engine/cpu.ts` (vira a política barata e as regras básicas) e novos módulos de simulação e avaliação em
  `src/engine/`.
- `src/engine/driver.ts` (registro de todas as respostas para o replay; perfil da CPU), `protocol.ts` (`start` com o
  perfil), `worker.ts`/`inline.ts`/`host.ts`, `useDuelEngine.ts` e quem abre o duelo da campanha.
- Protótipos: `proto/deck-pick.ts`, `proto/tier-balance.ts`, `proto/monkey.ts`, `proto/smoke.ts` (ficam mais lentos com a
  CPU nova; precisam de modo rápido) e uma ferramenta nova de dificuldade.
- `src/campaign/data/decks.json` regenerado e possivelmente `scripts/build_decks.py` (`REPLACE`).
- Nenhuma dependência nova; nada muda no save.
