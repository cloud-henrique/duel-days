# Spec Delta

## MODIFIED Requirements

### Requirement: Perfil e ajustes no topo
O topo da tela de título SHALL mostrar o perfil do jogador (avatar e nome), que abre a tela de perfil, e um botão de
ajustes. Os ajustes SHALL reunir as preferências que valem para o app inteiro:
- animações (normal, rápida, desligada);
- efeitos sonoros;
- música (interruptor e volume).

Elas são as mesmas do menu do duelo, salvas com o save do jogador: no aparelho e na conta, valendo em todos os
aparelhos dele.

#### Scenario: Abrir o perfil
- **WHEN** o jogador toca no perfil do topo
- **THEN** a tela de perfil abre

#### Scenario: Ajuste vale no duelo
- **WHEN** o jogador desliga o som nos ajustes do título e começa um duelo
- **THEN** o menu do duelo mostra o som desligado e nenhum efeito sonoro toca

#### Scenario: Música desligada
- **WHEN** o jogador desliga a música nos ajustes do título
- **THEN** a música do título para e nenhuma faixa toca no mapa nem no duelo

#### Scenario: Ajuste vale em outro aparelho
- **WHEN** o jogador baixa o volume da música no celular, com rede, e abre o jogo no notebook
- **THEN** o notebook toca a música no volume escolhido no celular
