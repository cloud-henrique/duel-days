# elenco-tier2 Specification

## Purpose
Define os duelistas do Tier 2 (Reino dos Duelistas): a cena de cada um no encontro, as falas curtas, as cartas-assinatura
e o chefe Maximillion Pegasus.

## Requirements

### Requirement: Duelistas do Tier 2
O Tier 2 SHALL ter cinco duelistas comuns e um chefe, cada um com a sua cena (fundo do Tag Force Special e nome do lugar):
- Weevil Underwood (insetos): Floresta da ilha;
- Rex Raptor (dinossauros): Reino dos Duelistas;
- Mako Tsunami (água): Praia da ilha;
- Bandit Keith (máquinas): Caverna da ilha;
- Mai Valentine (Harpias): Convés do navio;
- Maximillion Pegasus, o chefe (Toons e Ilusões): Castelo do Pegasus.

Eles SHALL aparecer no mapa de Domino só depois que o Tier 2 abrir.

#### Scenario: Antes do Tier 2
- **WHEN** é o dia 4 e o Yugi não foi vencido
- **THEN** nenhum duelista do Tier 2 aparece no mapa

### Requirement: Chefe Pegasus
O Pegasus SHALL seguir a mesma regra de chefe do Yugi: aparece no mapa, com moldura dourada e coroa, em todo período
depois que o jogador vencer os cinco comuns do Tier 2 ao menos uma vez.

#### Scenario: Pegasus liberado
- **WHEN** o jogador vence o último dos cinco comuns do Tier 2 que faltava
- **THEN** a partir do período seguinte a cabeça do Pegasus aparece no mapa, com coroa

### Requirement: Falas curtas
Cada duelista do Tier 2 SHALL ter falas próprias em português: saudação no primeiro encontro, saudação nos encontros
seguintes, fala antes do duelo e falas depois do duelo (vitória e derrota do jogador). As falas SHALL respeitar o nome e o
tratamento do jogador (`{nome}` e `{m|f|n}`). Os duelistas do Tier 2 MUST NOT ter corações, conversa, eventos de laço,
rota nem epílogo nesta versão; o menu do encontro SHALL oferecer só Duelar e Voltar ao mapa.

#### Scenario: Encontro com o Rex
- **WHEN** o jogador encontra o Rex Raptor pela primeira vez
- **THEN** aparece a saudação de primeiro encontro dele, sem corações, e o menu tem Duelar e Voltar ao mapa

### Requirement: Entrada e derrota do chefe
Enquanto o Pegasus não for vencido, o duelo com ele SHALL começar com uma fala de entrada de chefe, e a primeira vitória
do jogador SHALL mostrar uma fala de derrota do chefe. A fala de derrota MUST NOT revelar o conteúdo dos tiers seguintes.

#### Scenario: Primeira vitória sobre o Pegasus
- **WHEN** o jogador vence o Pegasus pela primeira vez
- **THEN** aparece a fala de derrota dele e a campanha continua
