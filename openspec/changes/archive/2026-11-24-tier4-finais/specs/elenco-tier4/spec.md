# Spec Delta

## Purpose

Define os duelistas do Tier 4 (Finais da Batalha da Cidade): a cena de cada um no encontro, as falas curtas, as
cartas-assinatura, o chefe Yami Marik e o duelo final com o Yami Yugi, que fecha o torneio.

## ADDED Requirements

### Requirement: Duelistas do Tier 4

O Tier 4 SHALL ter quatro duelistas comuns e um chefe, cada um com a sua cena (fundo do Tag Force Special e nome do lugar):

- Ishizu: Kaiba Corp;
- Odion: Arena do dirigível;
- Yami Bakura: Cabine do dirigível;
- Marik: Cais;
- Yami Marik, o chefe: Reino das Sombras.

Eles SHALL aparecer no mapa só depois que o Tier 4 abrir.

#### Scenario: Antes do Tier 4

- **WHEN** é o dia 24 e o Kaiba não foi vencido
- **THEN** nenhum duelista do Tier 4 aparece no mapa

#### Scenario: Tier 4 aberto

- **WHEN** o jogador vence o Kaiba com os quatro comuns do Tier 3 já vencidos
- **THEN** a partir do período seguinte aparecem de 2 a 4 comuns do Tier 4 perto do centro do mapa, e o Kaiba continua
  no mapa

### Requirement: Cartas-assinatura do Tier 4

Cada duelista do Tier 4 SHALL ter uma carta-assinatura que está no deck dele: Exchange of the Spirit (Ishizu), Embodiment
of Apophis (Odion), Dark Necrofear (Yami Bakura), Obelisk the Tormentor (Marik), The Winged Dragon of Ra (Yami Marik) e
Slifer the Sky Dragon (Yami Yugi).

#### Scenario: Obelisco do Marik

- **WHEN** o jogador vence o Marik pela quinta vez
- **THEN** o fim do duelo mostra o Obelisk the Tormentor como carta-assinatura

#### Scenario: Ra do Yami Marik

- **WHEN** o jogador vence o Yami Marik pela quinta vez
- **THEN** o fim do duelo mostra The Winged Dragon of Ra como carta-assinatura

### Requirement: Chefe Yami Marik

O Yami Marik SHALL seguir a mesma regra de chefe do Yugi, do Pegasus e do Kaiba: aparece no mapa, com a moldura de chefe,
em todo período depois que o jogador vencer os quatro comuns do Tier 4 ao menos uma vez, e continua aparecendo depois de
vencido. Enquanto não for vencido, o duelo SHALL começar com a fala de entrada de chefe, e a primeira vitória SHALL
mostrar a fala de derrota dele.

#### Scenario: Yami Marik liberado

- **WHEN** o jogador vence o último dos quatro comuns do Tier 4 que faltava
- **THEN** a partir do período seguinte a cabeça do Yami Marik aparece no mapa com a moldura de chefe

### Requirement: Duelo final com o Yami Yugi

O Yami Yugi SHALL aparecer no mapa, na Arena da torre e com a moldura de chefe, em todo período depois que o jogador
vencer o Yami Marik, e SHALL continuar aparecendo depois de vencido. Antes disso, ele MUST NOT aparecer no mapa nem no
progresso como desafio disponível.

#### Scenario: Antes do Yami Marik

- **WHEN** o jogador venceu os quatro comuns do Tier 4, mas não o Yami Marik
- **THEN** o Yami Yugi não aparece no mapa

#### Scenario: Liberado pelo Yami Marik

- **WHEN** o jogador vence o Yami Marik pela primeira vez
- **THEN** a partir do período seguinte a cabeça do Yami Yugi aparece no mapa com a moldura de chefe

### Requirement: Entrada e derrota do Yami Yugi

Enquanto o Yami Yugi não for vencido, o duelo com ele SHALL começar com uma fala de entrada própria. A primeira vitória
do jogador SHALL mostrar a fala de derrota dele e, em seguida, a cena de campeão (ver `campanha`).

#### Scenario: Primeira vitória sobre o Yami Yugi

- **WHEN** o jogador vence o Yami Yugi pela primeira vez
- **THEN** aparece a fala de derrota dele, depois a cena de campeão, e a campanha continua

### Requirement: Slifer na primeira vitória

O Yami Yugi SHALL entregar a carta-assinatura dele (Slifer the Sky Dragon) na primeira vitória do jogador sobre ele, e não
na quinta. Nenhum outro duelista MUST ter essa exceção.

#### Scenario: Slifer logo de cara

- **WHEN** o jogador vence o Yami Yugi pela primeira vez
- **THEN** o fim do duelo mostra a carta sorteada e o Slifer the Sky Dragon, com o selo NOVA

#### Scenario: Quinta vitória sobre o Yami Yugi

- **WHEN** o jogador vence o Yami Yugi pela quinta vez
- **THEN** o fim do duelo mostra só a carta sorteada, sem um segundo Slifer

### Requirement: Falas curtas do Tier 4

Cada duelista do Tier 4 e o Yami Yugi SHALL ter falas próprias em português: saudação no primeiro encontro, saudação nos
encontros seguintes, fala antes do duelo e falas depois do duelo (vitória e derrota do jogador), com 2 a 3 variações por
momento. As falas SHALL respeitar o nome e o tratamento do jogador (`{nome}` e `{m|f|n}`).

#### Scenario: Primeiro encontro com a Ishizu

- **WHEN** o jogador encontra a Ishizu pela primeira vez
- **THEN** aparece uma das saudações de primeiro encontro dela, com o nome do jogador no lugar de `{nome}`

### Requirement: Yami ao lado do amigo

O Yami Yugi e o Yami Bakura SHALL ser duelistas separados do Yugi e do Bakura do Tier 1: os dois de cada par podem
aparecer no mapa no mesmo período, e as falas dos Yami SHALL tratá-los como o outro lado do amigo (o espírito do Item do
Milênio). Os laços, eventos e epílogos do Yugi e do Bakura MUST NOT mudar.

#### Scenario: Bakura e Yami Bakura no mesmo período

- **WHEN** o tier atual é o Tier 4 e o sorteio põe o Yami Bakura no mapa
- **THEN** a cabeça do Bakura (com o "!" se tiver evento aberto) e a do Yami Bakura aparecem em pontos diferentes, e
  cada uma abre o encontro com o seu duelista

### Requirement: Encontro sem laço no Tier 4

Os duelistas do Tier 4 e o Yami Yugi MUST NOT ter corações, conversa, eventos de laço, rota, epílogo nem pacote de
personagem; o menu do encontro SHALL oferecer só Duelar e Voltar ao mapa.

#### Scenario: Encontro com o Odion

- **WHEN** o jogador encontra o Odion pela primeira vez
- **THEN** a cena é a Arena do dirigível, sem corações, e o menu tem Duelar e Voltar ao mapa
