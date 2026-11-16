# Spec Delta

## Purpose

Define a identidade do jogador no jogo: nome, avatar e tratamento escolhidos nas boas-vindas e na tela de perfil, as
estatísticas básicas e o jogador representado pelo próprio avatar, e não por um personagem da série.

## ADDED Requirements

### Requirement: Boas-vindas na primeira abertura
Na primeira abertura, sem save, o app SHALL mostrar as boas-vindas antes de qualquer outra tela. Nelas, o jogador
escolhe:
- o nome, de 1 a 20 caracteres;
- o avatar, entre os 14 duelistas genéricos do *Duel Links* (alunos da Escola Domino e duelistas de roupa casual),
  numa grade de rostos;
- o tratamento: "Ele", "Ela" ou "Neutro".

O botão de começar MUST ficar desativado enquanto o nome estiver vazio.

#### Scenario: Primeira abertura
- **WHEN** o app abre sem save
- **THEN** aparecem as boas-vindas com o campo de nome, a grade de 14 avatares e as três opções de tratamento

#### Scenario: Nome vazio
- **WHEN** o campo de nome está vazio ou só com espaços
- **THEN** o botão de começar fica desativado

### Requirement: Texto conforme o tratamento
Os textos do jogo com gênero SHALL seguir o tratamento escolhido. Com "Neutro", o texto SHALL evitar a palavra com
gênero em vez de inventar uma terminação (ex.: "Boas-vindas ao Duel Days" no lugar de "Bem-vindo").

#### Scenario: Saudação
- **WHEN** o jogador com tratamento "Ela" abre o app
- **THEN** a saudação diz "Bem-vinda"; com "Neutro", diz "Boas-vindas"

### Requirement: O jogador é o próprio avatar
Em todo lugar onde o jogador aparece, SHALL aparecer o avatar e o nome escolhidos, e MUST NOT aparecer um personagem da
série (como o Yugi):
- na placa do duelo;
- nas faixas da abertura;
- no fim do duelo;
- no topo da tela de título;
- nas cenas da história.

#### Scenario: Placa do duelo
- **WHEN** um duelo começa
- **THEN** a placa do jogador mostra o rosto do avatar escolhido e o nome do perfil

### Requirement: Tela de perfil
A tela de perfil SHALL permitir trocar o nome, o avatar e o tratamento, e SHALL mostrar as estatísticas:
- vitórias;
- derrotas;
- aproveitamento (vitórias sobre duelos terminados, em porcentagem).

A desistência e o empate contam como derrota, como já contam no saldo de hoje. A troca SHALL valer na hora em todo o
jogo.

#### Scenario: Estatísticas
- **WHEN** o jogador tem 3 vitórias e 1 derrota
- **THEN** o perfil mostra 3 vitórias, 1 derrota e 75% de aproveitamento

#### Scenario: Trocar o avatar
- **WHEN** o jogador escolhe outro avatar no perfil e volta ao título
- **THEN** o topo do título mostra o rosto novo, e o próximo duelo também

### Requirement: Saves antigos continuam
Um save criado antes deste recurso SHALL continuar abrindo, sem perder progresso:
- o nome do save vira o nome do perfil;
- o avatar é o primeiro da lista;
- o tratamento é "Neutro";
- as estatísticas começam do que o save já conta (vitórias e derrotas por oponente).

#### Scenario: Save antigo
- **WHEN** um save anterior a este recurso é carregado
- **THEN** o jogo abre na tela de título com o nome do save, o primeiro avatar e o tratamento "Neutro", sem passar pelas
  boas-vindas
