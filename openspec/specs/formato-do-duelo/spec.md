# formato-do-duelo Specification

## Purpose
Define as regras do duelo do jogo (Speed Duel, sem Skills): LP, mão inicial, zonas em jogo, fases e o tamanho do deck e
do Extra. É a fonte única das regras usadas pela tela, pelo editor e pela campanha (change speed-duel).

## Requirements

### Requirement: Duelo no formato Speed
Todo duelo do jogo SHALL seguir as regras do Speed Duel, sem Skills:
- cada duelista começa com 4000 LP e 4 cartas na mão;
- cada duelista tem 3 zonas de monstro, 3 zonas de Magia/Armadilha e a Zona de Campo;
- o turno não tem Main Phase 2;
- o primeiro jogador não compra no primeiro turno.

As regras MUST vir de um lugar só, lido pelo motor, pela tela, pelo editor e pela campanha.

#### Scenario: Começo do duelo
- **WHEN** um duelo começa
- **THEN** os dois duelistas têm 4000 LP e 4 cartas na mão

#### Scenario: Três zonas
- **WHEN** o jogador já tem 3 monstros no campo
- **THEN** o motor não oferece invocar um quarto monstro

#### Scenario: Fim da batalha
- **WHEN** o jogador termina a Battle Phase
- **THEN** o turno vai para a End Phase, sem Main Phase 2

### Requirement: Tamanho do deck
Um deck SHALL ter de 20 a 30 cartas no deck principal e no máximo 5 no Extra Deck, com até 3 cópias de cada carta e as
limitadas a 1. As cartas permitidas são as do pool do jogo (era Duel Monsters), não a lista oficial de cartas Speed.

#### Scenario: Deck curto
- **WHEN** um deck tem 19 cartas no principal
- **THEN** ele é inválido e falta 1 carta

#### Scenario: Extra cheio
- **WHEN** um deck tem 5 cartas no Extra Deck
- **THEN** não é possível pôr uma sexta

### Requirement: Deuses Egípcios limitados

Obelisk the Tormentor, Slifer the Sky Dragon e The Winged Dragon of Ra SHALL ser limitados a 1 cópia por deck, no deck
do jogador e nos decks dos duelistas da campanha.

#### Scenario: Segundo Obelisco

- **WHEN** o jogador tem um Obelisk the Tormentor no deck e tenta pôr outro
- **THEN** o editor recusa com o motivo de carta limitada
