# Spec Delta

## MODIFIED Requirements

### Requirement: Boas-vindas na primeira abertura
Na primeira abertura, sem save no aparelho nem na conta do jogador, o app SHALL mostrar as boas-vindas antes de qualquer
outra tela. Nelas, o jogador escolhe:
- o nome, de 1 a 20 caracteres;
- o avatar, entre os 14 duelistas genéricos do *Duel Links* (alunos da Escola Domino e duelistas de roupa casual),
  numa grade de rostos;
- o tratamento: "Ele", "Ela" ou "Neutro".

O botão de começar MUST ficar desativado enquanto o nome estiver vazio.

#### Scenario: Primeira abertura
- **WHEN** o app abre sem save no aparelho e a conta também não tem save
- **THEN** aparecem as boas-vindas com o campo de nome, a grade de 14 avatares e as três opções de tratamento

#### Scenario: Nome vazio
- **WHEN** o campo de nome está vazio ou só com espaços
- **THEN** o botão de começar fica desativado

## ADDED Requirements

### Requirement: Aparelho novo abre com o save da conta
Se o aparelho não tiver save, mas a conta do jogador tiver, o app SHALL abrir o título com o save da conta, sem passar
pelas boas-vindas. Sem rede, o app SHALL mostrar as boas-vindas, e o save da conta SHALL aparecer depois na escolha
entre os dois lados (capacidade `save-na-nuvem`).

#### Scenario: Aparelho novo com save na conta
- **WHEN** o jogador instala o app no notebook, com rede, e a conta já tem o perfil e a campanha do celular
- **THEN** o app abre direto no título, com o nome, o avatar e a campanha do celular

#### Scenario: Aparelho novo sem rede
- **WHEN** o app abre pela primeira vez num aparelho sem save e sem internet
- **THEN** aparecem as boas-vindas; se a conta tinha um save, ele aparece na escolha entre os dois lados quando houver
  rede
