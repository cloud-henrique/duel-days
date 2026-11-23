# Proposal

## Why

O próximo tier abria também **pelo prazo**: no primeiro dia da janela dele, mesmo sem o chefe do tier anterior vencido.
Com isso, um save no dia 20 estava no Tier 3 (Kaiba esperando) sem nunca ter vencido o Pegasus. A campanha precisa de
progressão de verdade: um tier só abre depois de o jogador vencer todos os duelistas do tier anterior, o chefe incluso.

## What Changes

- **BREAKING** O Tier n+1 SHALL abrir só quando cada duelista do Tier n (os comuns e o chefe) foi vencido ao menos uma
  vez. O dia não abre tier: sai o "próximo tier pelo prazo".
- As janelas dos tiers continuam valendo só para o pacote-prêmio (chefe vencido até o último dia da janela).
- Saves que estavam num tier aberto pelo prazo voltam ao tier cujo chefe falta vencer (cartas, DP e pacotes ficam).
- O aviso "o próximo tier chega numa atualização" aparece com o tier atual vencido por inteiro (não mais pelo fim da
  janela).
- A vitrine e o Status deixam de prometer um dia para o próximo tier: mostram o chefe que o abre ("Tier 3", "Chega com o
  Tier 3, depois de vencer Pegasus"; no Status, "Tier 3 · vença Pegasus").
- Presets de depuração `tier2`, `pegasus`, `tier3`, `kaiba` e `bond-late` passam a vencer os tiers anteriores.
- `proto/story-smoke.ts` confere a cada período que nenhum tier abre sem o anterior vencido; o modelo corre atrás do
  progresso em graus diferentes e conta em que tier cada campanha termina.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `progressao-por-tiers`: o próximo tier abre só pelo tier anterior vencido por inteiro; sai o requisito do prazo.
- `economia-dp`: o bloqueio das coleções do próximo tier mostra o tier e o chefe, não um dia.
- `loja-de-pacotes`: o motivo do bloqueio na vitrine ("Tier 2").
- `elenco-tier3`: o Tier 3 aparece só depois do Pegasus vencido.
