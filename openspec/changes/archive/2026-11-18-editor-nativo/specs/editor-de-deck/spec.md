## ADDED Requirements

### Requirement: Cabeçalho do deck
O editor SHALL mostrar no topo a contagem do deck principal ("Main N", com "40–60") e do Extra Deck ("Extra N", com "até
15"). Um deck válido SHALL mostrar o selo PRONTO; um inválido SHALL mostrar quantos problemas tem. Tocar no selo de
problemas SHALL abrir "O que falta no deck" com a lista dos problemas.

#### Scenario: Deck pronto
- **WHEN** o deck em edição tem 40 cartas no principal e nenhum problema
- **THEN** o cabeçalho mostra "Main 40" e o selo PRONTO

#### Scenario: Deck curto
- **WHEN** o deck tem 37 cartas e o jogador toca no selo de problemas
- **THEN** abre "O que falta no deck" dizendo que faltam 3 cartas no deck principal

### Requirement: Vários decks
O jogador SHALL poder ter até 5 decks. O topo do editor SHALL mostrar qual deck está em edição e se ele é o deck em uso.
A folha dos decks SHALL listar os decks (com a contagem e se estão prontos) e oferecer Novo deck (até 5), Renomear,
Apagar (nunca o último) e "Usar este deck", que só vale para um deck válido.

#### Scenario: Trocar o deck em uso
- **WHEN** o jogador abre a folha, escolhe o "Deck 2", que está válido, e toca em "Usar este deck"
- **THEN** o "Deck 2" passa a ser o deck em uso nos duelos e o topo mostra "Em uso"

#### Scenario: Limite de decks
- **WHEN** o jogador já tem 5 decks
- **THEN** "Novo deck" fica indisponível

### Requirement: Painel do deck
O deck em edição SHALL ficar à vista no alto da tela, em 6 colunas, com as cartas agrupadas por tipo, nesta ordem:
monstros Normais, monstros de Efeito (e Ritual), Magias e Armadilhas, e o Extra Deck numa seção própria. Cada cópia
SHALL aparecer como uma carta. Deck vazio SHALL mostrar como pôr cartas (tocar ou arrastar da maleta).

#### Scenario: Agrupado
- **WHEN** o deck tem monstros, magias e uma Fusão
- **THEN** os monstros vêm antes das magias e a Fusão aparece na seção do Extra Deck

### Requirement: Maleta
A coleção SHALL ficar numa maleta abaixo do deck, numa gaveta com três posições: recolhida (só a alça), no meio (o deck
com cerca de 40% da altura) e aberta (o deck reduzido a uma linha). A alça SHALL abrir e recolher com toque e com
arraste, e a posição SHALL ser lembrada no aparelho. Recolhida, a alça SHALL resumir a ordenação, o filtro e a busca.
Na maleta, cada cópia SHALL ser uma miniatura, com as cópias que já estão no deck apagadas e marcadas.

#### Scenario: Lembrar a gaveta
- **WHEN** o jogador deixa a maleta aberta, sai do editor e volta
- **THEN** a maleta continua aberta

#### Scenario: Cópias no deck
- **WHEN** o jogador tem 3 Castor Guerreiro e 2 estão no deck
- **THEN** a maleta mostra 3 miniaturas do Castor Guerreiro, 2 apagadas e marcadas

### Requirement: Ordenar, filtrar e buscar
A maleta SHALL ordenar por Tipo de carta, Nível, ATK, DEF, Nome, Atributo, Tipo de monstro, Raridade, Cópias ou Obtenção,
com a opção de inverter a ordem. Nas ordens de monstro (Nível, ATK, DEF, Atributo, Tipo de monstro), os monstros SHALL vir
antes das magias e armadilhas. Empates SHALL seguir tipo, nível e nome. A maleta SHALL filtrar por Todas, Monstros, Fusão,
Magias e Armadilhas e buscar pelo nome da carta. A ordenação SHALL ser lembrada no aparelho. Mudar ordem, filtro ou busca
SHALL voltar a maleta ao topo.

#### Scenario: Maior ATK
- **WHEN** o jogador escolhe ATK
- **THEN** a maleta começa pelo monstro de maior ATK e as magias e armadilhas vêm depois dos monstros

#### Scenario: Inverter
- **WHEN** o jogador ordena por Nome e toca em Inverter
- **THEN** a maleta vai de Z para A

#### Scenario: Obtenção
- **WHEN** o jogador ordena por Obtenção logo depois de abrir um pacote
- **THEN** as cartas desse pacote aparecem primeiro

### Requirement: Pôr e tirar pelo zoom
Tocar numa carta (do deck ou da maleta) SHALL abrir o zoom com "No deck X · Você tem Y" e os botões "Tirar do deck" e
"Pôr no deck". Pôr SHALL respeitar as regras do deck (até 3 cópias, limitadas a 1, principal até 60, Extra até 15,
Fusões só no Extra) e as cópias que o jogador tem.

#### Scenario: Sem cópia sobrando
- **WHEN** o jogador tem 2 cópias de uma carta e as 2 estão no deck
- **THEN** "Pôr no deck" fica indisponível no zoom

### Requirement: Arrastar cartas
Segurar uma carta da maleta e soltá-la no painel do deck SHALL pôr uma cópia; segurar uma carta do deck e soltá-la na
maleta SHALL tirar uma cópia. Durante o arraste, uma cópia da carta SHALL seguir o dedo, um pouco maior e com sombra;
soltar fora do destino SHALL devolvê-la sem mudar nada. Um toque rápido e a rolagem MUST continuar funcionando como
antes (o arraste só começa depois de segurar). Uma recusa SHALL mostrar um aviso curto com o motivo: "Você só tem N
cópia(s)", "Máximo de N cópia(s)", "O deck principal está cheio" ou "O Extra Deck está cheio".

#### Scenario: Arrastar para o deck
- **WHEN** o jogador segura um Castor Guerreiro na maleta e solta no painel do deck
- **THEN** o deck ganha um Castor Guerreiro e toca o som de pôr

#### Scenario: Recusa
- **WHEN** o jogador arrasta uma quarta cópia de uma carta para o deck
- **THEN** o deck não muda e aparece "Máximo de 3 cópias"

#### Scenario: Rolar a maleta
- **WHEN** o jogador desliza o dedo na maleta sem segurar
- **THEN** a maleta rola e nenhuma carta é arrastada

### Requirement: Gravar a cada mudança
Toda mudança no deck (pôr, tirar, renomear, trocar o deck em uso) SHALL ser gravada na hora, sem botão de salvar, e
SHALL tocar o som de pôr ou de tirar carta quando for uma carta.

#### Scenario: Fechar o app
- **WHEN** o jogador põe uma carta no deck e fecha o app
- **THEN** ao abrir de novo, a carta continua no deck
