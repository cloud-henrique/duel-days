# Spec Delta

## MODIFIED Requirements

### Requirement: Perfil do oponente
O duelo SHALL saber se o oponente é um duelista comum ou o chefe do tier, e a CPU SHALL usar o perfil correspondente. Um
duelo sem oponente da campanha SHALL usar o perfil comum.

#### Scenario: Duelo contra o chefe
- **WHEN** o jogador começa um duelo contra Yugi (Tier 1), Pegasus (Tier 2) ou Kaiba (Tier 3)
- **THEN** a CPU joga com o perfil de chefe

#### Scenario: Duelo contra um comum do Tier 3
- **WHEN** o jogador começa um duelo contra o Espa Roba
- **THEN** a CPU joga com o perfil comum

### Requirement: Medida de dificuldade
O projeto SHALL ter uma ferramenta que mede, para cada duelista da campanha, a taxa de vitória dele contra o deck inicial,
com os dois lados jogados pela CPU nova (o duelista no perfil dele, o deck inicial no perfil comum), trocando quem começa. As metas de vitória do duelista são
cerca de 55% no Tier 1, cerca de 70% no Tier 2, cerca de 78% no Tier 3 e cerca de 85% para os chefes.

#### Scenario: Relatório
- **WHEN** a ferramenta roda com um número de duelos por duelista
- **THEN** ela mostra a taxa de vitória de cada duelista, a meta do tier dele e quem está fora da meta por mais de 10
  pontos

#### Scenario: Meta do Tier 3
- **WHEN** a ferramenta mede o Rare Hunter
- **THEN** o relatório compara a taxa dele com a meta de cerca de 78%
