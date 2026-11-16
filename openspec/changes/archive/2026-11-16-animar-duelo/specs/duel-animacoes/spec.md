# Spec Delta

## Purpose

Define como a tela de duelo encena os acontecimentos do motor: a ordem e o ritmo das animações, o que cada acontecimento
mostra, aceleração e desligamento, acessibilidade de movimento, sons, e a abertura e o fim do duelo.

## ADDED Requirements

### Requirement: Acontecimentos encenados em ordem
Os acontecimentos do duelo SHALL ser mostrados um a um, na ordem em que o motor os produziu, inclusive os que ocorrem
durante o turno do oponente. Antes de cada animação, o tabuleiro SHALL refletir o estado anterior a ela e, depois, o
estado posterior.

#### Scenario: Turno do oponente
- **WHEN** o oponente compra, invoca um monstro e ataca no mesmo turno
- **THEN** a tela mostra a compra, depois a invocação, depois o ataque, nessa ordem, e só então mostra o tabuleiro final

#### Scenario: Narrador acompanha a fila
- **WHEN** um acontecimento é encenado
- **THEN** a linha do narrador mostra o texto desse acontecimento enquanto ele é encenado

### Requirement: Entrada do jogador durante a encenação
Enquanto houver acontecimentos sendo encenados, a interface MUST NOT aceitar jogadas. As jogadas disponíveis SHALL
aparecer só quando a fila terminar.

#### Scenario: Toque em carta durante a fila
- **WHEN** o jogador toca numa carta da mão enquanto o ataque do oponente está sendo encenado
- **THEN** nenhuma folha de ação abre e nenhuma resposta é enviada ao motor

### Requirement: Compra de carta
Ao comprar, a carta SHALL sair do lado do deck do duelista e entrar na mão, e o leque SHALL se reorganizar.

#### Scenario: Jogador compra
- **WHEN** começa o turno do jogador
- **THEN** uma carta vai do deck até a mão e o leque abre espaço para ela

### Requirement: Invocação
Ao invocar um monstro, a carta SHALL ir da origem (mão, deck, cemitério ou Extra Deck) até a zona de destino. Ao chegar,
um pilar de luz SHALL subir e sumir sobre a zona.

#### Scenario: Invocação normal pela mão
- **WHEN** o jogador invoca um monstro da mão
- **THEN** a carta voa da mão até a zona e um pilar de luz aparece sobre ela por menos de 1 segundo

#### Scenario: Invocação especial pelo cemitério
- **WHEN** um monstro é invocado do cemitério
- **THEN** a carta sai do cemitério da placa do dono e vai até a zona, seguida do pilar de luz

### Requirement: Baixar carta
Ao baixar uma carta, ela SHALL ir até a zona de destino virada para baixo. Um monstro baixado SHALL chegar girado em
defesa. Não SHALL haver pilar de luz.

#### Scenario: Baixar monstro
- **WHEN** o oponente baixa um monstro
- **THEN** um verso vai da mão do oponente até a zona e termina girado 90°, sem pilar de luz

### Requirement: Virar carta
Quando uma carta passa de virada para baixo a virada para cima, SHALL haver um giro 3D que revela a face no meio do
movimento.

#### Scenario: Invocação-Virada
- **WHEN** o jogador faz a Invocação-Virada de um monstro em defesa para baixo
- **THEN** a carta gira em 3D revelando a face e termina em ataque

#### Scenario: Armadilha ativada
- **WHEN** uma Armadilha baixada é ativada
- **THEN** a carta gira em 3D revelando a face antes do destaque de ativação

### Requirement: Mudança de posição
Ao mudar de posição sem virar, a carta SHALL girar entre 0° e 90° na própria zona.

#### Scenario: Ataque para defesa
- **WHEN** o jogador muda um monstro com a face para cima de ataque para defesa
- **THEN** a carta gira 90° na zona

### Requirement: Ativação
Ao ativar uma Magia, Armadilha ou efeito de monstro, a carta SHALL aparecer em destaque no centro da tela, com um halo
na cor do seu tipo, por cerca de 1 segundo.

#### Scenario: Magia ativada pelo oponente
- **WHEN** o oponente ativa uma Magia
- **THEN** a carta aparece grande no centro com halo verde e só depois o efeito é encenado

### Requirement: Resolução de corrente
Quando uma corrente com 2 ou mais elos resolve, cada elo SHALL ser destacado na ordem de resolução (do último ao
primeiro). Um elo negado SHALL ser marcado como negado.

#### Scenario: Corrente de 2 elos
- **WHEN** o jogador responde a uma Magia do oponente com uma Armadilha
- **THEN** a pilha da corrente mostra os 2 elos, destaca primeiro a Armadilha (elo 2) e depois a Magia (elo 1)

#### Scenario: Elo negado
- **WHEN** um elo é negado durante a resolução
- **THEN** esse elo aparece riscado em vermelho na pilha

### Requirement: Ataque
Ao atacar, o monstro atacante SHALL avançar em direção ao alvo, ou à placa do oponente no ataque direto, e voltar. No
impacto, o alvo SHALL piscar e a tela SHALL tremer brevemente.

#### Scenario: Ataque a monstro
- **WHEN** o oponente ataca um monstro do jogador
- **THEN** o atacante avança até perto do alvo, o alvo pisca, a tela treme, e só depois aparecem o dano e a destruição

#### Scenario: Ataque direto
- **WHEN** o jogador ataca diretamente
- **THEN** o atacante avança em direção à placa do oponente, a placa pisca e o LP do oponente cai

