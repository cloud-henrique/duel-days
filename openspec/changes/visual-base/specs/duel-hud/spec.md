# Spec Delta

## MODIFIED Requirements

### Requirement: Proporção das fileiras do campo
As zonas de Magia/Armadilha SHALL ter a mesma altura da zona de monstro, para as cartas de Magia/Armadilha ficarem
legíveis (mesmo que o campo pareça menos inclinado). A faixa central (zonas de campo e barra de fases) SHALL ter 46pt
de altura.

#### Scenario: Fileiras medidas
- **WHEN** o campo é renderizado com zona de monstro de altura Z
- **THEN** cada zona de Magia/Armadilha tem altura Z (±1) e a faixa central tem 46pt (±1)

### Requirement: Botões de ação compactos
O avanço de fase SHALL ser um botão só, de cerca de 64×60, com o rótulo da fase seguinte: BATALHA na Main Phase 1 (se
houver batalha), MAIN 2 na Battle Phase e FIM DO TURNO na Main Phase 2 ou quando não houver outra fase. MUST NOT haver
um segundo botão que pule uma fase; terminar o turno pela Main Phase 1 passa pela Battle Phase e pela Main Phase 2.

#### Scenario: Main Phase 1 com batalha disponível
- **WHEN** o jogador está na Main Phase 1 e pode ir para a batalha ou encerrar
- **THEN** aparece só o botão BATALHA (~64×60), sem "Encerrar"

#### Scenario: Battle Phase
- **WHEN** o jogador está na Battle Phase
- **THEN** aparece só o botão MAIN 2, e o FIM DO TURNO só vem na Main Phase 2

## ADDED Requirements

### Requirement: Menu da altura da placa
O botão de menu do duelo, ao lado da placa do oponente, SHALL ter a mesma altura da placa, sem vão abaixo dele.

#### Scenario: Topo do duelo
- **WHEN** o duelo é exibido
- **THEN** o botão de menu e a placa do oponente começam e terminam na mesma altura

### Requirement: Zona visível durante a encenação
Enquanto uma carta do campo é encenada (virar, mudar de posição, ativar, sair da zona), a zona tracejada SHALL continuar
visível; só a carta dentro dela é escondida enquanto o efeito a representa.

#### Scenario: Armadilha virada
- **WHEN** uma Armadilha baixada é virada para ser ativada
- **THEN** o tracejado da zona continua no lugar durante o giro
