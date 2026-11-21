## MODIFIED Requirements

### Requirement: Save da campanha
O progresso da campanha SHALL ficar salvo no aparelho a cada mudança (período, DP, coleção, deck, pacotes, vitórias,
afinidade, eventos e rotas) e sobreviver a fechar o app. Tudo o que é sorteado (quem aparece, falas, tema ruim, cartas
dos pacotes e da vitória) SHALL sair da semente salva, para o mesmo estado dar o mesmo resultado. Um save da história
antiga SHALL abrir no título com o perfil intacto e a campanha por começar. Uma campanha salva no formato anterior
(duelos de 5 zonas e decks de 40) SHALL ser descartada da mesma forma: o perfil, as estatísticas e os ajustes ficam, e a
campanha recomeça do dia 1.

#### Scenario: Save antigo
- **WHEN** um save da história antiga é carregado
- **THEN** o título mostra o mesmo perfil e "Campanha" começa do dia 1

#### Scenario: Campanha do formato anterior
- **WHEN** o app abre com uma campanha salva antes do formato Speed
- **THEN** o título mostra o mesmo perfil, sem "Continuar", e "Campanha" começa do dia 1 com a coleção e o deck iniciais

### Requirement: Receita do deck
O deck de cada duelista da campanha SHALL sair de uma receita "Anime Decks" publicada no YGOPRODeck para aquele
personagem. São candidatas as receitas com ao menos 85% das cartas do Main no pool do jogo; as cartas fora do pool SHALL
ser trocadas por cartas da era com o mesmo papel, cada troca com um comentário. A receita SHALL ser cortada para o
tamanho do formato (até 30 no principal e 5 no Extra), mantendo as cartas de assinatura e as de vitória do duelista;
cada ajuste do corte que não sair da regra SHALL ter um comentário. A receita final SHALL ser a que mais vence numa
simulação CPU × CPU no formato do duelo entre as candidatas, jogada pela CPU estratégica (não pela aleatória). Se a taxa
de vitória do duelista contra o deck inicial ficar mais de 10 pontos longe da meta do tier, a receita SHALL ser trocada
por outra candidata ou ajustada por trocas comentadas, até ficar perto da meta.

#### Scenario: Chefe mais forte
- **WHEN** o deck do chefe de um tier enfrenta os decks dos comuns do mesmo tier na simulação
- **THEN** o chefe vence a maioria dos duelos

#### Scenario: Perto da meta
- **WHEN** a medida de dificuldade roda depois de gerar os decks
- **THEN** cada duelista fica a no máximo 10 pontos da meta de vitória do seu tier contra o deck inicial

### Requirement: Decks válidos e locais
Todo deck de duelista MUST passar na validação do formato (20 a 30 cartas, Extra até 5, até 3 cópias, limitadas a 1) e
ter só cartas que o motor joga. O jogo MUST NOT consultar o YGOPRODeck: as receitas são buscadas por um script e só os
ids das cartas ficam versionados.

#### Scenario: Deck válido
- **WHEN** o jogo carrega os decks dos duelistas
- **THEN** cada um passa na validação de deck e todas as cartas existem na base
