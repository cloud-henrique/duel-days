# Spec Delta

## MODIFIED Requirements

### Requirement: Receita do deck
O deck de cada duelista da campanha SHALL sair de uma receita "Anime Decks" publicada no YGOPRODeck para aquele
personagem. São candidatas as receitas com ao menos 85% das cartas do Main no pool do jogo; as cartas fora do pool SHALL
ser trocadas por cartas da era com o mesmo papel, cada troca com um comentário. A receita final SHALL ser a que mais
vence numa simulação CPU × CPU entre as candidatas, jogada pela CPU estratégica (não pela aleatória). Se a taxa de vitória
do duelista contra o deck inicial ficar mais de 10 pontos longe da meta do tier, a receita SHALL ser trocada por outra
candidata ou ajustada por trocas comentadas, até ficar perto da meta.

#### Scenario: Chefe mais forte
- **WHEN** o deck do chefe de um tier enfrenta os decks dos comuns do mesmo tier na simulação
- **THEN** o chefe vence a maioria dos duelos

#### Scenario: Perto da meta
- **WHEN** a medida de dificuldade roda depois de gerar os decks
- **THEN** cada duelista fica a no máximo 10 pontos da meta de vitória do seu tier contra o deck inicial
