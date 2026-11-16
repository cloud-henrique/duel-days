# Spec Delta

## Purpose

Define a música de fundo do jogo: uma faixa por tela, como no app nativo, com interruptor e volume próprios nos ajustes.

## ADDED Requirements

### Requirement: Faixa por tela
O jogo SHALL tocar uma faixa em laço conforme a tela:

| Faixa | Telas |
|---|---|
| título | título, perfil, ajustes, boas-vindas |
| mapa | mapa, deck, coleção, laços, status, fim da campanha |
| loja | loja e abertura de pacotes |
| encontro | falas, menu do encontro, conversa, eventos, epílogo |
| duelo | duelo comum e de evento |
| duelo de chefe | duelo contra o Yugi |
| vitória / derrota | o fim do duelo, conforme o resultado |

#### Scenario: Duelo de chefe
- **WHEN** o duelo contra o Yugi começa
- **THEN** toca a faixa de duelo de chefe, e não a de duelo comum

### Requirement: Troca de faixa
Ao trocar de faixa, a anterior SHALL sumir em fade e a nova entrar em fade. Indo para uma tela que usa a mesma faixa,
a música SHALL continuar sem recomeçar.

#### Scenario: Do mapa para o deck
- **WHEN** o jogador sai do mapa para o editor de deck
- **THEN** a música do mapa continua de onde estava

### Requirement: Ajuste de música
Os ajustes (no título e no menu do duelo) SHALL ter um interruptor de música e um volume, separados dos efeitos
sonoros, salvos no aparelho. Com a música desligada, nenhuma faixa SHALL tocar; ligar de novo SHALL retomar a faixa da
tela atual.

#### Scenario: Desligar no duelo
- **WHEN** o jogador desliga a música no menu do duelo
- **THEN** a faixa para em fade, os efeitos sonoros continuam e o ajuste vale no resto do jogo

### Requirement: Música no celular
A música MUST começar só depois do primeiro toque do jogador (exigência do iOS) e SHALL parar quando o app vai para o
segundo plano, voltando quando ele volta. Sem os arquivos de música no build (eles não são versionados), o jogo SHALL
funcionar normalmente, em silêncio.

#### Scenario: Segundo plano
- **WHEN** o jogador sai do app durante o mapa e volta
- **THEN** a música para ao sair e volta ao retornar

#### Scenario: Sem os arquivos
- **WHEN** o build não tem as faixas
- **THEN** as telas abrem sem erro e sem música
