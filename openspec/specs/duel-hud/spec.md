# duel-hud Specification

## Purpose

Define o layout, o dimensionamento e o conteúdo visual da tela de duelo: campo e zonas, face da carta, placas dos
duelistas, barra de fases com narrador, e botões de ação e menu.

## Requirements

### Requirement: Medidas derivadas da largura da tela
A tela de duelo SHALL derivar o tamanho do campo, das zonas e das cartas da mão da largura disponível, com tetos fixos.
O campo MUST ocupar `min(W−40, 500)` pontos de largura em qualquer altura de tela.

#### Scenario: iPhone de 390×844 no app instalado
- **WHEN** o duelo é aberto num viewport de 390×844
- **THEN** o campo tem 350pt (±2) de largura, a zona de monstro mede 61×61 (±2) e a carta da mão tem 91pt (±2) de largura

#### Scenario: Safari com barras (altura visível menor)
- **WHEN** o viewport tem 390 de largura e ~709 de altura
- **THEN** o campo continua com 350pt de largura e só a mão diminui, sem nenhuma carta da mão cortada pela borda inferior

#### Scenario: Telas estreitas e largas
- **WHEN** o viewport tem 360 ou 430 de largura
- **THEN** nada do duelo transborda na horizontal e o campo obedece à mesma fórmula

### Requirement: Proporção das fileiras do campo
As zonas de Magia/Armadilha SHALL ter a mesma altura da zona de monstro, para as cartas de Magia/Armadilha ficarem
legíveis (mesmo que o campo pareça menos inclinado). A faixa central (zonas de campo e barra de fases) SHALL ter 46pt
de altura.

#### Scenario: Fileiras medidas
- **WHEN** o campo é renderizado com zona de monstro de altura Z
- **THEN** cada zona de Magia/Armadilha tem altura Z (±1) e a faixa central tem 46pt (±1)

### Requirement: Carta no campo ocupa a zona
Uma carta no campo SHALL ocupar toda a altura da sua zona. Um monstro em defesa SHALL aparecer girado 90°, com os selos
legíveis em pé.

#### Scenario: Monstro em ataque
- **WHEN** um monstro está em posição de ataque numa zona
- **THEN** a altura da carta é igual à altura da zona e o selo mostra ATK em destaque e DEF atenuado

#### Scenario: Monstro em defesa
- **WHEN** um monstro está em posição de defesa
- **THEN** a carta aparece girada 90°, o selo mostra DEF em destaque e o texto do selo não fica girado

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
Cada duelista SHALL ter uma placa compacta (~60pt de altura) com:
- avatar;
- nome;
- LP em fonte numérica;
- barra de LP colorida pela porcentagem;
- contadores de deck e mão;
- a carta do topo do cemitério.

A placa do duelista da vez SHALL ter a borda acesa.

#### Scenario: Duelista da vez
- **WHEN** começa o turno do oponente
- **THEN** a borda da placa do oponente acende e a do jogador apaga

#### Scenario: Cemitério vazio e com cartas
- **WHEN** o cemitério está vazio
- **THEN** a placa mostra um espaço tracejado de 26×38
- **WHEN** há cartas no cemitério
- **THEN** a placa mostra a carta do topo nesse espaço, e um toque abre a lista do cemitério

#### Scenario: Cor da barra de LP
- **WHEN** o LP está em 50% ou mais, entre 25% e 50%, ou abaixo de 25% do inicial
- **THEN** a barra fica verde, amarela ou vermelha, respectivamente

### Requirement: Mudança de LP visível
Quando o LP de um duelista muda, a placa SHALL mostrar a variação ("−500" em vermelho ou "+500" em verde) ao lado do LP
por cerca de 1,2 segundo. O número do LP SHALL contar até o valor novo em vez de trocar de uma vez. O layout da placa
MUST NOT se deslocar.

#### Scenario: Dano de batalha
- **WHEN** o jogador sofre 800 de dano com 8000 LP
- **THEN** aparece "−800" em vermelho ao lado do LP, o número conta de 8000 até 7200 em menos de 1 segundo, e o popup some depois de ~1,2s

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
houver batalha), MAIN 2 na Battle Phase e FIM DO TURNO na Main Phase 2 ou quando não houver outra fase. MUST NOT haver
um segundo botão que pule uma fase; terminar o turno pela Main Phase 1 passa pela Battle Phase e pela Main Phase 2.

#### Scenario: Main Phase 1 com batalha disponível
- **WHEN** o jogador está na Main Phase 1 e pode ir para a batalha ou encerrar
- **THEN** aparece só o botão BATALHA (~64×60), sem "Encerrar"

#### Scenario: Battle Phase
- **WHEN** o jogador está na Battle Phase
- **THEN** aparece só o botão MAIN 2, e o FIM DO TURNO só vem na Main Phase 2

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
A tela de duelo SHALL manter margem lateral e espaçamento entre placa, campo e mão. O espaço livre vertical SHALL ficar
entre a placa do jogador e a mão, e não espremido nas bordas.

#### Scenario: Altura sobrando
- **WHEN** o viewport tem 390×844
- **THEN** há pelo menos 12pt de margem lateral nas placas e o espaço livre vertical aparece entre a placa do jogador e a mão

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

### Requirement: Zonas de campo ao lado da barra de fases
As duas zonas de Magia de Campo (uma de cada duelista) SHALL ficar visíveis nas pontas da faixa central: a do jogador
à esquerda e a do oponente à direita (como no tabuleiro oficial), cada uma com a largura de uma carta na altura da faixa. A barra de fases SHALL
encolher para caber entre elas, sem cobri-las. Uma Magia de Campo ativada SHALL aparecer na zona do dono e ficar lá
enquanto o motor a mantiver.

#### Scenario: Ativar Umi
- **WHEN** o jogador ativa uma Magia de Campo
- **THEN** a carta aparece na zona de campo do jogador, ao lado da barra de fases, e não vai para o cemitério

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
