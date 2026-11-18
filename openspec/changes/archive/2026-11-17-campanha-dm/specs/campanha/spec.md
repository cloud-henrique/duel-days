# Spec Delta

## Purpose

Define a campanha Duel Monsters (Tier 1) portada do app nativo: o calendário de 30 dias, o mapa da Cidade de Domino com
quem aparece em cada período, o encontro com falas, conversa e duelo, o chefe, o status e o fim da campanha.

## ADDED Requirements

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
O mapa SHALL mostrar a Cidade de Domino com 5 lugares, cada um com um duelista fixo:
- Escola Domino: Tristan;
- Burger World: Tea;
- Fliperama: Joey;
- Parque: Bakura;
- Loja de Jogos do Vovô: a loja, onde fica o chefe Yugi.

O mapa SHALL rolar na horizontal e ter um tom diferente para Manhã, Tarde e Noite. O cabeçalho SHALL mostrar o dia, o
período, o DP, a barra dos dias e o progresso do tier ("X/4 vencidos" e a situação do Yugi). O mapa SHALL dar acesso a
Deck, Coleção, Laços, Loja e Status.

#### Scenario: Cabeçalho
- **WHEN** o jogador abre o mapa na tarde do dia 5 com 450 DP e 2 duelistas já vencidos
- **THEN** o cabeçalho mostra "Dia 5", "Tarde", "450 DP" e "2/4 vencidos"

#### Scenario: Noite
- **WHEN** é noite
- **THEN** o mapa e o fundo dos lugares aparecem com o tom azulado da noite

### Requirement: Quem aparece em cada período
Em cada período, SHALL aparecer de 2 a 4 dos duelistas comuns, cada um no seu lugar. O sorteio MUST ser reproduzível
pela semente da campanha, pelo dia e pelo período: fechar e abrir o app no mesmo período mostra os mesmos duelistas.
Tocar num lugar SHALL abrir o painel com quem está lá (com os corações de cada um); um lugar vazio diz que não há
ninguém. Um duelista com evento de laço aberto SHALL ter um "!" no mapa.

#### Scenario: Mesmo período, mesma gente
- **WHEN** o jogador fecha o app de manhã no dia 2 e o abre de novo
- **THEN** o mapa mostra os mesmos duelistas nos mesmos lugares

#### Scenario: Lugar vazio
- **WHEN** o Tristan não foi sorteado neste período e o jogador toca na Escola Domino
- **THEN** o painel diz que não há ninguém lá agora

### Requirement: Chefe Yugi
O Yugi SHALL aparecer na Loja de Jogos do Vovô em todo período depois que o jogador vencer cada um dos 4 duelistas
comuns ao menos uma vez. Antes disso, o progresso do tier SHALL dizer que é preciso vencer todos para desafiá-lo. No
mapa, o Yugi aparece com retrato, moldura dourada e coroa.

#### Scenario: Liberar o chefe
- **WHEN** o jogador vence o último dos 4 duelistas comuns que ainda não tinha vencido
- **THEN** no período seguinte o Yugi aparece na loja e o progresso diz que ele está esperando

#### Scenario: Loja com o chefe
- **WHEN** o Yugi está disponível e o jogador toca na loja
- **THEN** o painel oferece "Entrar na loja" e "Encontrar" o Yugi

### Requirement: Falas e prêmio do chefe
Enquanto o Yugi não for vencido, o duelo com ele SHALL começar com a fala de entrada do chefe, e a primeira vitória SHALL
mostrar a fala de derrota do chefe. Vencer o Yugi MUST NOT encerrar a campanha. Se a primeira vitória contra ele vier
até o dia 7, o jogador SHALL ganhar um pacote fechado da coleção mais recente à venda.

#### Scenario: Yugi vencido no dia 6
- **WHEN** o jogador vence o Yugi pela primeira vez no dia 6
- **THEN** aparece a fala de derrota do chefe, um pacote fechado entra na loja e a campanha continua

### Requirement: Encontro
Ao encontrar um duelista, o jogo SHALL mostrar o fundo do lugar (no tom do período), o duelista de corpo inteiro, os
corações dele e a saudação na caixa de fala, com um botão para pular as falas. Depois da saudação, o menu SHALL ter:
- o título do evento de laço aberto, como botão principal, quando houver;
- Conversar;
- Duelar;
- Voltar ao mapa (sem gastar período).

#### Scenario: Primeiro encontro
- **WHEN** o jogador encontra o Joey pela primeira vez
- **THEN** aparece o Joey no Fliperama com uma saudação comum, e depois o menu com Conversar, Duelar e Voltar

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
Duelar SHALL mostrar a fala de antes do duelo no lugar e então abrir o duelo contra o deck do duelista, do conteúdo do
nativo (Main de 40 e Extra quando houver), com o deck ativo do jogador. Um deck inválido MUST impedir o duelo e levar ao editor.

#### Scenario: Deck do oponente
- **WHEN** o jogador duela contra o Joey
- **THEN** o Joey usa o deck dele do conteúdo do nativo, não um deck aleatório

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
Sem nenhum evento vencido, não há epílogo.

#### Scenario: Epílogo com a Tea
- **WHEN** a campanha termina com 4 eventos vencidos com a Tea (rota romance) e 2 com o Joey
- **THEN** toca o epílogo de romance da Tea e depois a tela de fim

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
antiga SHALL abrir no título com o perfil intacto e a campanha por começar.

#### Scenario: Save antigo
- **WHEN** um save da história antiga é carregado
- **THEN** o título mostra o mesmo perfil e "Campanha" começa do dia 1
