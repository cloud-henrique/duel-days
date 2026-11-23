# editor-de-deck Specification

## Purpose
Define o editor "Meu deck": os decks salvos, o cabeçalho e o painel do deck, a maleta com ordenação, filtros e busca,
pôr e tirar cartas (pelo zoom ou arrastando), as recusas com motivo, a gravação a cada mudança e a composição em três
colunas na tela larga.

## Requirements

### Requirement: Cabeçalho do deck
O editor SHALL mostrar no topo a contagem do deck principal ("Main N", com "20–30") e do Extra Deck ("Extra N", com "até
5"), pelas regras do formato do duelo. Um deck válido SHALL mostrar o selo PRONTO; um inválido SHALL mostrar quantos
problemas tem. Tocar no selo de problemas SHALL abrir "O que falta no deck" com a lista dos problemas.

#### Scenario: Deck pronto
- **WHEN** o deck em edição tem 30 cartas no principal e nenhum problema
- **THEN** o cabeçalho mostra "Main 30" e o selo PRONTO

#### Scenario: Deck curto
- **WHEN** o deck tem 17 cartas e o jogador toca no selo de problemas
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
O deck em edição SHALL ficar à vista no alto da tela (no retrato, em 6 colunas; na tela larga, na coluna esquerda, com as colunas pelo tamanho das cartas), com as cartas agrupadas por tipo, nesta ordem:
monstros Normais, monstros de Efeito (e Ritual), Magias e Armadilhas, e o Extra Deck numa seção própria. Cada cópia
SHALL aparecer como uma carta. Deck vazio SHALL mostrar como pôr cartas (tocar ou arrastar da maleta).

#### Scenario: Agrupado
- **WHEN** o deck tem monstros, magias e uma Fusão
- **THEN** os monstros vêm antes das magias e a Fusão aparece na seção do Extra Deck

#### Scenario: Painel na tela larga
- **WHEN** o jogador abre o editor numa janela de 1440×900 com o tamanho M
- **THEN** o painel do deck fica na coluna esquerda, com mais de 2 cartas por linha e os mesmos grupos

### Requirement: Maleta
No retrato, a coleção SHALL ficar numa maleta abaixo do deck, numa gaveta com três posições: recolhida (só a alça), no
meio (o deck com cerca de 40% da altura) e aberta (o deck reduzido a uma linha). A alça SHALL abrir e recolher com toque
e com arraste, e a posição SHALL ser lembrada no aparelho. Recolhida, a alça SHALL resumir a ordenação, o filtro e a
busca. Na maleta, cada cópia SHALL ser uma miniatura, com as cópias que já estão no deck apagadas e marcadas.

#### Scenario: Lembrar a gaveta
- **WHEN** o jogador deixa a maleta aberta, sai do editor e volta
- **THEN** a maleta continua aberta

#### Scenario: Cópias no deck
- **WHEN** o jogador tem 3 Castor Guerreiro e 2 estão no deck
- **THEN** a maleta mostra 3 miniaturas do Castor Guerreiro, 2 apagadas e marcadas

#### Scenario: Maleta na tela larga
- **WHEN** o jogador deixou a gaveta recolhida no celular e abre o editor numa janela de 1440×900
- **THEN** a maleta aparece inteira na coluna do meio, e no celular a gaveta continua recolhida

### Requirement: Maleta na tela larga
Na tela larga, a maleta SHALL ficar na coluna do meio, sem gaveta nem alça; a posição lembrada da gaveta continua
valendo no retrato.

#### Scenario: Voltar ao retrato
- **WHEN** o jogador deixou a gaveta no meio, usa o editor na tela larga e depois volta ao retrato
- **THEN** na tela larga a maleta fica na coluna do meio, sem alça; no retrato a gaveta continua no meio

### Requirement: Ordenar, filtrar e buscar
A maleta SHALL ordenar por Tipo de carta, Nível, ATK, DEF, Nome, Atributo, Tipo de monstro, Raridade, Cópias ou
Obtenção, podendo inverter a ordem. Nas ordens de monstro (Nível, ATK, DEF, Atributo, Tipo de monstro), os monstros
SHALL vir antes das magias e armadilhas; empates seguem tipo, nível e nome. A maleta SHALL filtrar por Todas, Monstros,
Fusão, Magias e Armadilhas e buscar pelo nome. A ordenação SHALL ser lembrada no aparelho. Mudar ordem, filtro ou busca
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
No retrato, tocar numa carta (do deck ou da maleta) SHALL abrir o zoom com "No deck X · Você tem Y" e os botões "Tirar do deck" e
"Pôr no deck". Pôr SHALL respeitar as regras do deck (até 3 cópias, limitadas a 1, principal até 30, Extra até 5,
Fusões só no Extra) e as cópias que o jogador tem.

Na tela larga, as mesmas informações e os mesmos botões SHALL ficar no painel da carta, sem abrir o zoom.

#### Scenario: Sem cópia sobrando
- **WHEN** o jogador tem 2 cópias de uma carta e as 2 estão no deck
- **THEN** "Pôr no deck" fica indisponível no zoom

#### Scenario: Deck principal cheio
- **WHEN** o deck principal tem 30 cartas
- **THEN** "Pôr no deck" de um monstro da maleta é recusado com o motivo de deck cheio

#### Scenario: Sem zoom na tela larga
- **WHEN** o jogador clica numa carta da maleta numa janela de 1440×900
- **THEN** nenhum zoom abre, e o painel da direita mostra a carta com "Pôr no deck"

### Requirement: Arrastar cartas
Segurar uma carta da maleta e soltá-la no painel do deck SHALL pôr uma cópia; segurar uma carta do deck e soltá-la na
maleta SHALL tirar uma cópia. Durante o arraste, uma cópia da carta SHALL seguir o dedo, um pouco maior e com sombra;
soltar fora do destino SHALL devolvê-la sem mudar nada. Um toque rápido e a rolagem MUST continuar funcionando como
antes (o arraste só começa depois de segurar).

#### Scenario: Arrastar para o deck
- **WHEN** o jogador segura um Castor Guerreiro na maleta e solta no painel do deck
- **THEN** o deck ganha um Castor Guerreiro e toca o som de pôr

#### Scenario: Recusa
- **WHEN** o jogador arrasta uma quarta cópia de uma carta para o deck
- **THEN** o deck não muda e aparece "Máximo de 3 cópias"

#### Scenario: Rolar a maleta
- **WHEN** o jogador desliza o dedo na maleta sem segurar
- **THEN** a maleta rola e nenhuma carta é arrastada

#### Scenario: Arrastar com mouse
- **WHEN** na tela larga o jogador aperta o botão do mouse sobre um Castor Guerreiro na maleta, move até o painel do deck e solta
- **THEN** o deck ganha um Castor Guerreiro, sem precisar segurar antes de mover

### Requirement: Recusa ao arrastar
Uma carta que não pode entrar no deck SHALL voltar com um aviso curto com o motivo: "Você só tem N cópia(s)", "Máximo de
N cópia(s)", "O deck principal está cheio" ou "O Extra Deck está cheio".

#### Scenario: Quarta cópia
- **WHEN** o jogador arrasta para o deck uma carta que já tem 3 cópias nele
- **THEN** a carta volta e aparece o aviso "Máximo de 3 cópia(s)"

### Requirement: Arrastar com mouse
Com mouse, o arraste SHALL começar ao mover o ponteiro com o botão apertado, sem esperar; um clique sem mover continua
sendo clique. A cópia da carta segue o ponteiro.

#### Scenario: Clique sem mover
- **WHEN** o jogador clica numa carta da maleta sem mover o mouse
- **THEN** é um clique comum, sem começar arraste

### Requirement: Gravar a cada mudança
Toda mudança no deck (pôr, tirar, renomear, trocar o deck em uso) SHALL ser gravada na hora, sem botão de salvar, e
SHALL tocar o som de pôr ou de tirar carta quando for uma carta.

#### Scenario: Fechar o app
- **WHEN** o jogador põe uma carta no deck e fecha o app
- **THEN** ao abrir de novo, a carta continua no deck

### Requirement: Desfazer mudanças e limpar o deck
A folha dos decks SHALL ter "Desfazer mudanças", que volta as cartas do deck em edição a como estavam no começo da
visita ao editor, e "Limpar", que tira todas as cartas. As duas SHALL pedir um segundo toque, com um aviso do que vai
acontecer, e MUST NOT mudar o nome do deck. Sem mudança na visita, "Desfazer mudanças" fica indisponível; com o deck
vazio, "Limpar" fica indisponível.

#### Scenario: Desfazer as mudanças da visita
- **WHEN** o jogador tira 3 cartas do deck, abre a folha dos decks, toca em "Desfazer mudanças" e confirma
- **THEN** o deck volta às cartas que tinha quando o editor foi aberto

#### Scenario: Limpar o deck em uso
- **WHEN** o jogador toca em "Limpar" no deck em uso
- **THEN** aparece o aviso de que é o deck em uso, e o deck só fica vazio depois do segundo toque

#### Scenario: Desfazer uma limpeza
- **WHEN** o jogador limpa o deck e depois toca em "Desfazer mudanças" e confirma
- **THEN** o deck volta às cartas do começo da visita

#### Scenario: Nada para desfazer
- **WHEN** o jogador abre a folha dos decks sem ter mexido no deck nesta visita
- **THEN** "Desfazer mudanças" fica indisponível

### Requirement: Editor em três colunas na tela larga
Na tela larga, o editor SHALL mostrar lado a lado, sem gaveta: o painel do deck à esquerda, a maleta (com ordem, filtro
e busca) no meio e o painel da carta à direita. O deck e a maleta SHALL rolar cada um por conta própria. O cabeçalho do
deck (contagens e selo PRONTO) continua no alto.

#### Scenario: Editor no desktop
- **WHEN** o jogador abre "Meu deck" numa janela de 1440×900
- **THEN** o deck, a maleta e o painel da carta aparecem lado a lado, sem a alça da gaveta, e nada transborda

#### Scenario: Rolar só a maleta
- **WHEN** o jogador rola a maleta até o fim em tela larga
- **THEN** o painel do deck continua parado no mesmo lugar

### Requirement: Painel da carta no editor
Na tela larga, passar o mouse numa carta do deck ou da maleta SHALL mostrá-la no painel da direita, e clicar SHALL
fixá-la. O painel SHALL mostrar a face grande, os dados, o texto, "No deck X · Você tem Y" e os botões "Tirar do deck"
e "Pôr no deck", com as mesmas regras do zoom. Esc ou um novo clique na carta fixada SHALL soltá-la. Rolar a maleta
SHALL voltar o painel à carta fixada.

#### Scenario: Pôr pelo painel
- **WHEN** o jogador clica num Castor Guerreiro na maleta e depois em "Pôr no deck" no painel
- **THEN** o deck ganha um Castor Guerreiro, o painel passa a mostrar "No deck" com uma cópia a mais e nenhum modal abre

#### Scenario: Hover
- **WHEN** há uma carta fixada e o jogador passa o mouse sobre outra carta da maleta
- **THEN** o painel mostra a carta sob o mouse e volta à fixada quando o mouse sai
