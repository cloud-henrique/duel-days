# Spec Delta

## MODIFIED Requirements

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
