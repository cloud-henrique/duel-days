# Spec Delta

## MODIFIED Requirements

### Requirement: Quem aparece em cada período

Em cada período, SHALL aparecer de 2 a 4 dos duelistas comuns do tier atual. Depois que um tier abrir, todos os comuns
dos tiers anteriores SHALL continuar aparecendo (no Tier 3, os comuns dos Tiers 1 e 2). Os chefes já liberados SHALL
aparecer em todo período. O sorteio de quem aparece e dos pontos MUST ser reproduzível pela semente da campanha, pelo
dia e pelo período: fechar e abrir o app no mesmo período mostra os mesmos duelistas nos mesmos pontos.

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

#### Scenario: Mapa cheio no Tier 4

- **WHEN** o tier atual é o Tier 4, os quatro comuns dele estão no período e Yugi, Pegasus, Kaiba, Yami Marik e Yami Yugi
  estão liberados
- **THEN** o mapa mostra as 22 cabeças sem nenhuma encostada em outra, todos os comuns dos Tiers 1 a 3 entre elas

### Requirement: Pontos do panorama

Cada duelista SHALL ocupar um ponto diferente do panorama, sem cabeças sobrepostas, mesmo com todos os comuns dos tiers
anteriores e todos os chefes no mapa: no Tier 1, sorteado entre os pontos do mapa; depois, espalhado pelo panorama, com o
tier atual perto do centro (a parte que a tela mostra ao abrir) e cada tier anterior mais longe dele. O chefe de um tier
anterior SHALL ficar na mesma faixa dos comuns do tier dele; o chefe do tier atual e o Yami Yugi ficam perto do centro.

#### Scenario: Mapa cheio no Tier 3

- **WHEN** o tier atual é o Tier 3, com os comuns dos Tiers 1 e 2 e os três chefes no mapa
- **THEN** cada cabeça fica num ponto diferente, sem sobreposição; as do Tier 3 ficam perto do centro e as dos tiers anteriores mais longe

#### Scenario: Chefes antigos no Tier 4

- **WHEN** o tier atual é o Tier 4, com o Yugi, o Pegasus e o Kaiba vencidos
- **THEN** o Kaiba fica na faixa dos comuns do Tier 3, o Pegasus na do Tier 2 e o Yugi na do Tier 1, e o Yami Marik
  fica perto do centro

### Requirement: Calendário de 30 dias

A campanha SHALL durar 30 dias, cada um com três períodos: Manhã, Tarde e Noite. Cada duelo da campanha SHALL gastar um
período, qualquer que seja o resultado (vitória, derrota, empate ou desistência). Conversar, entrar na loja, abrir
pacotes, editar o deck, ver os laços ou o status e voltar ao mapa MUST NOT gastar período. Depois do duelo da noite do
dia 30, a campanha SHALL terminar. Vencer o duelo final MUST NOT terminar a campanha antes disso.

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

#### Scenario: Campeão antes do fim

- **WHEN** o jogador vence o Yami Yugi na tarde do dia 26
- **THEN** depois da cena de campeão ele volta ao mapa na noite do dia 26, com todos os duelistas, a loja e os laços
  disponíveis

## ADDED Requirements

### Requirement: Cena de campeão

A primeira vitória sobre o Yami Yugi SHALL tocar, logo depois da fala de derrota dele, a cena de campeão do amigo do
Tier 1 de laço mais forte, escolhido como no epílogo (mais eventos vencidos; no empate, mais afinidade; depois, a ordem
do conteúdo). Sem nenhum evento vencido, SHALL tocar a cena genérica, com o Yami Yugi e os cinco amigos. A cena toca uma
vez só.

#### Scenario: Campeão com o Joey

- **WHEN** o jogador vence o Yami Yugi pela primeira vez com 5 eventos vencidos com o Joey e 3 com a Téa
- **THEN** depois da fala de derrota do Yami Yugi toca a cena de campeão do Joey

#### Scenario: Campeão sem laço

- **WHEN** o jogador vence o Yami Yugi pela primeira vez sem nenhum evento de laço vencido
- **THEN** toca a cena genérica, com o Yami Yugi e os cinco amigos

#### Scenario: Segunda vitória

- **WHEN** o jogador vence o Yami Yugi pela segunda vez
- **THEN** não toca cena de campeão

### Requirement: Rever a cena de campeão

Depois de tocada, a cena de campeão SHALL poder ser revista na tela de Status e na tela de fim, sempre na versão que
tocou da primeira vez.

#### Scenario: Rever no fim

- **WHEN** a campanha terminou e o jogador tinha vencido o Yami Yugi
- **THEN** a tela de fim mostra "Rever cena de campeão", que toca a mesma versão da primeira vez
