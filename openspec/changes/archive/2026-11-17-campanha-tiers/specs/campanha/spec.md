# Spec Delta

## MODIFIED Requirements

### Requirement: Mapa da Cidade de Domino
O mapa SHALL mostrar o panorama da Cidade de Domino em todos os tiers, sem lugares fixos nem nomes de lugar: só as
cabeças de quem está por perto, cada uma num ponto do panorama. O mapa SHALL rolar na horizontal e ter um tom diferente
para Manhã, Tarde e Noite. O cabeçalho SHALL mostrar o dia, o período, o DP, a barra dos dias e o progresso do tier
atual ("X/N vencidos", com N o número de duelistas comuns do tier, e a situação do chefe dele). O mapa SHALL dar acesso
a Deck, Laços, Loja e Status.

#### Scenario: Cabeçalho
- **WHEN** o jogador abre o mapa na tarde do dia 5 com 450 DP e 2 duelistas do Tier 1 já vencidos
- **THEN** o cabeçalho mostra "Dia 5", "Tarde", "450 DP" e "2/4 vencidos"

#### Scenario: Noite
- **WHEN** é noite
- **THEN** o mapa e o fundo do encontro aparecem com o tom azulado da noite

#### Scenario: Sem nomes de lugar
- **WHEN** o jogador abre o mapa
- **THEN** aparecem só as cabeças dos duelistas, sem nome de lugar nem contador

### Requirement: Quem aparece em cada período
Em cada período, SHALL aparecer de 2 a 4 dos duelistas comuns do tier atual. Depois que o Tier 2 abrir, SHALL aparecer
também de 1 a 2 dos amigos do Tier 1 (Tristan, Téa, Joey e Bakura). Os chefes já liberados SHALL aparecer em todo
período. Cada duelista SHALL ocupar um ponto diferente do panorama, sorteado entre os pontos do mapa, sem cabeças
sobrepostas. O sorteio de quem aparece e dos pontos MUST ser reproduzível pela semente da campanha, pelo dia e pelo
período: fechar e abrir o app no mesmo período mostra os mesmos duelistas nos mesmos pontos. Tocar numa cabeça SHALL
abrir o encontro com aquele duelista. Um duelista com evento de laço aberto SHALL ter um "!" na cabeça; um chefe SHALL
ter moldura dourada e coroa.

#### Scenario: Mesmo período, mesma gente
- **WHEN** o jogador fecha o app de manhã no dia 2 e o abre de novo
- **THEN** o mapa mostra os mesmos duelistas nos mesmos pontos

#### Scenario: Tocar na cabeça
- **WHEN** o jogador toca na cabeça do Joey
- **THEN** o encontro com o Joey começa, sem painel intermediário

#### Scenario: Amigos no Tier 2
- **WHEN** o tier atual é o Tier 2
- **THEN** o mapa mostra de 2 a 4 duelistas do Tier 2 e de 1 a 2 amigos do Tier 1, e o evento de laço aberto da Téa
  continua com "!" quando ela aparece

### Requirement: Chefe Yugi
O Yugi SHALL aparecer no mapa em todo período depois que o jogador vencer cada um dos 4 duelistas comuns do Tier 1 ao
menos uma vez, e SHALL continuar aparecendo nos tiers seguintes. Antes disso, o progresso do tier SHALL dizer que é
preciso vencer todos para desafiá-lo. No mapa, o Yugi aparece com moldura dourada e coroa.

#### Scenario: Liberar o chefe
- **WHEN** o jogador vence o último dos 4 duelistas comuns que ainda não tinha vencido
- **THEN** no período seguinte a cabeça do Yugi aparece no mapa, com coroa, e o progresso diz que ele está esperando

### Requirement: Falas e prêmio do chefe
Enquanto o Yugi não for vencido, o duelo com ele SHALL começar com a fala de entrada do chefe, e a primeira vitória SHALL
mostrar a fala de derrota do chefe. Vencer o Yugi MUST NOT encerrar a campanha. Se a primeira vitória contra ele vier
até o último dia da janela do Tier 1 (dia 7), o jogador SHALL ganhar um pacote fechado da coleção mais recente à venda,
e o Tier 2 abre no período seguinte (ver `progressao-por-tiers`).

#### Scenario: Yugi vencido no dia 6
- **WHEN** o jogador vence o Yugi pela primeira vez no dia 6
- **THEN** aparece a fala de derrota do chefe, um pacote fechado entra na loja, a campanha continua e o Tier 2 abre no
  período seguinte

### Requirement: Encontro
Ao encontrar um duelista, o jogo SHALL mostrar a cena dele: o fundo do lugar onde ele está naquela fase da história (no
tom do período) e o nome do lugar no topo, o duelista de corpo inteiro e a saudação na caixa de fala, com um botão para
pular as falas. Os duelistas com laço (os do Tier 1) SHALL mostrar os corações. Depois da saudação, o menu SHALL ter:
- o título do evento de laço aberto, como botão principal, quando houver;
- Conversar (só para quem tem laço);
- Duelar;
- Voltar ao mapa (sem gastar período).

Sem o arquivo do fundo, a cena SHALL usar um degradê no lugar.

#### Scenario: Primeiro encontro
- **WHEN** o jogador encontra o Joey pela primeira vez
- **THEN** aparece o Joey na cena dele, com uma saudação comum, e depois o menu com Conversar, Duelar e Voltar

#### Scenario: Cena do Tier 2
- **WHEN** o jogador encontra o Pegasus
- **THEN** o fundo é o do castelo do Pegasus e o topo mostra o nome do lugar

#### Scenario: Pular falas
- **WHEN** o jogador toca em "Pular" durante a saudação
- **THEN** o menu do encontro aparece

### Requirement: Duelo da campanha
Duelar SHALL mostrar a fala de antes do duelo na cena do duelista e então abrir o duelo contra o deck do duelista, com
o deck ativo do jogador. O deck de cada duelista SHALL ser a receita escolhida para ele (ver o requisito "Receita do
deck"), não um deck aleatório. Um deck inválido do jogador MUST impedir o duelo e levar ao editor.

#### Scenario: Deck do oponente
- **WHEN** o jogador duela contra o Joey
- **THEN** o Joey usa o deck da receita escolhida para ele

#### Scenario: Deck inválido
- **WHEN** o deck ativo tem 38 cartas e o jogador toca em Duelar
- **THEN** o duelo não começa e o jogo leva ao editor de deck

## ADDED Requirements

### Requirement: Receita do deck
O deck de cada duelista da campanha SHALL sair de uma receita "Anime Decks" publicada no YGOPRODeck para aquele
personagem. São candidatas as receitas com ao menos 85% das cartas do Main no pool do jogo; as cartas fora do pool SHALL
ser trocadas por cartas da era com o mesmo papel, cada troca com um comentário. A receita final SHALL ser a que mais
vence numa simulação CPU × CPU entre as candidatas.

#### Scenario: Chefe mais forte
- **WHEN** o deck do chefe de um tier enfrenta os decks dos comuns do mesmo tier na simulação
- **THEN** o chefe vence a maioria dos duelos

### Requirement: Decks válidos e locais
Todo deck de duelista MUST passar na validação (40 a 60 cartas, Extra até 15, até 3 cópias, limitadas a 1) e ter só
cartas que o motor joga. O jogo MUST NOT consultar o YGOPRODeck: as receitas são buscadas por um script e só os ids das
cartas ficam versionados.

#### Scenario: Deck válido
- **WHEN** o jogo carrega os decks dos duelistas
- **THEN** cada um passa na validação de deck e todas as cartas existem na base
