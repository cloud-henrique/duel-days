# duel-hud Specification

## Purpose

Define o layout, o dimensionamento e o conteúdo visual da tela de duelo: campo e zonas, face da carta, placas dos
duelistas, barra de fases com narrador, e botões de ação e menu.

## Requirements

### Requirement: Medidas derivadas da largura da tela
A tela de duelo SHALL derivar o tamanho das zonas, das colunas de pilhas, do campo e das cartas da mão da largura e da
altura disponíveis, com tetos fixos. A altura da zona SHALL ser a menor entre:
- a que cabe na largura, com 3 colunas de zonas e as 2 colunas de pilhas;
- a que cabe nas 4 fileiras com a altura que sobra.

A largura do campo SHALL acompanhar a zona, e o campo fica centralizado. Quando falta altura, a mão SHALL encolher
primeiro, até a carta da mão chegar a 60pt de largura; só depois as zonas encolhem.

#### Scenario: iPhone de 390×844 no app instalado
- **WHEN** o duelo é aberto num viewport de 390×844
- **THEN** uma carta virada para cima numa zona de monstro tem pelo menos 60pt de largura, e todo o duelo cabe na tela
  sem rolagem

#### Scenario: Safari com barras (altura visível menor)
- **WHEN** o viewport tem 390 de largura e ~709 de altura
- **THEN** a mão encolhe antes das zonas, nenhuma carta da mão fica cortada pela borda inferior, e a carta da zona não
  fica menor que 46pt de largura

#### Scenario: Telas estreitas e largas
- **WHEN** o viewport tem 360×780, 430×932 ou 375×667
- **THEN** nada do duelo transborda na horizontal nem na vertical, a carta da zona não fica menor que 46pt de largura e
  o campo obedece à mesma fórmula

### Requirement: Proporção das fileiras do campo
Todas as zonas do campo (monstros e Magia/Armadilha) SHALL ter a mesma altura e a proporção de uma carta em pé, com um
respiro pequeno nas laterais. A faixa central (barra de fases e narrador) SHALL ter 38pt de altura e ocupar a largura do
campo. As pilhas de cada coluna SHALL ocupar juntas a altura das duas fileiras de zonas do seu lado.

#### Scenario: Fileiras medidas
- **WHEN** o campo é renderizado com zona de altura Z
- **THEN** cada zona de monstro e de Magia/Armadilha tem altura Z (±1), a faixa central tem 38pt (±1) e nenhuma coluna
  de pilhas passa da altura das duas fileiras do seu lado

### Requirement: Carta no campo ocupa a zona
Uma carta virada para cima ou para baixo em posição de ataque SHALL ocupar toda a altura da sua zona. Um monstro em
defesa SHALL aparecer girado 90°, reduzido para caber inteiro na largura da zona, com os selos legíveis em pé.

#### Scenario: Monstro em ataque
- **WHEN** um monstro está em posição de ataque numa zona
- **THEN** a altura da carta é igual à altura da zona e o selo mostra ATK em destaque e DEF atenuado

#### Scenario: Monstro em defesa
- **WHEN** um monstro está em posição de defesa
- **THEN** a carta aparece girada 90°, sem passar das bordas laterais da zona, o selo mostra DEF em destaque e o texto
  do selo não fica girado

### Requirement: Face própria da carta
Na mão, no campo e no destaque de ativação, as cartas SHALL ser desenhadas por um template próprio. O template tem
moldura pela cor do tipo, nome em português (quando houver tradução), estrelas ou ícone do tipo, arte recortada sem a
moldura oficial e uma tarja inferior. Todos os elementos MUST escalar com a largura da carta.

#### Scenario: Tarja de monstro
- **WHEN** um monstro de ATK 2000 e DEF 1500 está na mão
- **THEN** a tarja mostra `2000 / 1500` numa altura de cerca de 13,75% da largura da carta, sem cortar o texto

#### Scenario: Tarja de Magia e Armadilha
- **WHEN** uma Magia ou uma Armadilha está na mão
- **THEN** a tarja mostra `MAGIA` ou `ARMADILHA` na mesma proporção da tarja de monstro

#### Scenario: Nome em português
- **WHEN** a carta tem tradução em português
- **THEN** o nome da face aparece em português e, se for longo, encolhe ou termina em reticências sem sair da moldura

#### Scenario: Arte recortada indisponível
- **WHEN** a arte recortada de uma carta não existe ou não carrega
- **THEN** a área da arte mostra a imagem oficial da carta em vez de ficar vazia