### Requirement: Destruição
Uma carta destruída SHALL se partir na própria zona antes de ir para o cemitério do dono. Uma carta enviada ao cemitério
sem ser destruída (tributo, descarte, Magia resolvida) SHALL ir direto ao cemitério, sem se partir.

#### Scenario: Monstro destruído em batalha
- **WHEN** um monstro é destruído em batalha
- **THEN** a carta se parte na zona e um pedaço dela vai até o cemitério da placa do dono

#### Scenario: Tributo
- **WHEN** um monstro é oferecido como tributo
- **THEN** a carta vai direto ao cemitério, sem efeito de quebra

### Requirement: Banimento, retorno e equipamento
Uma carta banida SHALL sumir da zona com fade. Uma carta que volta à mão ou ao deck SHALL ir até a mão ou até a placa
do dono. Ao equipar, a carta de equipamento SHALL ir até a zona de Magia/Armadilha e um pilar de luz SHALL aparecer
sobre o monstro equipado.

#### Scenario: Equipar
- **WHEN** o jogador ativa uma Magia de Equipamento num monstro
- **THEN** depois da ativação, a carta fica na zona de Magia/Armadilha e o monstro equipado recebe o pilar de luz

#### Scenario: Retorno à mão
- **WHEN** um monstro do oponente volta para a mão do oponente
- **THEN** a carta voa da zona até a faixa de versos do oponente

### Requirement: Moeda e dado
Quando um efeito lança moeda ou dado, a tela SHALL mostrar a moeda ou o dado girando e depois o resultado em texto.

#### Scenario: Moeda
- **WHEN** um efeito lança uma moeda
- **THEN** uma moeda gira no centro e termina mostrando "Cara" ou "Coroa", em até 1,5 segundo

### Requirement: Duração limitada das animações
Nenhum acontecimento isolado SHALL travar o jogo por mais de 1,5 segundo, na velocidade normal. A abertura do duelo é a
exceção.

#### Scenario: Medição
- **WHEN** qualquer acontecimento é encenado na velocidade normal
- **THEN** a fila passa ao próximo acontecimento em no máximo 1,5 segundo

### Requirement: Acelerar e desligar
Um toque na tela durante a encenação SHALL acelerar o restante da fila atual. O jogador SHALL poder escolher animações
"normal", "rápida" ou "desligada". A escolha MUST persistir entre sessões.

#### Scenario: Toque para acelerar
- **WHEN** o jogador toca na tela durante o turno do oponente
- **THEN** os acontecimentos restantes daquele turno passam bem mais rápido

#### Scenario: Animações desligadas
- **WHEN** o jogador escolhe "desligada" e o oponente joga um turno
- **THEN** o tabuleiro passa ao estado final sem animações, o narrador e o LP são atualizados, e o jogador pode agir sem espera

#### Scenario: Preferência salva
- **WHEN** o jogador escolhe "rápida", fecha o app e volta a duelar
- **THEN** as animações continuam na velocidade rápida

#### Scenario: Save antigo
- **WHEN** um save anterior a este recurso é carregado
- **THEN** valem as animações "normal" e o som ligado

### Requirement: Reduzir movimento
Quando o sistema pede menos movimento, a tela MUST NOT usar avanço de ataque, tremida, giro 3D nem escalas grandes. No
lugar desses efeitos, SHALL usar fades curtos, mantendo a ordem dos acontecimentos.

#### Scenario: Ataque com reduzir movimento
- **WHEN** a opção de reduzir movimento do sistema está ativa e um monstro ataca
- **THEN** o atacante não se desloca e a tela não treme, mas o alvo pisca e o dano é mostrado

### Requirement: Sons do duelo
A tela SHALL tocar efeitos sonoros para os acontecimentos:
- comprar, invocar, baixar, virar, ativar e atacar;
- dano, cura e destruição;
- fim de turno e moeda;
- vitória e derrota.

O jogador SHALL poder silenciar os sons, e a escolha MUST persistir. O mesmo som MUST NOT se sobrepor a si mesmo em
menos de 60ms.

#### Scenario: Primeiro toque no iOS
- **WHEN** o duelo começa no Safari do iOS
- **THEN** os sons passam a tocar a partir do primeiro toque do jogador, sem erro antes disso

#### Scenario: Som desligado
- **WHEN** o jogador desliga o som no menu do duelo
- **THEN** nenhum efeito sonoro toca, inclusive nos duelos seguintes

### Requirement: Abertura do duelo
Ao começar o duelo, SHALL ser mostrada uma abertura com:
- uma moeda que decide quem começa;
- as faixas dos dois duelistas;
- o título "DUELO!".

Um toque SHALL pular a abertura. O primeiro acontecimento do duelo SHALL ser encenado só depois que a abertura termina.

#### Scenario: Abertura completa
- **WHEN** um duelo começa e o jogador não toca na tela
- **THEN** a abertura dura cerca de 3 segundos e depois aparece a compra inicial

#### Scenario: Pular abertura
- **WHEN** o jogador toca na tela durante a abertura
- **THEN** a abertura termina imediatamente e o duelo segue

### Requirement: Fim do duelo
Ao terminar o duelo, SHALL ser mostrado um encerramento com o título do resultado ("VITÓRIA!", "DERROTA" ou "EMPATE"),
com o retrato do vencedor em destaque e o do perdedor esmaecido.

#### Scenario: Vitória
- **WHEN** o LP do oponente chega a 0
- **THEN** a encenação do último dano termina, aparece "VITÓRIA!" e o retrato do jogador dá um pulo
