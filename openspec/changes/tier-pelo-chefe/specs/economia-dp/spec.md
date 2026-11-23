# Spec Delta

## MODIFIED Requirements

### Requirement: Pacotes à venda
A loja SHALL vender as coleções TCG da época, liberadas pelo tier e, dentro dele, em ordem cronológica a partir do dia em
que o tier abriu:
- Tier 1 (aberto no dia 1): LOB, 150 DP, e MRD, 200 DP, no dia 1; MRL, 200 DP, no dia 3; PSV, 225 DP, no dia 5;
- Tier 2: LON, 250 DP, no dia em que o tier abre; LOD, 250 DP, 2 dias depois; PGD, 250 DP, 4 dias depois;
- Tier 3: MFC, 300 DP, no dia em que o tier abre; DCR, 300 DP, 2 dias depois; IOC, 300 DP, 4 dias depois.

As coleções dos tiers anteriores SHALL continuar à venda. Uma coleção do tier atual ainda fechada SHALL aparecer
bloqueada com o dia em que abre; as do próximo tier SHALL aparecer bloqueadas com o nome do tier e o chefe que falta
vencer para abri-lo. Sem DP suficiente, o pacote SHALL dizer quantos DP faltam. Cada coleção SHALL poder ser comprada em
pacote avulso ou na caixa de 20, com 10% de desconto arredondado para baixo na dezena.

#### Scenario: Antes do dia 3
- **WHEN** o jogador abre a loja no dia 2
- **THEN** o MRL aparece bloqueado com "Dia 3"

#### Scenario: Tier 2 adiantado
- **WHEN** o jogador vence o Yugi no dia 5 e abre a loja na manhã do dia 6
- **THEN** o LON está à venda, o LOD aparece bloqueado com "Dia 7" e o PGD com "Dia 9", e LOB, MRD, MRL e PSV continuam
  à venda

#### Scenario: Próximo tier na vitrine
- **WHEN** o tier atual é o Tier 1, no dia 4 ou no dia 10
- **THEN** LON, LOD e PGD aparecem bloqueados com "Tier 2", com o motivo "depois de vencer Yugi"

#### Scenario: Tier 3 na vitrine
- **WHEN** o tier atual é o Tier 2
- **THEN** MFC, DCR e IOC aparecem bloqueados com "Tier 3", com o motivo "depois de vencer Pegasus"

#### Scenario: Tier 3 pelo prazo
- **WHEN** o Pegasus é vencido no dia 15 e o jogador abre a loja no dia 16
- **THEN** o MFC está à venda por 300 DP, o DCR aparece bloqueado com "Dia 17" e o IOC com "Dia 19", e as sete coleções
  dos Tiers 1 e 2 continuam à venda

#### Scenario: Sem DP
- **WHEN** o jogador tem 120 DP e olha o LOB
- **THEN** o LOB diz que faltam 30 DP e não deixa comprar