### Requirement: Valor "?" de ATK/DEF
Os valores de ATK ou DEF indefinidos ("?") SHALL aparecer como `?` em todo lugar da interface.

#### Scenario: Monstro com ATK "?"
- **WHEN** um monstro cujo ATK é "?" (ex.: Tyranno Infinity) é mostrado na mão, no campo ou na folha
- **THEN** o ATK aparece como `?`, nunca como um número como `4294967294`

### Requirement: Placa do duelista
Cada duelista SHALL ter uma placa compacta (~48pt de altura) com:
- avatar;
- nome;
- LP em fonte numérica;
- barra de LP colorida pela porcentagem;
- o contador de cartas na mão.

O cemitério e o deck MUST NOT ficar na placa (eles ficam nas colunas de pilhas). A placa do duelista da vez SHALL ter a
borda acesa.

#### Scenario: Duelista da vez
- **WHEN** começa o turno do oponente
- **THEN** a borda da placa do oponente acende e a do jogador apaga

#### Scenario: Cemitério vazio e com cartas
- **WHEN** o cemitério está vazio ou tem cartas
- **THEN** a placa mostra avatar, nome, LP, barra e o contador da mão, sem cemitério nem contador do deck; o cemitério
  aparece só na coluna de pilhas

#### Scenario: Cor da barra de LP
- **WHEN** o LP está em 50% ou mais, entre 25% e 50%, ou abaixo de 25% do inicial
- **THEN** a barra fica verde, amarela ou vermelha, respectivamente

### Requirement: Mudança de LP visível
Quando o LP de um duelista muda, a placa SHALL mostrar a variação ("−500" em vermelho ou "+500" em verde) ao lado do LP
por cerca de 1,2 segundo. O número do LP SHALL contar até o valor novo em vez de trocar de uma vez. O layout da placa
MUST NOT se deslocar.

#### Scenario: Dano de batalha
- **WHEN** o jogador sofre 800 de dano com 4000 LP
- **THEN** aparece "−800" em vermelho ao lado do LP, o número conta de 4000 até 3200 em menos de 1 segundo, e o popup some depois de ~1,2s

### Requirement: Barra de fases com narrador
A barra de fases SHALL mostrar o turno e um chip por fase, com a fase atual destacada, e sua largura SHALL acompanhar o
conteúdo sem cortar nenhum chip. Logo abaixo, SHALL mostrar o último evento do duelo numa linha. Não SHALL haver balão
flutuante de eventos.

#### Scenario: Chips visíveis em tela estreita
- **WHEN** o viewport tem 360 de largura
- **THEN** todos os chips de fase aparecem inteiros e legíveis

#### Scenario: Novo evento
- **WHEN** o oponente invoca um monstro
- **THEN** a linha do narrador passa a mostrar o texto desse evento e nenhum balão flutuante aparece

#### Scenario: Histórico completo
- **WHEN** o jogador toca no botão de histórico
- **THEN** a lista completa dos eventos do duelo é mostrada

### Requirement: Botões de ação compactos
O avanço de fase SHALL ser um botão só, de cerca de 64×60, com o rótulo da fase seguinte: BATALHA na Main Phase 1 (se
houver batalha) e FIM DO TURNO na Battle Phase ou quando não houver outra fase. MUST NOT haver um segundo botão que pule
uma fase; terminar o turno pela Main Phase 1 passa pela Battle Phase. Como o formato não tem Main Phase 2, MUST NOT
haver botão nem chip de MAIN 2.

#### Scenario: Main Phase 1 com batalha disponível
- **WHEN** o jogador está na Main Phase 1 e pode ir para a batalha ou encerrar
- **THEN** aparece só o botão BATALHA (~64×60), sem "Encerrar"

#### Scenario: Battle Phase
- **WHEN** o jogador está na Battle Phase
- **THEN** aparece só o botão FIM DO TURNO, e a barra de fases não tem o chip M2

### Requirement: Desistir pelo menu
Desistir do duelo SHALL ser feito por um botão de menu (~44×40) que abre opções com "Desistir". A desistência MUST
pedir confirmação.

#### Scenario: Desistir
- **WHEN** o jogador toca no menu, depois em "Desistir", e confirma
- **THEN** o duelo termina como derrota

#### Scenario: Toque acidental
- **WHEN** o jogador abre o menu e toca fora dele
- **THEN** o menu fecha e o duelo continua

