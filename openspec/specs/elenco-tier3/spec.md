# elenco-tier3 Specification

## Purpose
Define os duelistas do Tier 3 (Batalha da Cidade): a cena de cada um no encontro, as falas curtas, as cartas-assinatura e
o chefe Seto Kaiba.

## Requirements

### Requirement: Duelistas do Tier 3
O Tier 3 SHALL ter quatro duelistas comuns e um chefe, cada um com a sua cena (fundo do Tag Force Special e nome do lugar):
- Espa Roba (Jinzo e psíquicos): Praça do museu;
- Rare Hunter (Exodia): Beco;
- Arkana (Mago Negro e magia das trevas): Palco;
- Strings (Slime e defesa): Rua com neblina;
- Seto Kaiba, o chefe (Dragão Branco de Olhos Azuis e máquinas): Museu de Domino.

Eles SHALL aparecer no mapa de Domino só depois que o Tier 3 abrir.

#### Scenario: Antes do Tier 3
- **WHEN** é o dia 12 e o Pegasus não foi vencido
- **THEN** nenhum duelista do Tier 3 aparece no mapa

#### Scenario: Tier 3 pelo prazo
- **WHEN** chega a manhã do dia 15 e o Pegasus não foi vencido
- **THEN** de 2 a 4 duelistas do Tier 3 aparecem perto do centro do mapa e o Pegasus continua disponível quando liberado

### Requirement: Cartas-assinatura do Tier 3
Cada duelista do Tier 3 SHALL ter uma carta-assinatura que está no deck dele: Jinzo (Espa Roba), Exodia, o Proibido
(Rare Hunter), Cortina de Magia Negra (Arkana), Slime Renascido (Strings) e Dragão Branco de Olhos Azuis (Kaiba).

#### Scenario: Assinatura do Strings
- **WHEN** o jogador vence o Strings pela quinta vez
- **THEN** o fim do duelo mostra o Slime Renascido como carta-assinatura

### Requirement: Chefe Kaiba
O Kaiba SHALL seguir a mesma regra de chefe do Yugi e do Pegasus: aparece no mapa, com a moldura de chefe, em todo período
depois que o jogador vencer os quatro comuns do Tier 3 ao menos uma vez, e continua aparecendo depois de vencido.

#### Scenario: Kaiba liberado
- **WHEN** o jogador vence o último dos quatro comuns do Tier 3 que faltava
- **THEN** a partir do período seguinte a cabeça do Kaiba aparece no mapa com a moldura de chefe

### Requirement: Falas curtas do Tier 3
Cada duelista do Tier 3 SHALL ter falas próprias em português: saudação no primeiro encontro, saudação nos encontros
seguintes, fala antes do duelo e falas depois do duelo (vitória e derrota do jogador), com 2 a 3 variações por momento.
As falas SHALL respeitar o nome e o tratamento do jogador (`{nome}` e `{m|f|n}`) e MUST NOT revelar o conteúdo do Tier 4.

#### Scenario: Primeiro encontro com o Espa Roba
- **WHEN** o jogador encontra o Espa Roba pela primeira vez
- **THEN** aparece uma das saudações de primeiro encontro dele, com o nome do jogador no lugar de `{nome}`

#### Scenario: Strings com poucas expressões
- **WHEN** uma fala do Strings pede uma expressão que ele não tem
- **THEN** o retrato mostra a expressão neutra dele, sem erro e sem retrato vazio

### Requirement: Encontro sem laço no Tier 3
Os duelistas do Tier 3 MUST NOT ter corações, conversa, eventos de laço, rota nem epílogo; o menu do encontro SHALL
oferecer só Duelar e Voltar ao mapa.

#### Scenario: Encontro com o Arkana
- **WHEN** o jogador encontra o Arkana pela primeira vez
- **THEN** a cena é o Palco, sem corações, e o menu tem Duelar e Voltar ao mapa

### Requirement: Entrada e derrota do Kaiba
Enquanto o Kaiba não for vencido, o duelo com ele SHALL começar com uma fala de entrada de chefe, e a primeira vitória do
jogador SHALL mostrar uma fala de derrota do chefe. A fala de derrota MUST NOT revelar o conteúdo do Tier 4.

#### Scenario: Primeira vitória sobre o Kaiba
- **WHEN** o jogador vence o Kaiba pela primeira vez
- **THEN** aparece a fala de derrota dele e a campanha continua
