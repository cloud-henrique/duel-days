# tela-de-titulo Specification

## Purpose
Define a tela inicial do jogo no padrão do *Duel Links*: o logo e o nome "DUEL DAYS" em letras metálicas, o orbe com o
leque de cartas, o perfil e os ajustes no topo e as entradas para o que o jogo oferece.

## Requirements

### Requirement: Logo e nome do jogo
A tela de título SHALL mostrar o logo "Yu-Gi-Oh!" e, abaixo dele, o nome do jogo em caixa alta ("DUEL DAYS"), na fonte do
jogo. O nome SHALL ter:
- miolo em degradê metálico (branco, prata e azul-claro);
- contorno marinho;
- brilho ciano.

Atrás, SHALL aparecer o orbe azul com o leque de cartas. O nome MUST ser lido como "Duel Days" pelos leitores de tela.
Sem o arquivo do logo (que não é versionado), a tela MUST continuar completa, só sem o logo.

#### Scenario: Abertura do app
- **WHEN** o app abre com um save existente
- **THEN** aparecem o orbe com o leque, o logo e "DUEL DAYS" em letras metálicas

#### Scenario: Sem o logo
- **WHEN** o arquivo do logo não existe no build
- **THEN** a tela mostra o orbe e o nome do jogo, sem imagem quebrada

### Requirement: Entradas do título
A tela de título SHALL oferecer:
- **Campanha**, num botão grande. Sem campanha começada, ele diz "Campanha" e começa uma do dia 1. Com uma campanha em
  andamento, ele diz "Continuar", mostra o dia e o período ("Dia 5 · Tarde") e o saldo em DP, e leva ao mapa. Com a
  campanha terminada, leva à tela de fim;
- **Meu deck**, que abre o editor de deck.

Entradas de recursos que ainda não existem (duelo rápido, histórico) MUST NOT aparecer.

#### Scenario: Jogo em andamento
- **WHEN** o jogador tem uma campanha na tarde do dia 5 com 450 DP e abre o app
- **THEN** o botão principal diz "Continuar", "Dia 5 · Tarde" e "450 DP" e, ao tocar, abre o mapa da campanha

#### Scenario: Sem duelo rápido
- **WHEN** a tela de título é exibida
- **THEN** não há botões de "Duelo rápido" nem de "Histórico"

### Requirement: Perfil e ajustes no topo
O topo da tela de título SHALL mostrar o perfil do jogador (avatar e nome), que abre a tela de perfil, e um botão de
ajustes. Os ajustes SHALL reunir as preferências que valem para o app inteiro:
- animações (normal, rápida, desligada);
- efeitos sonoros;
- música (interruptor e volume).

Elas são as mesmas do menu do duelo, salvas no aparelho.

#### Scenario: Abrir o perfil
- **WHEN** o jogador toca no perfil do topo
- **THEN** a tela de perfil abre

#### Scenario: Ajuste vale no duelo
- **WHEN** o jogador desliga o som nos ajustes do título e começa um duelo
- **THEN** o menu do duelo mostra o som desligado e nenhum efeito sonoro toca

#### Scenario: Música desligada
- **WHEN** o jogador desliga a música nos ajustes do título
- **THEN** a música do título para e nenhuma faixa toca no mapa nem no duelo

### Requirement: Entrada animada
Ao abrir a tela de título, o orbe e o leque SHALL acender e o nome SHALL receber um reflexo que passa pelas letras, em
menos de 1,5 segundo. Os botões SHALL responder ao toque desde o início. Com "reduzir movimento", a tela aparece pronta,
sem a entrada.

#### Scenario: Reduzir movimento
- **WHEN** "reduzir movimento" está ativo e o app abre
- **THEN** a tela de título aparece pronta, sem o orbe acendendo nem o reflexo
