# Spec Delta

## MODIFIED Requirements

### Requirement: Cores de tema alinhadas ao HUD
O `theme_color` e o `background_color` do manifest, assim como o `<meta name="theme-color">`, SHALL usar a mesma cor do
fundo das telas (o azul mais escuro da paleta do jogo, nas bordas do degradê). O ícone do app MUST NOT mudar por causa
disso: ele continua sobre o fundo escuro descrito em "Ícone do redemoinho".

#### Scenario: Abertura do app instalado
- **WHEN** o app instalado abre
- **THEN** a tela de abertura e a barra do sistema usam a cor do fundo das telas, sem faixa de outra cor entre a barra e
  a primeira tela

#### Scenario: Ícone inalterado
- **WHEN** as cores de tema mudam para a paleta em azul médio
- **THEN** o ícone instalado continua o redemoinho ciano sobre o fundo escuro
