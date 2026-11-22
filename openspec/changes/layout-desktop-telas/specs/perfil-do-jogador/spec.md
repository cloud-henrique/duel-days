## ADDED Requirements

### Requirement: Boas-vindas e perfil na tela larga
Na tela larga, as boas-vindas e a tela de perfil SHALL ficar numa coluna central com largura máxima (cerca de 640px): o
campo do nome, a grade de avatares, o tratamento e o botão "Começar" na largura dessa coluna.

#### Scenario: Boas-vindas no desktop
- **WHEN** o jogo é aberto pela primeira vez numa janela de 1440×900
- **THEN** o nome, os avatares e "Começar" ficam numa coluna central, e o botão não ocupa a largura toda da tela
