# Spec Delta

## MODIFIED Requirements

### Requirement: Moeda e dado
Quando um efeito lança moeda ou dado, a tela SHALL mostrar a moeda ou o dado desenhados do jogo girando e depois o
resultado em texto. Se o jogador escolheu um lado antes do lance, a escolha SHALL aparecer acima da moeda, e o acerto ou
o erro, depois que ela para.

#### Scenario: Moeda
- **WHEN** um efeito lança uma moeda
- **THEN** a moeda dourada gira no centro e termina mostrando "CARA" ou "COROA", em até 1,5 segundo

#### Scenario: Moeda com escolha
- **WHEN** o jogador escolhe "Coroa" e a moeda cai em coroa
- **THEN** aparece "Você disse coroa" e, depois que a moeda para, "Acertou!"

### Requirement: Abertura do duelo
Ao começar o duelo, SHALL ser mostrada uma abertura com:
- a moeda dourada do jogo, que decide quem começa;
- as faixas dos dois duelistas, a do jogador com o avatar e o nome do perfil;
- o título "DUELO!" no estilo de destaque do jogo.

Um toque SHALL pular a abertura. O primeiro acontecimento do duelo SHALL ser encenado só depois que a abertura termina.

#### Scenario: Abertura completa
- **WHEN** um duelo começa e o jogador não toca na tela
- **THEN** a abertura dura cerca de 3 segundos e depois aparece a compra inicial

#### Scenario: Pular abertura
- **WHEN** o jogador toca na tela durante a abertura
- **THEN** a abertura termina imediatamente e o duelo segue

#### Scenario: Faixa do jogador
- **WHEN** a abertura mostra as faixas
- **THEN** a faixa do jogador tem o rosto do avatar escolhido e o nome do perfil

### Requirement: Fim do duelo
Ao terminar o duelo, SHALL ser mostrado um encerramento com o título do resultado ("VITÓRIA!", "DERROTA" ou "EMPATE") no
estilo de destaque do jogo, com o retrato do vencedor em destaque e o do perdedor esmaecido. O retrato do jogador é o do
avatar escolhido. O encerramento SHALL mostrar o ganho em DP.

#### Scenario: Vitória
- **WHEN** o LP do oponente chega a 0
- **THEN** a encenação do último dano termina, aparece "VITÓRIA!" e o retrato do jogador dá um pulo

#### Scenario: Ganho em DP
- **WHEN** o encerramento aparece depois de uma derrota
- **THEN** ele mostra o ganho como "+30 DP" com o ícone de moedas
