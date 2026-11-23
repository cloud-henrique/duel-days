# Spec Delta

## MODIFIED Requirements

### Requirement: Vitrine
Abaixo do balcão, a loja SHALL mostrar, nesta ordem: "Pacotes ganhos" (só quando houver pacotes ganhos fechados, com o
número deles e o botão "Abrir pacote grátis"), "À venda" (as coleções) e "Pacotes de personagem". As coleções e os
pacotes de personagem SHALL aparecer em grade de capas com o nome e o preço em DP. Um pacote bloqueado SHALL mostrar a
capa apagada com um ícone e o motivo ("Dia 7", "Tier 2", "3/5"); sem DP, o preço SHALL vir com "faltam N DP";
um pacote recém-liberado SHALL ter o selo NOVA. Tocar numa capa liberada SHALL abrir o detalhe do pacote; tocar numa
bloqueada SHALL só balançar a capa e mostrar o motivo (no próximo tier, o chefe que falta vencer). Pacote sem arquivo de
capa SHALL usar uma capa desenhada com o nome.

#### Scenario: Coleção do próximo tier
- **WHEN** o tier atual é o Tier 1 no dia 4
- **THEN** a vitrine mostra LON, LOD e PGD apagados com "Tier 2", e tocar neles não abre nada e mostra "Chega com o
  Tier 2, depois de vencer Yugi"

#### Scenario: Sem pacotes ganhos
- **WHEN** o jogador já abriu todos os pacotes ganhos
- **THEN** a seção "Pacotes ganhos" não aparece