### Requirement: Mão do oponente com verso de carta
A mão do oponente SHALL ser mostrada como versos de carta pequenos e sobrepostos, um por carta, acima do campo.

#### Scenario: Oponente com 5 cartas
- **WHEN** o oponente tem 5 cartas na mão
- **THEN** aparecem 5 versos sobrepostos, centralizados, sem cobrir a placa do oponente

### Requirement: Respiro da tela
Fora da tela larga, a tela de duelo SHALL manter margem lateral e espaçamento entre placa, campo e mão. MUST NOT haver
faixa vazia de fundo entre a placa do oponente e o campo. O espaço vertical que sobrar depois do tamanho máximo das zonas
SHALL ficar entre a placa do jogador e a mão.

#### Scenario: Altura sobrando
- **WHEN** o viewport tem 430×932
- **THEN** há pelo menos 12pt de margem lateral nas placas, o campo começa logo abaixo dos versos da mão do oponente, e
  o espaço livre vertical aparece entre a placa do jogador e a mão

### Requirement: Menu da altura da placa
O botão de menu do duelo, ao lado da placa do oponente, SHALL ter a mesma altura da placa, sem vão abaixo dele.

#### Scenario: Topo do duelo
- **WHEN** o duelo é exibido
- **THEN** o botão de menu e a placa do oponente começam e terminam na mesma altura

### Requirement: Zona visível durante a encenação
Enquanto uma carta do campo é encenada (virar, mudar de posição, ativar, sair da zona), a zona tracejada SHALL continuar
visível; só a carta dentro dela é escondida enquanto o efeito a representa.

#### Scenario: Armadilha virada
- **WHEN** uma Armadilha baixada é virada para ser ativada
- **THEN** o tracejado da zona continua no lugar durante o giro

### Requirement: Arte da Magia de Campo no tabuleiro
Com uma Magia de Campo virada para cima em jogo, o fundo do tabuleiro (o contêiner de todas as zonas) SHALL mostrar a
arte recortada da carta, cobrindo o tabuleiro, a 50% de opacidade, por trás das zonas. Com duas em jogo, vale a última
ativada; quando ela sai, vale a que restar; sem nenhuma, o tabuleiro volta ao fundo padrão.

#### Scenario: Campo trocado
- **WHEN** o jogador ativa Umi
- **THEN** o tabuleiro passa a mostrar a arte de Umi a 50% por trás das zonas

#### Scenario: Campo destruído
- **WHEN** a única Magia de Campo em jogo é destruída
- **THEN** o tabuleiro volta ao fundo padrão

### Requirement: Campo plano
O campo SHALL ser desenhado sem perspectiva: as zonas do oponente e as do jogador têm o mesmo tamanho na tela. A
profundidade SHALL vir de luz, sombra e moldura. A metade do campo de quem joga o turno SHALL ter uma luz mais forte
que a outra.

#### Scenario: Zonas iguais dos dois lados
- **WHEN** o duelo é exibido
- **THEN** uma zona de monstro do oponente e uma do jogador têm a mesma largura e a mesma altura (±1pt)

#### Scenario: Luz do turno
- **WHEN** começa o turno do oponente
- **THEN** a metade do oponente no campo passa a ter a luz mais forte e a do jogador volta ao normal

### Requirement: Colunas de pilhas
Cada metade do campo SHALL ter as 3 colunas de zonas no meio e uma coluna de pilhas, nunca mais larga que as zonas, de
cada lado, como no Duel Links. O jogador tem a Zona de Campo e o Extra Deck à esquerda, e as Banidas (ficha pequena no topo),
o Cemitério e o Deck à direita. O oponente tem a mesma disposição girada 180°. Cada pilha SHALL mostrar o ícone e a
quantidade de cartas.

#### Scenario: Disposição das pilhas
- **WHEN** o duelo é exibido
- **THEN** à esquerda dos monstros do jogador fica a Zona de Campo e, abaixo dela, o Extra; à direita ficam Banidas,
  Cemitério e Deck, de cima para baixo; no lado do oponente, o Deck fica no alto à esquerda e a Zona de Campo à direita

#### Scenario: Pilha vazia
- **WHEN** o jogador não tem cartas banidas
- **THEN** a ficha de Banidas continua no lugar, apagada, com o ícone e a quantidade 0

