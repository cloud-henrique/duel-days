## MODIFIED Requirements

### Requirement: Compra de carta
Ao comprar, a carta SHALL sair da pilha de Deck do duelista e entrar na mão, e a fila de cartas da mão SHALL se
reorganizar.

#### Scenario: Jogador compra
- **WHEN** começa o turno do jogador
- **THEN** uma carta vai da pilha de Deck até a mão e as cartas da mão abrem espaço para ela

### Requirement: Invocação
Ao invocar um monstro, a carta SHALL ir da origem (mão, Deck, Cemitério, Banidas ou Extra Deck, cada pilha no seu lugar
das colunas de pilhas) até a zona de destino. Ao chegar, um pilar de luz SHALL subir e sumir sobre a zona.

#### Scenario: Invocação normal pela mão
- **WHEN** o jogador invoca um monstro da mão
- **THEN** a carta voa da mão até a zona e um pilar de luz aparece sobre ela por menos de 1 segundo

#### Scenario: Invocação especial pelo cemitério
- **WHEN** um monstro é invocado do cemitério
- **THEN** a carta sai da pilha de Cemitério do dono, nas colunas de pilhas, e vai até a zona, seguida do pilar de luz

#### Scenario: Invocação por Fusão
- **WHEN** o jogador invoca um monstro de Fusão
- **THEN** a carta sai da pilha de Extra Deck do jogador e vai até a zona, seguida do pilar de luz

### Requirement: Destruição
Uma carta destruída SHALL se partir na própria zona antes de ir para o cemitério do dono. Uma carta enviada ao cemitério
sem ser destruída (tributo, descarte, Magia resolvida) SHALL ir direto ao cemitério, sem se partir. O cemitério de
destino é a pilha de Cemitério do dono nas colunas de pilhas.

#### Scenario: Monstro destruído em batalha
- **WHEN** um monstro é destruído em batalha
- **THEN** a carta se parte na zona e um pedaço dela vai até a pilha de Cemitério do dono

#### Scenario: Tributo
- **WHEN** um monstro é oferecido como tributo
- **THEN** a carta vai direto ao cemitério, sem efeito de quebra

### Requirement: Banimento, retorno e equipamento
Uma carta banida SHALL ir da origem até a pilha de Banidas do dono. Uma carta que volta à mão, ao Deck ou ao Extra Deck
SHALL ir até a mão ou até a pilha correspondente do dono. Ao equipar, a carta de equipamento SHALL ir até a zona de
Magia/Armadilha e um pilar de luz SHALL aparecer sobre o monstro equipado.

#### Scenario: Equipar
- **WHEN** o jogador ativa uma Magia de Equipamento num monstro
- **THEN** depois da ativação, a carta fica na zona de Magia/Armadilha e o monstro equipado recebe o pilar de luz

#### Scenario: Retorno à mão
- **WHEN** um monstro do oponente volta para a mão do oponente
- **THEN** a carta voa da zona até a faixa de versos do oponente

#### Scenario: Banir do campo
- **WHEN** um monstro do jogador é banido
- **THEN** a carta voa da zona até a pilha de Banidas do jogador, e a pilha passa a mostrá-la no topo

#### Scenario: Voltar ao deck
- **WHEN** uma carta do oponente volta para o Deck
- **THEN** a carta voa da zona até a pilha de Deck do oponente, virada para baixo
