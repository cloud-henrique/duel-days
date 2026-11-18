## MODIFIED Requirements

### Requirement: Comportamento da grade preservado
A grade virtualizada SHALL ser a da maleta do editor e a da tela Coleção, com 4 colunas, cópias repetidas uma a uma,
borda pela raridade, o selo de "no deck" na maleta, busca, filtros, as ordenações do editor e o zoom ao tocar. Trocar de
filtro, de ordem ou de busca SHALL voltar a grade ao topo.

#### Scenario: Filtro
- **WHEN** o jogador filtra por "Fusão" com a grade rolada até o meio
- **THEN** a grade mostra só as Fusões a partir do topo, com as mesmas bordas e selos

#### Scenario: Tocar numa carta
- **WHEN** o jogador toca numa carta de uma linha que acabou de entrar na tela
- **THEN** abre o zoom dessa carta
