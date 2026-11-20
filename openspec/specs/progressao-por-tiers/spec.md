# progressao-por-tiers Specification

## Purpose
Define como a campanha avança por tiers dentro dos 30 dias: a janela de cada tier, como o próximo abre (chefe vencido ou
prazo), o pacote-prêmio, o que acontece quando o próximo tier ainda não tem conteúdo e como o jogo mostra o tier atual.

## Requirements

### Requirement: Janelas dos tiers
A campanha SHALL ter 4 tiers com janelas fixas: Tier 1 nos dias 1 a 7, Tier 2 nos dias 8 a 14, Tier 3 nos dias 15 a 22
e Tier 4 nos dias 23 a 30. O Tier 1 SHALL estar aberto desde o começo da campanha.

#### Scenario: Começo
- **WHEN** o jogador começa uma campanha
- **THEN** o tier atual é o Tier 1

### Requirement: Próximo tier pelo chefe
Vencer pela primeira vez o chefe do tier atual SHALL abrir o próximo tier a partir do período seguinte, mesmo antes do
fim da janela. Se essa vitória vier até o último dia da janela do tier, o jogador SHALL ganhar um pacote fechado da
coleção mais recente à venda (o pacote-prêmio).

#### Scenario: Yugi vencido no dia 5
- **WHEN** o jogador vence o Yugi pela primeira vez na tarde do dia 5
- **THEN** ganha um pacote fechado e, a partir da noite do dia 5, o tier atual é o Tier 2

### Requirement: Próximo tier pelo prazo
Se o chefe do tier atual não for vencido até o último dia da janela, o próximo tier SHALL abrir na manhã do primeiro dia
da janela seguinte, sem pacote-prêmio. O chefe do tier anterior SHALL continuar disponível, e vencê-lo depois MUST NOT
dar pacote-prêmio.

#### Scenario: Prazo do Tier 1
- **WHEN** chega a manhã do dia 8 e o Yugi não foi vencido
- **THEN** o tier atual é o Tier 2, sem pacote-prêmio, e o Yugi continua no mapa

### Requirement: Tier sem conteúdo
Enquanto o próximo tier não tiver duelistas no jogo, ele MUST NOT abrir: o tier atual continua até o dia 30, e o
progresso SHALL dizer que o próximo tier chega numa próxima atualização. Vencer o chefe nesse caso SHALL dar o
pacote-prêmio normalmente (se dentro da janela).

#### Scenario: Pegasus vencido sem Tier 3
- **WHEN** o jogador vence o Pegasus no dia 12 e o Tier 3 ainda não existe
- **THEN** ganha o pacote-prêmio, o tier atual continua sendo o Tier 2 e o progresso avisa que o Tier 3 chega numa
  próxima atualização

#### Scenario: Kaiba vencido sem Tier 4
- **WHEN** o jogador vence o Kaiba no dia 20 e o Tier 4 ainda não existe
- **THEN** ganha o pacote-prêmio, o tier atual continua sendo o Tier 3 e o progresso avisa que o Tier 4 chega numa
  próxima atualização

#### Scenario: Prazo do Tier 3 sem Tier 4
- **WHEN** chega a manhã do dia 23 e o Tier 4 ainda não existe
- **THEN** o tier atual continua sendo o Tier 3 até o fim da campanha

#### Scenario: Save parado no Tier 2
- **WHEN** o jogador abre um save do dia 17, de antes desta mudança, que estava no Tier 2 por falta de conteúdo
- **THEN** o tier atual passa a ser o Tier 3, aberto no dia 15 (ou no dia em que o Pegasus foi vencido, se antes), e as
  caixas do Tier 3 contam a partir desse dia

### Requirement: Tier atual no cabeçalho e no status
O cabeçalho do mapa SHALL mostrar o nome do tier atual e o progresso dele: quantos duelistas comuns do tier já foram
vencidos ("X/N vencidos") e a situação do chefe. A tela de status SHALL mostrar os tiers já abertos, os chefes vencidos e
o dia em que o próximo tier abre pelo prazo.

#### Scenario: Cabeçalho no Tier 2
- **WHEN** o tier atual é o Tier 2 e o jogador já venceu o Rex e o Weevil
- **THEN** o cabeçalho mostra "Tier 2: Reino dos Duelistas" e "2/5 vencidos"

### Requirement: Tier pelo dia e pelos chefes
O tier atual SHALL ser calculado a partir do dia, dos chefes já vencidos e do dia em que cada chefe foi vencido. O save
SHALL guardar esse dia num campo novo e opcional; uma campanha salva antes desta mudança, sem o campo, SHALL continuar de
onde parou, considerando que cada tier aberto abriu pelo prazo (no primeiro dia da janela dele).

#### Scenario: Save antigo no dia 12
- **WHEN** o jogador abre um save do dia 12, de antes desta mudança, sem o Yugi vencido
- **THEN** o tier atual é o Tier 2, os duelistas do Tier 2 aparecem no mapa e as caixas do Tier 2 contam a partir do dia 8

#### Scenario: Save antigo com o Yugi vencido no dia 4
- **WHEN** o jogador abre um save do dia 5, de antes desta mudança, com o Yugi já vencido
- **THEN** o tier atual é o Tier 2 e as caixas do Tier 2 contam como se o tier tivesse aberto no dia 8 (o LON à venda já,
  porque o tier está aberto; LOD e PGD nos dias 10 e 12)
