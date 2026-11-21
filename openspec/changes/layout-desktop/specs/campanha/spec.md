## MODIFIED Requirements

### Requirement: Encontro
Ao encontrar um duelista, o jogo SHALL mostrar a cena dele: o fundo do lugar onde ele está naquela fase da história (no
tom do período) e o nome do lugar no topo, o duelista de corpo inteiro e a saudação na caixa de fala, com um botão para
pular as falas. Os duelistas com laço (os do Tier 1) SHALL mostrar os corações. Depois da saudação, o menu SHALL ter:
- o título do evento de laço aberto, como botão principal, quando houver;
- Conversar (só para quem tem laço);
- Duelar;
- Voltar ao mapa (sem gastar período).

Sem o arquivo do fundo, a cena SHALL usar um degradê no lugar.

Em tela larga, os botões do menu SHALL ficar lado a lado numa linha só, com a mesma altura. A caixa de fala, o menu e as
listas de escolha (tópicos de conversa, respostas) SHALL ter largura máxima e ficar centralizados, sem atravessar a tela
inteira.

#### Scenario: Primeiro encontro
- **WHEN** o jogador encontra o Joey pela primeira vez
- **THEN** aparece o Joey na cena dele, com uma saudação comum, e depois o menu com Conversar, Duelar e Voltar

#### Scenario: Cena do Tier 2
- **WHEN** o jogador encontra o Pegasus
- **THEN** o fundo é o do castelo do Pegasus e o topo mostra o nome do lugar

#### Scenario: Pular falas
- **WHEN** o jogador toca em "Pular" durante a saudação
- **THEN** o menu do encontro aparece

#### Scenario: Menu em tela larga
- **WHEN** o jogador encontra o Joey numa janela de 1440×900
- **THEN** Conversar, Duelar e Voltar ao mapa aparecem lado a lado numa linha só, e a caixa de fala não ocupa a largura
  toda da tela

#### Scenario: Menu no celular
- **WHEN** o jogador encontra o Joey num viewport de 390×844
- **THEN** os botões do menu continuam um embaixo do outro, como antes
