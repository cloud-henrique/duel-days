# campanha Specification

## Purpose
Define a campanha Duel Monsters (Tier 1) portada do app nativo: o calendário de 30 dias, o mapa da Cidade de Domino com
quem aparece em cada período, o encontro com falas, conversa e duelo, o chefe, o status e o fim da campanha.

## Requirements

### Requirement: Calendário de 30 dias
A campanha SHALL durar 30 dias, cada um com três períodos: Manhã, Tarde e Noite. Cada duelo da campanha SHALL gastar um
período, qualquer que seja o resultado (vitória, derrota, empate ou desistência). Conversar, entrar na loja, abrir
pacotes, editar o deck, ver os laços ou o status e voltar ao mapa MUST NOT gastar período. Depois do duelo da noite do
dia 30, a campanha SHALL terminar.

#### Scenario: Duelo gasta o período
- **WHEN** o jogador duela na manhã do dia 3
- **THEN** ao voltar ao mapa é a tarde do dia 3

#### Scenario: Noite vira manhã
- **WHEN** o jogador duela na noite do dia 3
- **THEN** ao voltar ao mapa é a manhã do dia 4

#### Scenario: Conversar não gasta
- **WHEN** o jogador conversa com um duelista e volta ao mapa
- **THEN** o dia e o período continuam os mesmos

#### Scenario: Fim
- **WHEN** o jogador termina um duelo na noite do dia 30
- **THEN** a campanha termina e o mapa não aceita mais duelos

### Requirement: Mapa da Cidade de Domino
O mapa SHALL mostrar o panorama da Cidade de Domino em todos os tiers, sem lugares fixos nem nomes de lugar: só as
cabeças de quem está por perto, cada uma num ponto do panorama. O mapa SHALL rolar na horizontal e ter um tom diferente
para Manhã, Tarde e Noite. O cabeçalho SHALL mostrar o dia, o período, o DP, a barra dos dias e o progresso do tier
atual ("X/N vencidos", com N o número de duelistas comuns do tier, e a situação do chefe dele). A barra de baixo do mapa
SHALL dar acesso a Deck, Coleção, Laços e Loja. O botão de menu do cabeçalho SHALL abrir as Opções, com Status da
campanha, Voltar ao título e Fechar.

#### Scenario: Cabeçalho
- **WHEN** o jogador abre o mapa na tarde do dia 5 com 450 DP e 2 duelistas do Tier 1 já vencidos
- **THEN** o cabeçalho mostra "Dia 5", "Tarde", "450 DP" e "2/4 vencidos"

#### Scenario: Noite
- **WHEN** é noite
- **THEN** o mapa e o fundo do encontro aparecem com o tom azulado da noite

#### Scenario: Sem nomes de lugar
- **WHEN** o jogador abre o mapa
- **THEN** aparecem só as cabeças dos duelistas, sem nome de lugar nem contador

#### Scenario: Status pelas Opções
- **WHEN** o jogador toca no menu do cabeçalho e em "Status da campanha"
- **THEN** abre a tela de Status, e Fechar volta ao mapa sem sair dele

### Requirement: Quem aparece em cada período
Em cada período, SHALL aparecer de 2 a 4 dos duelistas comuns do tier atual. Depois que um tier abrir, todos os
comuns dos tiers anteriores SHALL continuar aparecendo (no Tier 2, os amigos do Tier 1: Tristan, Téa, Joey e Bakura; no
Tier 3, também os cinco comuns do Tier 2). Os chefes já liberados SHALL aparecer em todo período. Cada duelista SHALL
ocupar um ponto diferente do panorama, sem cabeças sobrepostas, mesmo com todos os comuns dos tiers anteriores e os três
chefes no mapa: no Tier 1, sorteado entre os pontos do mapa; depois, espalhado pelo panorama, com o tier atual
perto do centro (a parte que a tela mostra ao abrir) e cada tier anterior mais longe dele. O sorteio de quem aparece e dos pontos MUST ser reproduzível pela semente da campanha, pelo dia e pelo
período: fechar e abrir o app no mesmo período mostra os mesmos duelistas nos mesmos pontos. Tocar numa cabeça SHALL
abrir o encontro com aquele duelista. Um duelista com evento de laço aberto SHALL ter um "!" na cabeça; um chefe SHALL
ter moldura dourada larga, com um anel dourado girando em volta (sem coroa).

#### Scenario: Mesmo período, mesma gente
- **WHEN** o jogador fecha o app de manhã no dia 2 e o abre de novo
- **THEN** o mapa mostra os mesmos duelistas nos mesmos pontos

#### Scenario: Tocar na cabeça
- **WHEN** o jogador toca na cabeça do Joey
- **THEN** o encontro com o Joey começa, sem painel intermediário

#### Scenario: Amigos no Tier 2
- **WHEN** o tier atual é o Tier 2
- **THEN** o mapa mostra de 2 a 4 duelistas do Tier 2 perto do centro e os 4 amigos do Tier 1 mais para os lados, e o
  evento de laço aberto da Téa continua com "!"

#### Scenario: Mapa cheio no Tier 3
- **WHEN** o tier atual é o Tier 3, os quatro comuns dele estão no período e Yugi, Pegasus e Kaiba estão liberados
- **THEN** o mapa mostra as 16 cabeças sem nenhuma encostada em outra: o Tier 3 perto do centro, os comuns do Tier 2
  mais para os lados e os amigos do Tier 1 mais longe ainda

