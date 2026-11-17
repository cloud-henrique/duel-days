# Spec Delta

## Purpose

Define as grades de cartas do jogo (a coleção e o "Deste deck" do editor, e a loja) para que continuem lisas e leves no
iPhone com a coleção inteira da era Duel Monsters, com cada cópia aparecendo uma a uma.

## ADDED Requirements

### Requirement: Só as linhas visíveis
Uma grade de cartas SHALL montar e carregar a arte só das linhas visíveis e de uma pequena folga acima e abaixo. As
cartas que saem dessa faixa MUST deixar de ocupar memória com a imagem.

#### Scenario: Coleção inteira
- **WHEN** a aba Coleção lista 6.000 cópias
- **THEN** a página tem só as células da área visível e da folga (dezenas, não milhares)

#### Scenario: Rolar até o fim e voltar
- **WHEN** o jogador rola a coleção inteira até o fim e volta ao topo
- **THEN** as cartas do topo aparecem de novo, e a memória não acumula as imagens de todas as cartas já vistas

### Requirement: Rolagem lisa
Rolar a grade com a coleção inteira SHALL manter a animação fluida num iPhone: medida no aparelho, a média MUST ficar
perto de 60 quadros por segundo, sem travadas longas visíveis. (O simulador de iOS desenha mais devagar que o aparelho e
não serve para esta meta.)

#### Scenario: Medição de FPS
- **WHEN** a coleção inteira é rolada de ponta a ponta num iPhone com o medidor `?perf`
- **THEN** o FPS medido fica em torno de 60 e o relatório de medição registra o resultado

### Requirement: Comportamento da grade preservado
A grade virtualizada SHALL manter o que a grade tem hoje: 4 colunas, cópias repetidas uma a uma, borda pela raridade,
selo de "no deck" na aba Coleção, busca, filtros, ordenação e o zoom ao tocar. Trocar de aba ou de filtro SHALL voltar a
grade ao topo.

#### Scenario: Filtro
- **WHEN** o jogador filtra por "Fusão" com a grade rolada até o meio
- **THEN** a grade mostra só as Fusões a partir do topo, com as mesmas bordas e selos

#### Scenario: Tocar numa carta
- **WHEN** o jogador toca numa carta de uma linha que acabou de entrar na tela
- **THEN** abre o zoom dessa carta
