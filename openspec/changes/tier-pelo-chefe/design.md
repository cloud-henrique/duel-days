# Design

## Regra

`tierCleared(s, t)` (em `src/campaign/tiers.ts`): o tier tem duelistas, o chefe está em `defeatedBosses` e cada duelista
do tier tem `victories > 0`. `isTierOpen(s, n)`: o Tier 1 sempre; os outros, o anterior aberto e `tierCleared`. O chefe
só aparece com os comuns vencidos (`isBossAvailable`), então na prática vencer o chefe basta; a checagem dos comuns
protege saves editados ou de depuração.

## Dia de abertura

`tierOpenDay` passa a ser o dia em que o chefe anterior caiu (`bossDefeatedOn`); save sem esse campo usa o primeiro dia
da janela, como antes. As coleções do tier seguem contando a partir desse dia.

## Saves existentes

Nada é migrado: o tier é derivado. Um save no Tier 3 sem o Pegasus volta ao Tier 2 (o Pegasus está no mapa se os comuns
do T2 foram vencidos). Cartas e pacotes comprados das coleções do Tier 3 continuam na coleção; a loja só deixa de
vendê-las até o tier abrir.

## Lock da vitrine

`Lock` `{ kind: 'tier'; tier; boss }` no lugar de `day`: a vitrine não tem mais um dia para prometer.
