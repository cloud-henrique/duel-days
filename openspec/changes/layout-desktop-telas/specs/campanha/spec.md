## ADDED Requirements

### Requirement: Mapa na tela larga
Na tela larga, as cabeças dos duelistas no mapa SHALL ser maiores (até ~72px), e a barra de atalhos (Deck, Coleção,
Laços, Loja) SHALL ficar centralizada com largura máxima. Ao redimensionar a janela, o mapa SHALL voltar a se
centralizar, a não ser que o jogador o tenha rolado.

#### Scenario: Mapa no desktop
- **WHEN** o jogador abre o mapa numa janela de 1440×900
- **THEN** as cabeças ficam maiores que no celular e os 4 atalhos ficam centralizados, sem ocupar a largura toda

### Requirement: Telas de lista da campanha na tela larga
Na tela larga, o status da campanha, a tela de fim e a tela de duelo interrompido SHALL ficar numa coluna central com
largura máxima (cerca de 640px), com os rótulos perto dos valores e os botões na largura da coluna.

#### Scenario: Duelo interrompido no desktop
- **WHEN** a tela de duelo interrompido aparece numa janela de 1440×900
- **THEN** o texto e os botões ficam numa coluna central com no máximo ~640px de largura
