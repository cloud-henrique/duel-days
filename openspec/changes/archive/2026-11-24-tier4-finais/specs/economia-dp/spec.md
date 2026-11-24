# Spec Delta

## MODIFIED Requirements

### Requirement: Carta por vitória

Cada vitória SHALL dar uma carta sorteada entre as cópias do deck do oponente. Ficam de fora as cartas limitadas (os
Deuses Egípcios entre elas) e as que o jogador já tem em 3 cópias. Na 5ª vitória contra o mesmo duelista, o jogador SHALL
ganhar também a carta-assinatura dele (requisito "Cartas-assinatura"); só o Yami Yugi entrega a dele na 1ª vitória
(ver `elenco-tier4`). A carta ganha SHALL aparecer no fim do duelo, com o selo NOVA se o jogador não a tinha.

#### Scenario: Assinatura

- **WHEN** o jogador vence o Joey pela 5ª vez
- **THEN** o fim do duelo mostra a carta sorteada e o Red-Eyes Black Dragon

#### Scenario: Assinatura do Tier 2

- **WHEN** o jogador vence o Bandit Keith pela 5ª vez
- **THEN** o fim do duelo mostra a carta sorteada e o Barrel Dragon

#### Scenario: Deus não sai no sorteio

- **WHEN** o jogador vence o Marik pela 2ª vez
- **THEN** a carta sorteada nunca é o Obelisk the Tormentor, mesmo ele estando no deck do Marik

## ADDED Requirements

### Requirement: Coleções do Tier 4
A loja SHALL vender, no Tier 4, Ancient Sanctuary (AST) a 350 DP no dia em que o tier abre e Soul of the Duelist (SOD)
a 350 DP 2 dias depois, seguindo as regras de bloqueio e de compra das outras coleções. As coleções dos tiers anteriores
SHALL continuar à venda.

#### Scenario: Tier 4 na vitrine
- **WHEN** o tier atual é o Tier 3
- **THEN** AST e SOD aparecem bloqueados com "Tier 4", com o motivo "depois de vencer Kaiba"

#### Scenario: Tier 4 aberto
- **WHEN** o Kaiba é vencido no dia 23 (com o Tier 3 vencido por inteiro) e o jogador abre a loja no dia 24
- **THEN** o AST está à venda por 350 DP, o SOD aparece bloqueado com "Dia 25", e as dez coleções dos Tiers 1 a 3
  continuam à venda
