## ADDED Requirements

### Requirement: Tela larga
O jogo SHALL considerar "tela larga" a viewport em paisagem com pelo menos 900px de largura e 600px de altura (desktop e
tablet deitado). As telas com layout de tela larga SHALL usar esse mesmo critério, e fora dele o layout de retrato SHALL
continuar sem mudança. Ao girar o aparelho ou redimensionar a janela, o layout SHALL trocar na hora, sem recarregar e
sem perder o estado da tela.

#### Scenario: Desktop
- **WHEN** o jogo é aberto numa janela de 1440×900
- **THEN** as telas usam o layout de tela larga

#### Scenario: Celular deitado
- **WHEN** o jogo é aberto num celular deitado de 844×390
- **THEN** as telas usam o layout de retrato

#### Scenario: Celular em retrato
- **WHEN** o viewport tem 390×844
- **THEN** as telas ficam exatamente como antes desta mudança

#### Scenario: Janela redimensionada no meio do duelo
- **WHEN** o jogador estreita a janela do navegador abaixo de 900px durante um duelo
- **THEN** o duelo passa para o layout de retrato e continua do mesmo ponto
