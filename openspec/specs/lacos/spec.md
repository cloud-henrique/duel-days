# lacos Specification

## Purpose
Define o laço do jogador com cada duelista da campanha: afinidade em corações, os quatro eventos de laço com duelo
obrigatório, a escolha entre amizade e romance, a carta do laço e a tela de Laços.

## Requirements

### Requirement: Afinidade em corações
Cada duelista (os 4 comuns e o Yugi) SHALL ter uma afinidade de 0 a 400, mostrada como 4 corações de 100 pontos. A
afinidade SHALL mudar assim:
- duelo comum: vitória +30, derrota ou empate +10, desistência 0;
- conversa: tema que agrada +20, tema ruim −15, Boatos +5.

A afinidade MUST NOT passar do fim do coração do próximo evento ainda não vencido, e MUST NOT cair abaixo do começo
do coração atual. O duelo de um evento de laço MUST NOT mudar a afinidade.

#### Scenario: Teto até o evento
- **WHEN** o Tristan tem 95 de afinidade, nenhum evento vencido, e o jogador vence um duelo comum contra ele
- **THEN** a afinidade fica em 100, e não em 125

#### Scenario: Piso do coração
- **WHEN** o Joey tem 105 de afinidade e a conversa cai no tema ruim
- **THEN** a afinidade fica em 100, e não em 90

### Requirement: Eventos de laço
Cada duelista SHALL ter 4 eventos, em ordem. O próximo evento SHALL abrir quando a afinidade chegar ao fim do coração
dele (100, 200, 300, 400). O 1º evento SHALL exigir também ao menos uma vitória contra o duelista; o 4º, a escolha feita
no 3º. Com um evento aberto:
- o duelista SHALL ter um "!" no mapa;
- o menu do encontro SHALL mostrar o título do evento como botão principal, mantendo o Duelar comum.

#### Scenario: Evento aberto
- **WHEN** a afinidade com a Tea chega a 100 e o jogador já venceu a Tea uma vez
- **THEN** a Tea aparece com "!" no mapa e o encontro oferece o 1º evento dela

### Requirement: Duelo do evento
O evento SHALL ser uma cena no lugar seguida de um duelo que precisa ser vencido. Só a vitória fecha o evento e mostra
a cena de depois. Na derrota, no empate ou na desistência, o evento continua aberto, mas o "!" e o botão do evento somem
até o dia seguinte. O duelo do evento SHALL pagar DP e carta como um duelo comum e gastar o período.

#### Scenario: Derrota no evento
- **WHEN** o jogador perde o duelo do 2º evento do Joey no dia 8
- **THEN** o evento continua aberto, mas só volta a aparecer no dia 9

### Requirement: Amizade ou romance
O 3º evento SHALL terminar com uma escolha entre amizade e romance, com a fala de cada opção. A escolha SHALL ficar
salva e mudar o 4º evento, a saudação do duelista e o epílogo dele. Todos os 5 duelistas SHALL ter as duas rotas,
qualquer que seja o tratamento do jogador. Se o app fechar antes da escolha, o encontro SHALL oferecer a cena da escolha
de novo.

#### Scenario: Escolher romance
- **WHEN** o jogador escolhe romance no fim do 3º evento do Bakura
- **THEN** a saudação do Bakura passa a ser a de romance e o 4º evento é a versão de romance

### Requirement: Carta do laço
Vencer o 4º evento SHALL dar a carta do laço do duelista, que entra na coleção:
- Tristan: Cyber Commander;
- Tea: Shining Friendship;
- Joey: Flame Swordsman;
- Bakura: Dian Keto the Cure Master;
- Yugi: Mirror Force.

#### Scenario: Fim da história do Joey
- **WHEN** o jogador vence o duelo do 4º evento do Joey
- **THEN** o Flame Swordsman entra na coleção

### Requirement: Tela de Laços
A tela de Laços SHALL listar os duelistas que o jogador já encontrou, com os corações, a rota escolhida e os eventos
vencidos. Cada evento vencido SHALL poder ser revisto (a cena, sem o duelo).

#### Scenario: Rever evento
- **WHEN** o jogador toca em "Rever" no 1º evento do Tristan
- **THEN** a cena do evento toca de novo, sem duelo e sem mudar nada no save
