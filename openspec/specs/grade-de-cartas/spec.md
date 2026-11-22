# grade-de-cartas Specification

## Purpose

Define as grades de cartas do jogo (a coleção e o "Deste deck" do editor, e a loja) para que continuem lisas e leves no
iPhone com a coleção inteira da era Duel Monsters, com cada cópia aparecendo uma a uma.

## Requirements

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
A grade virtualizada SHALL ser a da maleta do editor e a da tela Coleção, com 4 colunas no retrato (na tela larga, pelo tamanho das cartas), cópias repetidas uma a uma,
borda pela raridade, o selo de "no deck" na maleta, busca, filtros, as ordenações do editor e o zoom ao tocar. Trocar de
filtro, de ordem ou de busca SHALL voltar a grade ao topo.

#### Scenario: Filtro
- **WHEN** o jogador filtra por "Fusão" com a grade rolada até o meio
- **THEN** a grade mostra só as Fusões a partir do topo, com as mesmas bordas e selos

#### Scenario: Tocar numa carta
- **WHEN** o jogador toca numa carta de uma linha que acabou de entrar na tela
- **THEN** abre o zoom dessa carta

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
