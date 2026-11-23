# Spec Delta

## MODIFIED Requirements

### Requirement: Duelistas do Tier 3
O Tier 3 SHALL ter quatro duelistas comuns e um chefe, cada um com a sua cena (fundo do Tag Force Special e nome do lugar):
- Espa Roba (Jinzo e psíquicos): Praça do museu;
- Rare Hunter (Exodia): Beco;
- Arkana (Mago Negro e magia das trevas): Palco;
- Strings (Slime e defesa): Rua com neblina;
- Seto Kaiba, o chefe (Dragão Branco de Olhos Azuis e máquinas): Museu de Domino.

Eles SHALL aparecer no mapa de Domino só depois que o Tier 3 abrir, isto é, depois de cada duelista do Tier 2 vencido,
o Pegasus incluso.

#### Scenario: Antes do Tier 3
- **WHEN** é o dia 12 e o Pegasus não foi vencido
- **THEN** nenhum duelista do Tier 3 aparece no mapa

#### Scenario: Tier 3 pelo prazo
- **WHEN** chega o dia 15 e o Pegasus não foi vencido
- **THEN** nenhum duelista do Tier 3 aparece no mapa; só depois de vencer o Pegasus (com os comuns do Tier 2 já
  vencidos) de 2 a 4 deles aparecem perto do centro do mapa, e o Pegasus continua no mapa
