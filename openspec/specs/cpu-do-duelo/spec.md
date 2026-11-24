# cpu-do-duelo Specification

## Purpose
Define como a CPU escolhe as jogadas do oponente nos duelos (sem errar de propósito, honesta nos comuns, mais forte nos
chefes, dentro de um tempo de pensamento) e como a dificuldade dos duelistas é medida contra o deck inicial.

## Requirements

### Requirement: Jogadas escolhidas pelo resultado
Em cada decisão com escolha real (fase principal, batalha, alvos, correntes, posições, tributos), a CPU SHALL comparar as
opções legais pelo resultado que cada uma produz no duelo e escolher a de melhor resultado para ela. A CPU MUST NOT
escolher ao acaso nem errar de propósito, em nenhum tier.

#### Scenario: Ataque que vence
- **GIVEN** a CPU tem um monstro de 1800 de ATK em ataque e o jogador tem um único monstro de 1200 de ATK em ataque, sem
  cartas viradas
- **WHEN** a CPU está na fase de batalha
- **THEN** ela ataca esse monstro

#### Scenario: Não ataca para perder
- **GIVEN** o único monstro da CPU tem 1200 de ATK e o jogador tem um monstro de 2000 de ATK em ataque
- **WHEN** a CPU está na fase de batalha
- **THEN** ela não ataca esse monstro

#### Scenario: Ataque direto
- **GIVEN** o campo de monstros do jogador está vazio e a CPU tem monstros que podem atacar
- **WHEN** a CPU está na fase de batalha
- **THEN** todos esses monstros atacam diretamente

#### Scenario: Mão cheia
- **GIVEN** a CPU tem na mão um monstro que pode invocar e que vence algum monstro do jogador ou o campo dele está vazio
- **WHEN** a CPU está na fase principal com a Invocação Normal disponível
- **THEN** ela invoca um monstro antes de ir para a batalha

### Requirement: Alvos do lado certo
Quando um efeito da CPU pede alvos, ela SHALL escolher o alvo que melhora o duelo para ela: efeitos que fortalecem vão
para os monstros dela e efeitos que destroem, enfraquecem ou tomam o controle vão para as cartas do jogador.

#### Scenario: Equipamento que fortalece
- **WHEN** a CPU ativa Metalmorph ou outro equipamento que aumenta o ATK e tem um monstro próprio que pode recebê-lo
- **THEN** o equipamento vai para um monstro da CPU, não do jogador

#### Scenario: Efeito que destrói
- **WHEN** a CPU ativa um efeito que destrói um monstro à escolha
- **THEN** o alvo é um monstro do jogador

### Requirement: Sem jogadas inúteis
A CPU MUST NOT ativar uma carta cujo efeito não muda o duelo a favor dela no momento, como buscar uma cópia da Magia de
Campo que já está ativa ou gastar uma Magia sem alvo útil.

#### Scenario: Campo já ativo
- **GIVEN** a Magia de Campo da CPU já está ativa
- **WHEN** ela poderia ativar uma carta que só busca uma cópia dessa mesma Magia de Campo
- **THEN** ela não a ativa

### Requirement: Comuns jogam honestamente
A CPU dos duelistas comuns MUST NOT usar o que o jogador não mostrou: a mão, as cartas viradas para baixo e a ordem do
deck do jogador. Ela SHALL considerar o risco das cartas viradas do jogador sem saber quais são.

#### Scenario: Mesma jogada com mãos diferentes
- **GIVEN** dois duelos com o mesmo campo visível, mas mãos ou cartas viradas do jogador diferentes
- **WHEN** um duelista comum decide a jogada
- **THEN** ele escolhe a mesma jogada nos dois duelos

### Requirement: Chefe mais difícil
O chefe de cada tier SHALL jogar com mais força que os comuns: ele conhece a mão e as cartas viradas do jogador e pensa
por mais tempo em cada decisão. A ordem do deck do jogador MUST NOT ser usada nem pelo chefe.

#### Scenario: Armadilha virada conhecida
- **GIVEN** o jogador tem Mirror Force virada e o chefe tem um ataque que não vence sem ela
- **WHEN** o chefe decide se ataca
- **THEN** ele leva em conta que Mirror Force destruiria os atacantes

### Requirement: Tempo de pensamento
Cada decisão com escolha real SHALL levar no máximo cerca de 1 s no iPhone para um duelista comum e cerca de 2 s para um
chefe. Prompts sem escolha real SHALL ser respondidos sem espera de pensamento. A tela MUST continuar respondendo enquanto
a CPU pensa.

#### Scenario: Turno da CPU
- **WHEN** a CPU joga um turno inteiro no iPhone
- **THEN** nenhuma decisão passa do teto do perfil dela e a tela continua aceitando toques

#### Scenario: Prompt sem escolha
- **WHEN** o motor pede à CPU uma resposta com uma única opção legal
- **THEN** ela responde sem gastar tempo de pensamento

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
