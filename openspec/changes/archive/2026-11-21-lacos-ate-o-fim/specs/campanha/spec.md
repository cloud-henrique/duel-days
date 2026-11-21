## MODIFIED Requirements

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
