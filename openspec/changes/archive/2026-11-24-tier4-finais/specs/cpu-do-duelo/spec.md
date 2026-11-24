# Spec Delta

## MODIFIED Requirements

### Requirement: Perfil do oponente

O duelo SHALL saber se o oponente é um duelista comum ou o chefe do tier, e a CPU SHALL usar o perfil correspondente. O
duelo final com o Yami Yugi SHALL usar o perfil de chefe. Um duelo sem oponente da campanha SHALL usar o perfil comum.

#### Scenario: Duelo contra o chefe

- **WHEN** o jogador começa um duelo contra Yugi (Tier 1), Pegasus (Tier 2), Kaiba (Tier 3) ou Yami Marik (Tier 4)
- **THEN** a CPU joga com o perfil de chefe

#### Scenario: Duelo final

- **WHEN** o jogador começa um duelo contra o Yami Yugi
- **THEN** a CPU joga com o perfil de chefe

#### Scenario: Duelo contra um comum do Tier 3

- **WHEN** o jogador começa um duelo contra o Espa Roba
- **THEN** a CPU joga com o perfil comum

### Requirement: Medida de dificuldade

O projeto SHALL ter uma ferramenta que mede, para cada duelista da campanha, a taxa de vitória dele contra o deck inicial,
com os dois lados jogados pela CPU nova (o duelista no perfil dele, o deck inicial no perfil comum), trocando quem começa. As metas de vitória do duelista são
cerca de 55% no Tier 1, cerca de 70% no Tier 2, cerca de 78% no Tier 3, cerca de 82% no Tier 4, cerca de 85% para os
chefes e cerca de 90% para o Yami Yugi.

#### Scenario: Relatório

- **WHEN** a ferramenta roda com um número de duelos por duelista
- **THEN** ela mostra a taxa de vitória de cada duelista, a meta do tier dele e quem está fora da meta por mais de 10
  pontos

#### Scenario: Meta do Tier 3

- **WHEN** a ferramenta mede o Rare Hunter
- **THEN** o relatório compara a taxa dele com a meta de cerca de 78%

#### Scenario: Meta do duelo final

- **WHEN** a ferramenta mede o Yami Yugi
- **THEN** o relatório compara a taxa dele com a meta de cerca de 90%

## ADDED Requirements

### Requirement: Deuses Egípcios jogáveis

A CPU SHALL conseguir jogar o Obelisk, o Slifer e o Ra no formato do duelo (invocação por 3 tributos com as 3 zonas de
monstro, efeitos de cada um) sem travar o duelo, sem laço de respostas recusadas e dentro do tempo de pensamento. O
mesmo vale para o jogador que tem um Deus no deck.

#### Scenario: Ra na mão da CPU

- **GIVEN** o Yami Marik tem The Winged Dragon of Ra na mão e 3 monstros no campo
- **WHEN** a CPU decide a jogada da fase principal
- **THEN** ela pode tributar os 3 e invocar o Ra, e o duelo continua sem erro

#### Scenario: Teste de estresse com Deuses

- **WHEN** a ferramenta de duelos CPU × CPU roda com os decks do Tier 4 e do Yami Yugi
- **THEN** nenhum duelo trava, entra em laço ou mostra erro de script
