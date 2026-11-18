## MODIFIED Requirements

### Requirement: Mapa da Cidade de Domino
O mapa SHALL mostrar o panorama da Cidade de Domino em todos os tiers, sem lugares fixos nem nomes de lugar: só as
cabeças de quem está por perto, cada uma num ponto do panorama. O mapa SHALL rolar na horizontal e ter um tom diferente
para Manhã, Tarde e Noite. O cabeçalho SHALL mostrar o dia, o período, o DP, a barra dos dias e o progresso do tier
atual ("X/N vencidos", com N o número de duelistas comuns do tier, e a situação do chefe dele). A barra de baixo do mapa
SHALL dar acesso a Deck, Coleção, Laços e Loja. O botão de menu do cabeçalho SHALL abrir as Opções, com Status da
campanha, Voltar ao título e Fechar.

#### Scenario: Cabeçalho
- **WHEN** o jogador abre o mapa na tarde do dia 5 com 450 DP e 2 duelistas do Tier 1 já vencidos
- **THEN** o cabeçalho mostra "Dia 5", "Tarde", "450 DP" e "2/4 vencidos"

#### Scenario: Noite
- **WHEN** é noite
- **THEN** o mapa e o fundo do encontro aparecem com o tom azulado da noite

#### Scenario: Sem nomes de lugar
- **WHEN** o jogador abre o mapa
- **THEN** aparecem só as cabeças dos duelistas, sem nome de lugar nem contador

#### Scenario: Status pelas Opções
- **WHEN** o jogador toca no menu do cabeçalho e em "Status da campanha"
- **THEN** abre a tela de Status, e Fechar volta ao mapa sem sair dele
