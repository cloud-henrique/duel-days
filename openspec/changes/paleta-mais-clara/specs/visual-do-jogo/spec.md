# Spec Delta

## MODIFIED Requirements

### Requirement: Fundo de circuito e brilho dos componentes
O fundo das telas SHALL ser o padrão do app nativo: colmeia de hexágonos com trilhas e pontos de circuito em ciano
translúcido sobre um degradê radial em azul médio, mais claro no centro e sem chegar ao quase preto nas bordas. As
trilhas MUST continuar visíveis sobre esse azul. O tabuleiro, as placas e as molduras dos retratos SHALL ter um brilho
ciano suave, ainda perceptível sobre o fundo; a placa de quem joga o turno brilha mais forte. As cartas da mão MUST NOT
ter brilho.

#### Scenario: Duelo aberto
- **WHEN** o duelo é exibido
- **THEN** o fundo mostra a colmeia de circuito, o tabuleiro e as placas têm brilho ciano e as cartas da mão não brilham

#### Scenario: Fundo sem quase preto
- **WHEN** qualquer tela com o fundo de circuito é exibida
- **THEN** nem o centro nem as bordas do degradê são quase pretos: o ponto mais escuro do fundo fica num azul médio
  escurecido, e o centro é visivelmente mais claro que o fundo de antes desta mudança

## ADDED Requirements

### Requirement: Paleta azul única
Os fundos, painéis, placas, botões, chips, campos e poços (barra de LP, moldura de avatar) de todas as telas SHALL usar
uma única escala de azuis do jogo, em azul médio. Mudar um degrau da escala MUST mudar todas as telas que o usam, sem
tons de azul escuro avulsos que fiquem para trás. A face das cartas, a arte das cenas e o véu escuro dos diálogos
ficam fora da escala.

#### Scenario: Mesma paleta em todas as telas
- **WHEN** o jogador passa do título ao mapa, à loja, ao editor de deck e ao duelo
- **THEN** os painéis, botões e fundos de todas essas telas têm os mesmos tons da escala, sem nenhuma área no azul
  quase preto de antes

#### Scenario: Véu do diálogo
- **WHEN** um diálogo (modal ou folha) abre sobre uma tela
- **THEN** o véu atrás dele continua escurecendo a tela, e o painel do diálogo usa a paleta em azul médio

### Requirement: Contraste do texto na paleta
O texto apagado (rótulos, contadores, narrador, legendas) e o texto dos chips SHALL ter contraste de pelo menos 4,5:1
contra o fundo onde aparecem. O texto principal SHALL continuar claro sobre os painéis.

#### Scenario: Narrador do duelo
- **WHEN** o narrador mostra "Você invocou Uraby" na barra de fases
- **THEN** o texto tem contraste de pelo menos 4,5:1 contra a barra

#### Scenario: Chip de fase apagado
- **WHEN** a barra de fases mostra os chips das fases que não estão ativas
- **THEN** o rótulo de cada chip tem contraste de pelo menos 4,5:1 contra o fundo do chip