### Requirement: Conteúdo visível das pilhas
O Cemitério e as Banidas SHALL mostrar a carta do topo: a face, ou o verso se a carta foi banida virada para baixo. O
Deck e o Extra Deck SHALL mostrar o verso. O Deck SHALL ter uma espessura que cresce com a quantidade de cartas. A
quantidade de cartas SHALL ser mostrada para os dois duelistas em todas as pilhas.

#### Scenario: Topo do cemitério
- **WHEN** um monstro do oponente vai para o cemitério
- **THEN** a pilha de Cemitério do oponente passa a mostrar esse monstro e a quantidade aumenta em 1

#### Scenario: Extra Deck do oponente
- **WHEN** o oponente tem 3 cartas no Extra Deck
- **THEN** a pilha de Extra do oponente mostra o verso e o número 3, sem revelar quais são

### Requirement: Zona de Campo na coluna de pilhas
A Zona de Campo de cada duelista SHALL ficar na coluna de pilhas, na altura dos monstros: à esquerda do jogador e à
direita do oponente. Ela SHALL continuar sendo uma zona do campo: mostra a Magia de Campo em jogo, recebe o destaque
quando pode ser escolhida e abre a folha da carta ao toque. Uma Magia de Campo ativada SHALL aparecer nela enquanto o
motor a mantiver.

#### Scenario: Ativar Umi
- **WHEN** o jogador ativa uma Magia de Campo
- **THEN** a carta aparece na Zona de Campo do jogador e não vai para o cemitério

#### Scenario: Escolher a Magia de Campo como alvo
- **WHEN** um efeito pede para escolher uma carta no campo e a Magia de Campo do oponente é uma opção
- **THEN** a Zona de Campo do oponente aparece destacada e pode ser tocada

### Requirement: Lista das pilhas
Um toque no Cemitério ou nas Banidas de qualquer duelista, ou no Extra Deck do jogador, SHALL abrir a lista das cartas
daquela pilha. Na lista, um toque numa carta SHALL abrir a folha da carta. O Extra Deck do oponente MUST NOT abrir lista.

#### Scenario: Ver as banidas do oponente
- **WHEN** o jogador toca nas Banidas do oponente, que tem 2 cartas banidas viradas para cima
- **THEN** abre a lista com as 2 cartas, e um toque numa delas abre a folha dessa carta

#### Scenario: Extra Deck do oponente
- **WHEN** o jogador toca no Extra Deck do oponente
- **THEN** nenhuma lista abre

### Requirement: Mão reta
As cartas da mão do jogador SHALL ficar em fila reta, sem arco nem inclinação, sobrepostas só quando faltar largura. A
mão MUST NOT reservar altura para a carta selecionada: ela sobe por cima do que estiver acima da mão (a placa do jogador
no retrato, a borda do campo em tela larga). O espaço economizado SHALL ir para as zonas.

#### Scenario: Carta selecionada
- **WHEN** o jogador toca numa carta da mão
- **THEN** a carta sobe por cima da placa do jogador e as outras continuam alinhadas na mesma altura

#### Scenario: Carta selecionada em tela larga
- **WHEN** o jogador clica numa carta da mão em tela larga
- **THEN** a carta sobe sem empurrar o campo, e as outras continuam alinhadas na mesma altura

### Requirement: Campo na largura da tela
Fora da tela larga, o campo SHALL poder ocupar a largura da tela até uma borda pequena (~4pt de cada lado), sobre a
margem lateral das placas e da mão. Quando a altura é que limita as zonas, as colunas de pilhas SHALL crescer até a
largura de uma zona para o campo não deixar faixas vazias nas laterais.

#### Scenario: Safari com barras
- **WHEN** o viewport tem 390 de largura e ~709 de altura
- **THEN** o campo vai de ~4pt da borda esquerda a ~4pt da direita, sem faixa vazia de fundo nas laterais

### Requirement: Duelo em três colunas na tela larga
Em tela larga, o duelo SHALL ter 3 colunas: à esquerda, o menu e a placa do oponente em cima e a placa do jogador
embaixo; no centro, a mão do oponente, o campo e a mão do jogador; à direita, o painel da carta, com o botão de avançar
fase no pé. As zonas SHALL derivar só da altura disponível. As placas MUST NOT se esticar pela largura da tela.

#### Scenario: Desktop 1440×900
- **WHEN** um duelo é aberto num viewport de 1440×900
- **THEN** a placa do oponente fica no alto da coluna esquerda e a do jogador embaixo, o campo fica no centro com a mão
  logo abaixo, e nada transborda nem rola

