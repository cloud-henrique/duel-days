# Spec Delta

## MODIFIED Requirements

### Requirement: Fim do duelo
Ao terminar o duelo, SHALL ser mostrado um encerramento com o título do resultado ("VITÓRIA!", "DERROTA" ou "EMPATE") no
estilo de destaque do jogo, com o retrato do vencedor em destaque e o do perdedor esmaecido. O retrato do jogador é o do
avatar escolhido. O encerramento SHALL mostrar:
- o ganho em DP, com a base e cada bônus que valeu;
- a carta ganha na vitória (e a carta-assinatura, quando houver), com o selo NOVA se o jogador não a tinha;
- a mudança no laço com o oponente, quando houver.

#### Scenario: Vitória
- **WHEN** o LP do oponente chega a 0
- **THEN** a encenação do último dano termina, aparece "VITÓRIA!" e o retrato do jogador dá um pulo

#### Scenario: Ganho em DP
- **WHEN** o encerramento aparece depois de uma derrota
- **THEN** ele mostra o ganho como "+60 DP" com o ícone de moedas

#### Scenario: Carta ganha
- **WHEN** o jogador vence e ganha uma carta que não tinha
- **THEN** o encerramento mostra a carta com o selo NOVA e os bônus de DP que valeram
