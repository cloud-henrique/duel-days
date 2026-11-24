# Spec Delta

## MODIFIED Requirements

### Requirement: Tier atual no cabeçalho e no status

O cabeçalho do mapa SHALL mostrar o nome do tier atual e o progresso dele: quantos duelistas comuns do tier já foram
vencidos ("X/N vencidos") e a situação do chefe. A tela de status SHALL mostrar os tiers já abertos, os chefes vencidos e
o que abre o próximo tier ("Tier 3 · vença Pegasus"), ou que ele chega numa atualização. No Tier 4, depois do Yami Marik,
o progresso SHALL apontar o duelo final ("Final · vença Yami Yugi") e, depois dele, o título de campeão.

#### Scenario: Cabeçalho no Tier 2

- **WHEN** o tier atual é o Tier 2 e o jogador já venceu o Rex e o Weevil
- **THEN** o cabeçalho mostra "Tier 2: Reino dos Duelistas" e "2/5 vencidos"

#### Scenario: Duelo final no status

- **WHEN** o jogador venceu o Yami Marik e ainda não o Yami Yugi
- **THEN** o status mostra "Final · vença Yami Yugi", sem aviso de atualização

#### Scenario: Campeão no status

- **WHEN** o jogador já venceu o Yami Yugi
- **THEN** o status mostra que ele é o campeão da Batalha da Cidade, com o dia da vitória

## ADDED Requirements

### Requirement: Próximo tier ainda sem duelistas

Enquanto o próximo tier não tiver duelistas no jogo, ele MUST NOT abrir: o tier atual continua até o dia 30. Com o tier
atual vencido por inteiro, o progresso SHALL dizer que o próximo tier chega numa próxima atualização. Vencer o chefe
nesse caso SHALL dar o pacote-prêmio normalmente (se dentro da janela).

#### Scenario: Pegasus vencido sem Tier 3

- **WHEN** o Tier 3 ainda não existe e o jogador vence o Pegasus no dia 12, com os comuns do Tier 2 vencidos
- **THEN** ganha o pacote-prêmio, o tier atual continua sendo o Tier 2 e o progresso avisa que o Tier 3 chega numa
  próxima atualização

#### Scenario: Prazo sem o chefe vencido

- **WHEN** o próximo tier ainda não existe e chega o primeiro dia da janela dele sem o chefe do tier atual vencido
- **THEN** o tier atual continua o mesmo e não há aviso de atualização (ele só aparece com o chefe vencido)

#### Scenario: Save parado no Tier 2

- **WHEN** o jogador abre um save do dia 17 que estava no Tier 2 sem o Pegasus vencido
- **THEN** o tier atual continua sendo o Tier 2: o dia não abre o Tier 3


### Requirement: Último tier

O Tier 4 SHALL ser o último tier da campanha. Com ele vencido por inteiro, o jogo MUST NOT avisar que outro tier chega
numa atualização. O Yami Yugi MUST NOT contar entre os duelistas do Tier 4 para o "X/N vencidos" do cabeçalho.

#### Scenario: Yami Marik vencido

- **WHEN** o jogador vence o Yami Marik com os quatro comuns do Tier 4 já vencidos
- **THEN** o tier atual continua sendo o Tier 4, o cabeçalho mostra "4/4 vencidos" e não há aviso de atualização

#### Scenario: Pacote-prêmio do Yami Marik

- **WHEN** o jogador vence o Yami Marik pela primeira vez no dia 28
- **THEN** ganha um pacote fechado da coleção mais recente à venda

### Requirement: Tier 4 aberto pelo Kaiba

O Tier 4 SHALL abrir pela regra de todos os tiers: no período seguinte à vitória que deixa o Tier 3 vencido por inteiro
(os quatro comuns e o Kaiba). Um save que já estava assim antes do Tier 4 existir SHALL abrir no Tier 4, contando as
coleções dele a partir do dia em que o Kaiba caiu.

#### Scenario: Save com o Kaiba vencido no dia 20

- **WHEN** o jogador abre, no dia 25, um save com o Tier 3 vencido por inteiro e o Kaiba vencido no dia 20
- **THEN** o tier atual é o Tier 4, e o AST e o SOD estão à venda

## REMOVED Requirements

### Requirement: Tier sem conteúdo
**Reason**: Com o Tier 4, todos os tiers dos dados têm duelistas; os cenários "Kaiba vencido sem Tier 4" e "Prazo do
Tier 3 sem Tier 4" deixam de existir. A regra continua, genérica, em "Próximo tier ainda sem duelistas".
**Migration**: Nenhuma: o comportamento para um tier vazio é o mesmo, e o Tier 4 passa a ser o último ("Último tier").