#### Scenario: Tela larga baixa
- **WHEN** o viewport tem 1280×650
- **THEN** a mão encolhe antes das zonas, nenhuma carta fica cortada e a carta da zona não fica menor que 46pt de largura

#### Scenario: Botão de fase
- **WHEN** é a Main Phase 1 do jogador em tela larga
- **THEN** o botão BATALHA aparece no pé da coluna direita

### Requirement: Histórico recente na coluna esquerda
Em tela larga, o espaço entre as duas placas SHALL mostrar as últimas linhas do histórico do duelo (os mesmos textos do
narrador), com a mais nova embaixo.

#### Scenario: Oponente invoca
- **WHEN** o oponente invoca um monstro em tela larga
- **THEN** a linha da invocação aparece por último no histórico da coluna esquerda

### Requirement: Painel fixo da carta na tela larga
Em tela larga, o detalhe da carta (face grande, dados, texto e ligações) SHALL ficar num painel fixo na coluna direita,
no lugar da folha modal. O painel MUST NOT escurecer nem cobrir o campo ou a mão. Sem carta em foco, ele SHALL mostrar
uma dica curta.

#### Scenario: Clique numa carta da mão
- **WHEN** o jogador clica numa carta da mão em tela larga
- **THEN** o painel da direita mostra a carta, e o campo continua visível e sem véu

#### Scenario: Trocar de carta
- **WHEN** há uma carta fixada no painel e o jogador clica em outra carta visível
- **THEN** o painel passa a mostrar a nova carta, sem precisar fechar a anterior

### Requirement: Passar o mouse mostra a carta
Em tela larga, com mouse ou trackpad, passar o ponteiro sobre uma carta visível (zona, mão, topo do Cemitério ou das
Banidas) SHALL mostrar essa carta no painel. Ao sair dela, o painel SHALL voltar à carta fixada, se houver. Cartas
viradas do oponente e versos de deck MUST NOT mudar o painel. Sem ponteiro fino (só toque), não há hover.

#### Scenario: Hover numa zona do oponente
- **WHEN** o jogador passa o mouse sobre um monstro virado para cima do oponente
- **THEN** o painel mostra esse monstro, e ao tirar o mouse volta à carta fixada

#### Scenario: Monstro virado do oponente
- **WHEN** o jogador passa o mouse sobre um monstro virado para baixo do oponente
- **THEN** o painel não muda

### Requirement: Fixar e soltar a carta
Em tela larga, clicar numa carta visível SHALL fixá-la no painel. Clicar de novo na carta fixada ou apertar Esc SHALL
soltá-la. Durante a encenação, o clique MUST NOT fixar carta. Quando há uma escolha no tabuleiro, o clique numa opção
válida SHALL marcar a escolha, como no retrato.

#### Scenario: Soltar com Esc
- **WHEN** há uma carta fixada e o jogador aperta Esc
- **THEN** o painel volta à dica e as ações somem

### Requirement: Ações sobre a carta na tela larga
Em tela larga, as ações da carta fixada (Invocar, Baixar, Ativar, Atacar, Mudar posição…) SHALL aparecer numa fileira
de botões logo acima da própria carta, na mão ou na zona, e acompanhar a posição dela. Sem espaço acima, a fileira SHALL
ir para baixo da carta. As ações MUST NOT aparecer no painel da direita. No retrato, as ações continuam na folha da
carta.

#### Scenario: Invocar da mão
- **WHEN** o jogador clica num monstro da mão que pode ser invocado, em tela larga
- **THEN** os botões Invocar e Baixar aparecem logo acima da carta erguida, e clicar em Invocar faz a invocação

#### Scenario: Atacar
- **WHEN** na Battle Phase o jogador clica num monstro seu que pode atacar
- **THEN** o botão Atacar aparece logo acima da zona dele

### Requirement: Escolhas na coluna direita
Em tela larga, os pedidos do duelo (responder na corrente, escolher cartas fora do tabuleiro, ordenar, escolher
posição, opções) e a barra de escolha no tabuleiro SHALL aparecer na coluna direita, sem cobrir o campo. Enquanto houver
um pedido, a carta em foco SHALL continuar visível de forma compacta acima dele. "Ver campo" MUST NOT existir em tela
larga.

#### Scenario: Corrente do oponente
- **WHEN** o oponente ativa uma armadilha e o jogador pode responder, em tela larga
- **THEN** a pergunta da corrente aparece na coluna direita, e o campo e a mão continuam visíveis e clicáveis para ler as
  cartas
