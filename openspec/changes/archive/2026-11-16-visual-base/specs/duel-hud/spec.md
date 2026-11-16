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

### Requirement: Zonas de campo ao lado da barra de fases
As duas zonas de Magia de Campo (uma de cada duelista) SHALL ficar visíveis nas pontas da faixa central: a do jogador
à esquerda e a do oponente à direita (como no tabuleiro oficial), cada uma com a largura de uma carta na altura da faixa. A barra de fases SHALL
encolher para caber entre elas, sem cobri-las. Uma Magia de Campo ativada SHALL aparecer na zona do dono e ficar lá
enquanto o motor a mantiver.

#### Scenario: Ativar Umi
- **WHEN** o jogador ativa uma Magia de Campo
- **THEN** a carta aparece na zona de campo do jogador, ao lado da barra de fases, e não vai para o cemitério

### Requirement: Arte da Magia de Campo no tabuleiro
Com uma Magia de Campo virada para cima em jogo, o fundo do tabuleiro (o contêiner de todas as zonas) SHALL mostrar a
arte recortada da carta, cobrindo o tabuleiro, a 50% de opacidade, por trás das zonas. Com duas em jogo, vale a última
ativada; quando ela sai, vale a que restar; sem nenhuma, o tabuleiro volta ao fundo padrão.

#### Scenario: Campo trocado
- **WHEN** o jogador ativa Umi
- **THEN** o tabuleiro passa a mostrar a arte de Umi a 50% por trás das zonas

#### Scenario: Campo destruído
- **WHEN** a única Magia de Campo em jogo é destruída
- **THEN** o tabuleiro volta ao fundo padrão
