## ADDED Requirements

### Requirement: Loja na tela larga
Na tela larga, o conteúdo da loja (balcão, pacotes ganhos e vitrine) SHALL ficar centralizado com largura máxima, e as
capas da vitrine SHALL ter um tamanho máximo (cerca de 190px de largura), com quantas couberem por linha. No detalhe do
pacote, a grade de cartas SHALL seguir o tamanho das cartas escolhido, e a barra de compra SHALL ter largura máxima. No
resumo da abertura, as cartas também SHALL seguir o tamanho escolhido.

#### Scenario: Vitrine no desktop
- **WHEN** o jogador abre a loja numa janela de 1440×900
- **THEN** as capas da vitrine ficam com no máximo ~190px de largura, várias por linha, e o vovô do balcão aparece inteiro

#### Scenario: Detalhe do pacote no desktop
- **WHEN** o jogador abre o detalhe do LOB numa janela de 1440×900
- **THEN** as cartas do pacote seguem o tamanho escolhido e os botões de compra não ocupam a largura toda da tela
