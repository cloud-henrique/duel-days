# Spec Delta

## MODIFIED Requirements

### Requirement: Janelas dos tiers
A campanha SHALL ter 4 tiers com janelas fixas: Tier 1 nos dias 1 a 7, Tier 2 nos dias 8 a 14, Tier 3 nos dias 15 a 22
e Tier 4 nos dias 23 a 30. O Tier 1 SHALL estar aberto desde o começo da campanha. A janela MUST NOT abrir tier: ela só
decide o pacote-prêmio.

#### Scenario: Começo
- **WHEN** o jogador começa uma campanha
- **THEN** o tier atual é o Tier 1

#### Scenario: O dia não abre tier
- **WHEN** chega o dia 30 e nenhum chefe foi vencido
- **THEN** o tier atual continua sendo o Tier 1

### Requirement: Próximo tier pelo chefe
O próximo tier SHALL abrir, a partir do período seguinte, só depois de cada duelista do tier atual (os comuns e o chefe)
ter sido vencido ao menos uma vez. Se a primeira vitória sobre o chefe vier até o último dia da janela do tier, o jogador
SHALL ganhar um pacote fechado da coleção mais recente à venda (o pacote-prêmio); depois da janela, a vitória abre o
próximo tier sem pacote-prêmio.

#### Scenario: Yugi vencido no dia 5
- **WHEN** o jogador vence o Yugi pela primeira vez na tarde do dia 5
- **THEN** ganha um pacote fechado e, a partir da noite do dia 5, o tier atual é o Tier 2

#### Scenario: Yugi vencido depois da janela
- **WHEN** chega o dia 8 sem o Yugi vencido e o jogador o vence nesse dia
- **THEN** até a vitória o tier atual é o Tier 1, sem duelistas do Tier 2 no mapa; depois dela, é o Tier 2, sem
  pacote-prêmio

#### Scenario: Kaiba sem o Pegasus
- **WHEN** é o dia 20, o jogador venceu os comuns dos Tiers 2 e 3 mas nunca o Pegasus
- **THEN** o tier atual é o Tier 2, o Pegasus está no mapa e nem o Kaiba nem os outros duelistas do Tier 3 aparecem

### Requirement: Tier sem conteúdo
Enquanto o próximo tier não tiver duelistas no jogo, ele MUST NOT abrir: o tier atual continua até o dia 30. Com o tier
atual vencido por inteiro, o progresso SHALL dizer que o próximo tier chega numa próxima atualização. Vencer o chefe
nesse caso SHALL dar o pacote-prêmio normalmente (se dentro da janela).

#### Scenario: Pegasus vencido sem Tier 3
- **WHEN** o Tier 3 ainda não existe e o jogador vence o Pegasus no dia 12, com os comuns do Tier 2 vencidos
- **THEN** ganha o pacote-prêmio, o tier atual continua sendo o Tier 2 e o progresso avisa que o Tier 3 chega numa
  próxima atualização

#### Scenario: Kaiba vencido sem Tier 4
- **WHEN** o jogador vence o Kaiba no dia 20 e o Tier 4 ainda não existe
- **THEN** ganha o pacote-prêmio, o tier atual continua sendo o Tier 3 e o progresso avisa que o Tier 4 chega numa
  próxima atualização

#### Scenario: Prazo do Tier 3 sem Tier 4
- **WHEN** chega o dia 23 no Tier 3 sem o Kaiba vencido
- **THEN** o tier atual continua sendo o Tier 3 e não há aviso de atualização (ele só aparece com o Kaiba vencido)

#### Scenario: Save parado no Tier 2
- **WHEN** o jogador abre um save do dia 17 que estava no Tier 2 sem o Pegasus vencido
- **THEN** o tier atual continua sendo o Tier 2: o dia não abre o Tier 3

### Requirement: Tier atual no cabeçalho e no status
O cabeçalho do mapa SHALL mostrar o nome do tier atual e o progresso dele: quantos duelistas comuns do tier já foram
vencidos ("X/N vencidos") e a situação do chefe. A tela de status SHALL mostrar os tiers já abertos, os chefes vencidos e
o que abre o próximo tier ("Tier 3 · vença Pegasus"), ou que ele chega numa atualização.

#### Scenario: Cabeçalho no Tier 2
- **WHEN** o tier atual é o Tier 2 e o jogador já venceu o Rex e o Weevil
- **THEN** o cabeçalho mostra "Tier 2: Reino dos Duelistas" e "2/5 vencidos"

### Requirement: Tier pelo dia e pelos chefes
O tier atual SHALL ser calculado a partir das vitórias, dos chefes já vencidos e do dia em que cada chefe foi vencido; o
dia do calendário MUST NOT abrir tier. O tier aberto SHALL contar (para as coleções dele) a partir do dia em que o chefe
anterior caiu; um save sem esse dia SHALL contar a partir do primeiro dia da janela. Um save que estava num tier aberto
pelo prazo SHALL voltar ao tier cujo chefe falta vencer, mantendo cartas, DP e pacotes.

#### Scenario: Save antigo no dia 12
- **WHEN** o jogador abre um save do dia 12 sem o Yugi vencido
- **THEN** o tier atual é o Tier 1, o Yugi está no mapa e nenhum duelista do Tier 2 aparece

#### Scenario: Save antigo com o Yugi vencido no dia 4
- **WHEN** o jogador abre um save do dia 5, sem o dia dos chefes, com o Tier 1 vencido por inteiro
- **THEN** o tier atual é o Tier 2 e as caixas do Tier 2 contam como se o tier tivesse aberto no dia 8 (o LON à venda já,
  porque o tier está aberto; LOD e PGD nos dias 10 e 12)

## REMOVED Requirements

### Requirement: Próximo tier pelo prazo
**Reason**: o tier abria sem o chefe do anterior vencido (o Kaiba aparecia sem o Pegasus).
**Migration**: o próximo tier abre só pelo tier atual vencido por inteiro ("Próximo tier pelo chefe").
