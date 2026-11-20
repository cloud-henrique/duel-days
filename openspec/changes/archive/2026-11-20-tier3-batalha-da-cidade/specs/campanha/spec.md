# Spec Delta

## MODIFIED Requirements

### Requirement: Quem aparece em cada período
Em cada período, SHALL aparecer de 2 a 4 dos duelistas comuns do tier atual. Depois que um tier abrir, todos os
comuns dos tiers anteriores SHALL continuar aparecendo (no Tier 2, os amigos do Tier 1: Tristan, Téa, Joey e Bakura; no
Tier 3, também os cinco comuns do Tier 2). Os chefes já liberados SHALL aparecer em todo período. Cada duelista SHALL
ocupar um ponto diferente do panorama, sem cabeças sobrepostas, mesmo com todos os comuns dos tiers anteriores e os três
chefes no mapa: no Tier 1, sorteado entre os pontos do mapa; depois, espalhado pelo panorama, com o tier atual
perto do centro (a parte que a tela mostra ao abrir) e cada tier anterior mais longe dele. O sorteio de quem aparece e dos pontos MUST ser reproduzível pela semente da campanha, pelo dia e pelo
período: fechar e abrir o app no mesmo período mostra os mesmos duelistas nos mesmos pontos. Tocar numa cabeça SHALL
abrir o encontro com aquele duelista. Um duelista com evento de laço aberto SHALL ter um "!" na cabeça; um chefe SHALL
ter moldura dourada larga, com um anel dourado girando em volta (sem coroa).

#### Scenario: Mesmo período, mesma gente
- **WHEN** o jogador fecha o app de manhã no dia 2 e o abre de novo
- **THEN** o mapa mostra os mesmos duelistas nos mesmos pontos

#### Scenario: Tocar na cabeça
- **WHEN** o jogador toca na cabeça do Joey
- **THEN** o encontro com o Joey começa, sem painel intermediário

#### Scenario: Amigos no Tier 2
- **WHEN** o tier atual é o Tier 2
- **THEN** o mapa mostra de 2 a 4 duelistas do Tier 2 perto do centro e os 4 amigos do Tier 1 mais para os lados, e o
  evento de laço aberto da Téa continua com "!"

#### Scenario: Mapa cheio no Tier 3
- **WHEN** o tier atual é o Tier 3, os quatro comuns dele estão no período e Yugi, Pegasus e Kaiba estão liberados
- **THEN** o mapa mostra as 16 cabeças sem nenhuma encostada em outra: o Tier 3 perto do centro, os comuns do Tier 2
  mais para os lados e os amigos do Tier 1 mais longe ainda
