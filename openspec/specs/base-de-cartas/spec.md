# base-de-cartas Specification

## Purpose

Define a base de cartas do jogo: quais cartas da era Duel Monsters entram, de onde vêm os dados e o texto em português,
como corrigir textos da época, quais cartas o motor não aguenta, os boosters TCG com raridades e o relatório da
importação.

## Requirements

### Requirement: Cartas da era Duel Monsters
A base SHALL conter os monstros, Magias e Armadilhas com data de lançamento OCG até 30/09/2004, inclusive. Fichas
(tokens) MUST NOT entrar como cartas da coleção, mas continuam disponíveis ao motor para as cartas que as criam.

#### Scenario: Carta de 2004 antes do corte
- **WHEN** uma carta tem data OCG 2004-09-30
- **THEN** ela está na base

#### Scenario: Carta da era GX
- **WHEN** uma carta tem data OCG 2004-10-01 ou posterior
- **THEN** ela não está na base

#### Scenario: Ficha
- **WHEN** a API traz uma ficha da época
- **THEN** ela não aparece na coleção nem nos boosters, mas o motor ainda a conhece

### Requirement: Carta sem data OCG
Uma carta sem data OCG na fonte MUST NOT entrar na base por padrão. Ela SHALL aparecer no relatório da importação para
ser decidida à mão (incluir por lista explícita ou deixar de fora).

#### Scenario: Sem data
- **WHEN** uma carta impressa numa caixa TCG da era não tem data OCG
- **THEN** ela fica fora da base e aparece no relatório na lista "sem data OCG"

### Requirement: Só campos usados pelo jogo
A base gerada SHALL trazer só os dados que o jogo usa (identificação, tipo, atributo, raça, nível, ATK/DEF, nome e
texto) e MUST NOT entrar no bundle JavaScript do app: é carregada como dado à parte.

#### Scenario: Bundle sem a base
- **WHEN** o app é construído para produção
- **THEN** os arquivos JavaScript não contêm a lista de cartas, que é baixada como dado

### Requirement: Texto em português com volta ao inglês
O nome e o texto de cada carta SHALL aparecer em português quando houver tradução oficial na fonte. Sem tradução, a
carta SHALL aparecer em inglês, sem erro e sem texto vazio.

#### Scenario: Carta traduzida
- **WHEN** a carta tem nome e texto em português na fonte
- **THEN** a face e os detalhes mostram o nome e o texto em português

#### Scenario: Carta sem tradução
- **WHEN** a carta só tem texto em inglês
- **THEN** a face e os detalhes mostram o nome e o texto em inglês

### Requirement: Correção de textos da época
Um arquivo de correções SHALL poder substituir o nome e/ou o texto de qualquer carta, por cima do texto da fonte, e
MUST valer em toda a interface. Uma correção para um id que não existe na base SHALL ser apontada no relatório.

#### Scenario: Errata desfeita
- **WHEN** o arquivo de correções traz um texto para a carta 12345
- **THEN** a carta 12345 mostra esse texto em vez do texto atual da fonte

#### Scenario: Correção órfã
- **WHEN** o arquivo de correções traz um id que não está na base
- **THEN** o relatório lista esse id como correção sem carta

### Requirement: Cartas sem suporte do motor
Uma carta da era que o motor de duelo não consegue jogar (sem dados ou sem script, ou bloqueada por travar o motor)
MUST NOT aparecer em boosters, decks dos oponentes nem no deck do jogador, e SHALL constar no relatório.

#### Scenario: Carta sem script
- **WHEN** uma carta de efeito da era não tem script no motor
- **THEN** ela não sai em nenhum booster e aparece no relatório na lista "sem suporte do motor"

### Requirement: Boosters TCG da era
A base SHALL trazer as caixas TCG da era Duel Monsters como dados: para cada uma, as cartas e a raridade de cada carta
naquela caixa (Comum, Rara, Super Rara, Ultra Rara). Cartas de uma caixa com data OCG depois do corte MUST ficar de fora
da lista dessa caixa.

#### Scenario: Raridade por caixa
- **WHEN** uma carta foi impressa como Ultra Rara numa caixa e Comum em outra
- **THEN** ela tem raridade Ultra Rara na lista da primeira caixa e Comum na da segunda

#### Scenario: Caixa que passa do corte
- **WHEN** uma caixa TCG mistura cartas de antes e de depois de 30/09/2004
- **THEN** a lista dessa caixa só tem as de antes, e o relatório diz quantas ficaram de fora

### Requirement: Tier 1 inalterado
A campanha Tier 1 SHALL continuar vendendo as mesmas coleções (LOB, MRD, MRL, PSV), nos mesmos preços e dias, e com os
mesmos pacotes de personagem. As listas das quatro coleções SHALL vir dos boosters gerados.

#### Scenario: Loja do dia 1
- **WHEN** o jogador abre a loja no dia 1 de uma campanha nova
- **THEN** LOB e MRD estão à venda pelos mesmos preços de antes, e MRL e PSV continuam fechados até os dias 11 e 21

### Requirement: Relatório da importação
Cada importação SHALL gerar um relatório legível com: total de cartas por tipo (monstros Normais, de Efeito, de Fusão,
de Ritual, Magias, Armadilhas), cartas sem data OCG, cartas sem tradução em português, cartas sem suporte do motor,
correções sem carta e, por booster, o total de cartas e quantas ficaram fora pelo corte.

#### Scenario: Importação concluída
- **WHEN** a importação termina
- **THEN** o relatório mostra os totais por tipo e as listas de cartas sem data OCG, sem português e sem suporte do motor

### Requirement: Deuses Egípcios fora do corte

Obelisk the Tormentor, Slifer the Sky Dragon e The Winged Dragon of Ra SHALL estar na base, com texto em português, como
exceção explícita ao corte de 30/09/2004, porque a campanha os usa. Eles MUST NOT entrar em nenhum booster. O relatório
da importação SHALL listá-los como incluídos à mão.

#### Scenario: Deuses na base

- **WHEN** a base é gerada
- **THEN** os três Deuses estão nela e o motor os joga

#### Scenario: Deus fora dos boosters

- **WHEN** o jogador abre qualquer pacote de qualquer coleção
- **THEN** nenhum dos três Deuses sai no pacote
