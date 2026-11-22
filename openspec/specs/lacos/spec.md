# lacos Specification

## Purpose
Define o laço do jogador com cada duelista da campanha: afinidade em corações, os seis eventos de laço com duelo
obrigatório, a escolha entre amizade e romance, a carta do laço e a tela de Laços.

## Requirements

### Requirement: Afinidade em corações
Cada duelista do Tier 1 SHALL ter afinidade de 0 a 600, em 6 corações de 100 pontos. Ela SHALL mudar assim:
- duelo comum: vitória +30, derrota ou empate +10, desistência 0;
- conversa: tema que agrada +20, tema ruim −15, Boatos +5;
- resposta no fim do evento: conforme o tom (ver "Escolha dentro do evento").

A afinidade MUST NOT passar do fim do coração do próximo evento não vencido, nem cair abaixo do começo do coração
atual. O duelo de um evento de laço MUST NOT mudar a afinidade.

#### Scenario: Teto até o evento
- **WHEN** o Tristan tem 95 de afinidade, nenhum evento vencido, e o jogador vence um duelo comum contra ele
- **THEN** a afinidade fica em 100, e não em 125

#### Scenario: Piso do coração
- **WHEN** o Joey tem 105 de afinidade e a conversa cai no tema ruim
- **THEN** a afinidade fica em 100, e não em 90

### Requirement: Eventos de laço
Cada duelista SHALL ter 6 eventos, em ordem. O próximo evento SHALL abrir quando a afinidade chegar ao fim do coração
dele (100, 200, 300, 400, 500, 600). O 1º evento SHALL exigir também ao menos uma vitória contra o duelista; o 4º, a
escolha feita no 3º; o 5º, o Tier 2 aberto; o 6º, o Tier 3 aberto. Com um evento aberto:
- o duelista SHALL ter um "!" no mapa;
- o menu do encontro SHALL mostrar o título do evento como botão principal, mantendo o Duelar comum.

#### Scenario: Evento aberto
- **WHEN** a afinidade com a Tea chega a 100 e o jogador já venceu a Tea uma vez
- **THEN** a Tea aparece com "!" no mapa e o encontro oferece o 1º evento dela

#### Scenario: 5º evento espera o Tier 2
- **WHEN** o Joey tem 500 de afinidade e 4 eventos vencidos no dia 5, ainda no Tier 1
- **THEN** o 5º evento não abre e o Joey não tem "!"; no primeiro dia do Tier 2, o evento abre

### Requirement: Duelo do evento
O evento SHALL ser uma cena no lugar seguida de um duelo que precisa ser vencido. Só a vitória fecha o evento e mostra
a cena de depois. Na derrota, no empate ou na desistência, o evento continua aberto, mas o "!" e o botão do evento somem
até o dia seguinte. O duelo do evento SHALL pagar DP e carta como um duelo comum e gastar o período.

#### Scenario: Derrota no evento
- **WHEN** o jogador perde o duelo do 2º evento do Joey no dia 8
- **THEN** o evento continua aberto, mas só volta a aparecer no dia 9

### Requirement: Amizade ou romance
O 3º evento SHALL terminar com uma escolha entre amizade e romance, com a fala de cada opção. A escolha SHALL ficar
salva e mudar o 4º e o 6º eventos, a saudação do duelista e o epílogo dele. Todos os 5 duelistas SHALL ter as duas
rotas, qualquer que seja o tratamento do jogador. Se o app fechar antes da escolha, o encontro SHALL oferecer a cena da
escolha de novo.

#### Scenario: Escolher romance
- **WHEN** o jogador escolhe romance no fim do 3º evento do Bakura
- **THEN** a saudação do Bakura passa a ser a de romance, e o 4º e o 6º eventos são as versões de romance

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
A tela de Laços SHALL listar os duelistas que o jogador já encontrou, com os 6 corações, a rota escolhida e os eventos
vencidos. Cada evento vencido SHALL poder ser revisto: a cena, sem o duelo e com a resposta que o jogador escolheu.

#### Scenario: Rever evento
- **WHEN** o jogador toca em "Rever" no 1º evento do Tristan
- **THEN** a cena do evento toca de novo, com a resposta escolhida, sem duelo e sem mudar nada no save

### Requirement: Escolha dentro do evento
Todo evento de laço, menos o 3º (que já tem amizade ou romance), SHALL terminar com uma escolha de resposta do jogador,
com 2 ou 3 opções. Cada opção SHALL ter uma fala de resposta do duelista e mudar a afinidade conforme o tom: a que
combina com o personagem +20, a neutra +5 e a que destoa −10, respeitando o teto e o piso.

#### Scenario: Responder ao Joey
- **WHEN** o jogador vence o duelo do 1º evento do Joey e escolhe a resposta que combina com ele
- **THEN** o Joey responde com a fala daquela opção, a afinidade sobe 20 (até o teto) e a escolha fica salva

### Requirement: Escolha salva
A escolha dentro do evento SHALL ficar salva. Se o app fechar antes dela, o encontro SHALL oferecer a escolha de novo.
Eventos vencidos antes de a escolha existir no save MUST NOT pedir a escolha depois.

#### Scenario: App fechado antes da escolha
- **WHEN** o app fecha depois da vitória no 2º evento da Téa e antes da resposta
- **THEN** no próximo encontro com a Téa, a escolha do 2º evento aparece de novo

### Requirement: Laços na tela larga
Na tela larga, a tela de Laços SHALL mostrar os cartões dos duelistas em 2 colunas, centralizados com largura máxima.

#### Scenario: Laços no desktop
- **WHEN** o jogador abre Laços numa janela de 1440×900
- **THEN** os cartões dos duelistas aparecem em 2 colunas