### Requirement: Chefe Yugi
O Yugi SHALL aparecer no mapa em todo período depois que o jogador vencer cada um dos 4 duelistas comuns do Tier 1 ao
menos uma vez, e SHALL continuar aparecendo nos tiers seguintes. Antes disso, o progresso do tier SHALL dizer que é
preciso vencer todos para desafiá-lo. No mapa, o Yugi aparece com a moldura dourada de chefe.

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

### Requirement: Saudação conforme o laço
A saudação SHALL seguir o laço: a da rota escolhida (amizade ou romance), senão a de proximidade a partir de 2 corações,
senão a comum. A variante da fala SHALL ser reproduzível pela semente, pelo dia, pelo período e pelo duelista.

#### Scenario: Dois corações
- **WHEN** o jogador encontra a Tea com 210 de afinidade e sem rota escolhida
- **THEN** a saudação é uma das falas de proximidade da Tea

### Requirement: Falas da campanha
As falas SHALL vir do conteúdo do nativo, com:
- o nome do jogador no lugar de `{nome}`;
- o trecho certo pelo tratamento escolhido (ele, ela ou neutro);
- a expressão do personagem em cada fala.

Quando quem fala é o jogador, o avatar do perfil SHALL entrar em cena e o personagem que não fala SHALL ficar
escurecido.

#### Scenario: Tratamento
- **WHEN** uma fala tem um trecho para cada tratamento e o jogador escolheu "Ela"
- **THEN** a fala mostra o trecho feminino

#### Scenario: Fala do jogador
- **WHEN** a cena de primeira vitória tem uma fala do jogador
- **THEN** o avatar do jogador aparece em cena com o nome dele, e o duelista fica escurecido

### Requirement: Conversa
Conversar SHALL oferecer 4 temas: Duelos, Escola, Hobbies e Boatos. O duelista SHALL responder conforme gosta ou não do
tema, e os corações SHALL mostrar a mudança. Por dia e por duelista, um entre Duelos, Escola e Hobbies SHALL ser o tema
ruim; Boatos nunca é ruim. Cada duelista SHALL aceitar uma conversa por dia; depois dela, Conversar fica indisponível
com esse duelista até o dia seguinte.

#### Scenario: Uma por dia
- **WHEN** o jogador já conversou com a Tea hoje e a encontra de novo à noite
- **THEN** o botão Conversar está indisponível

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

### Requirement: Falas depois do duelo
Depois do duelo, SHALL aparecer o resultado e a fala de depois, de volta no lugar:
- na derrota, a fala de derrota do jogador;
- na vitória, a primeira que valer: o fim do evento de laço (se for o duelo do evento), a derrota do chefe (primeira
  vitória contra o Yugi), a cena de primeira vitória (primeira contra o duelista) ou a fala de vitória comum.

Depois disso, o jogo volta ao mapa no período seguinte.

#### Scenario: Primeira vitória
- **WHEN** o jogador vence o Bakura pela primeira vez
- **THEN** depois do resultado aparece a cena de primeira vitória, e então o mapa no período seguinte

### Requirement: Duelo interrompido
Se o app fechar durante um duelo da campanha, o período MUST NOT ser gasto. Ao voltar, o jogo SHALL perguntar se o
jogador quer duelar de novo (o duelo recomeça do início) ou voltar ao mapa. A desistência SHALL contar como derrota e
gastar o período.

#### Scenario: App fechado no meio
- **WHEN** o app fecha durante um duelo na manhã do dia 4 e é aberto de novo
- **THEN** ainda é a manhã do dia 4 e o jogo pergunta se quer retomar o duelo

### Requirement: Status da campanha
A tela de Status SHALL mostrar o dia, os dias restantes, as vitórias, as derrotas e o DP.

#### Scenario: Status no dia 10
- **WHEN** o jogador abre o status na manhã do dia 10 com 12 vitórias e 5 derrotas
- **THEN** a tela mostra Dia 10, 21 dias restantes, 12 vitórias e 5 derrotas

### Requirement: Epílogo
Quando a campanha terminar, SHALL tocar o epílogo do duelista com mais eventos de laço vencidos (no empate, o de mais
afinidade; depois, a ordem do conteúdo), na versão de romance se essa foi a rota escolhida com ele, senão na de amizade.
Antes da última fala, o epílogo SHALL incluir as lembranças das escolhas feitas nos eventos com esse duelista, na
ordem dos eventos. Sem nenhum evento vencido, não há epílogo.

#### Scenario: Epílogo com a Tea
- **WHEN** a campanha termina com 4 eventos vencidos com a Tea (rota romance) e 2 com o Joey
- **THEN** toca o epílogo de romance da Tea e depois a tela de fim

#### Scenario: Epílogo lembra uma escolha
- **WHEN** a campanha termina no epílogo do Joey e, no 5º evento dele, o jogador escolheu uma opção com lembrança
- **THEN** a fala dessa lembrança toca no epílogo, antes da última fala do Joey

### Requirement: Tela de fim
Depois do epílogo, SHALL aparecer a tela "Fim da campanha" com vitórias, derrotas, DP ganho, cartas diferentes e chefes
vencidos, e os botões Rever epílogo, Ver a coleção e Nova campanha. Uma campanha terminada MUST NOT aceitar mais duelos.
Nova campanha SHALL pedir confirmação e recomeçar do dia 1.

#### Scenario: Continuar depois do fim
- **WHEN** o jogador abre a campanha terminada pelo título
- **THEN** aparece a tela de fim, com Rever epílogo, Ver a coleção e Nova campanha

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
