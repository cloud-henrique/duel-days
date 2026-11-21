## MODIFIED Requirements

### Requirement: Cabeçalho do deck
O editor SHALL mostrar no topo a contagem do deck principal ("Main N", com "20–30") e do Extra Deck ("Extra N", com "até
5"), pelas regras do formato do duelo. Um deck válido SHALL mostrar o selo PRONTO; um inválido SHALL mostrar quantos
problemas tem. Tocar no selo de problemas SHALL abrir "O que falta no deck" com a lista dos problemas.

#### Scenario: Deck pronto
- **WHEN** o deck em edição tem 30 cartas no principal e nenhum problema
- **THEN** o cabeçalho mostra "Main 30" e o selo PRONTO

#### Scenario: Deck curto
- **WHEN** o deck tem 17 cartas e o jogador toca no selo de problemas
- **THEN** abre "O que falta no deck" dizendo que faltam 3 cartas no deck principal

### Requirement: Pôr e tirar pelo zoom
Tocar numa carta (do deck ou da maleta) SHALL abrir o zoom com "No deck X · Você tem Y" e os botões "Tirar do deck" e
"Pôr no deck". Pôr SHALL respeitar as regras do deck (até 3 cópias, limitadas a 1, principal até 30, Extra até 5,
Fusões só no Extra) e as cópias que o jogador tem.

#### Scenario: Sem cópia sobrando
- **WHEN** o jogador tem 2 cópias de uma carta e as 2 estão no deck
- **THEN** "Pôr no deck" fica indisponível no zoom

#### Scenario: Deck principal cheio
- **WHEN** o deck principal tem 30 cartas
- **THEN** "Pôr no deck" de um monstro da maleta é recusado com o motivo de deck cheio
