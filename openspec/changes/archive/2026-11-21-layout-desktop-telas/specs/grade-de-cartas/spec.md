## ADDED Requirements

### Requirement: Tamanho das cartas na tela larga
Na tela larga, as grades de cartas (o deck e a maleta do editor, a Coleção, as cartas do detalhe do pacote e o resumo da
abertura) SHALL ter as colunas pela largura disponível e pelo tamanho escolhido: P, M ou G, com M por padrão. O tamanho
SHALL ser trocado por um controle na barra da maleta e no detalhe do pacote, valer em todas essas grades e ser lembrado
no aparelho. Cada linha SHALL ter pelo menos 2 cartas.

#### Scenario: Trocar para G
- **WHEN** o jogador escolhe G na barra da maleta numa janela de 1440×900
- **THEN** as cartas da maleta e do deck ficam maiores, com menos colunas, e a grade continua rolando lisa até o fim

#### Scenario: Lembrado
- **WHEN** o jogador escolhe P no editor e depois abre a Coleção
- **THEN** a Coleção também está em P

#### Scenario: Retrato
- **WHEN** o viewport tem 390×844
- **THEN** o controle de tamanho não aparece e a maleta tem 4 colunas, como antes

## MODIFIED Requirements

### Requirement: Comportamento da grade preservado
A grade virtualizada SHALL ser a da maleta do editor e a da tela Coleção, com 4 colunas no retrato (na tela larga, pelo tamanho das cartas), cópias repetidas uma a uma,
borda pela raridade, o selo de "no deck" na maleta, busca, filtros, as ordenações do editor e o zoom ao tocar. Trocar de
filtro, de ordem ou de busca SHALL voltar a grade ao topo.

#### Scenario: Filtro
- **WHEN** o jogador filtra por "Fusão" com a grade rolada até o meio
- **THEN** a grade mostra só as Fusões a partir do topo, com as mesmas bordas e selos

#### Scenario: Tocar numa carta
- **WHEN** o jogador toca numa carta de uma linha que acabou de entrar na tela
- **THEN** abre o zoom dessa carta
