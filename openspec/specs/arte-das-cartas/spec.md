# arte-das-cartas Specification

## Purpose

Define a arte das cartas: os dois tamanhos da ilustração recortada, onde cada um aparece, a face desenhada em português
em toda a interface e o que acontece quando a arte não está disponível.

## Requirements

### Requirement: Arte hospedada no projeto
A arte das cartas SHALL ser servida pelo próprio app (mesma origem). A interface MUST NOT carregar imagens de cartas
direto de serviços externos.

#### Scenario: Sem hotlink
- **WHEN** a coleção é aberta
- **THEN** todas as requisições de arte vão para o domínio do app

### Requirement: Dois tamanhos da ilustração
Cada carta SHALL ter a ilustração recortada (sem a moldura oficial) em dois tamanhos: `thumb`, para grades, mão, campo,
cemitério, loja e fim do duelo; e `full`, nítida no zoom da carta numa tela de iPhone. As cartas inteiras com moldura e
texto em inglês MUST NOT existir mais no app.

#### Scenario: Grade usa a miniatura
- **WHEN** a grade da coleção mostra uma carta
- **THEN** ela carrega só a arte `thumb` dessa carta

#### Scenario: Zoom usa a grande
- **WHEN** o jogador abre o zoom de uma carta
- **THEN** a face do zoom usa a arte `full` e não fica borrada a 270 pontos de largura num iPhone

### Requirement: Face desenhada em toda a interface
Toda carta virada para cima na interface (grades do editor, loja, cemitério, fim do duelo, mão, campo e zoom) SHALL ser
a face desenhada pelo template próprio, com nome em português quando houver tradução.

#### Scenario: Carta na loja
- **WHEN** o jogador abre um pacote na loja
- **THEN** as cartas reveladas aparecem com a face desenhada, nome em português, e não como a imagem oficial em inglês

### Requirement: Arte faltando
Quando a arte de uma carta não carrega (sem rede e fora do cache, ou arquivo ausente), a face SHALL continuar inteira e
legível, com a moldura, o nome e os dados, e um preenchimento no lugar da ilustração. O jogo MUST NOT travar nem mostrar
ícone de imagem quebrada.

#### Scenario: Offline sem a arte
- **WHEN** o aparelho está offline e a arte de uma carta da grade não está no cache
- **THEN** a carta aparece com a moldura, o nome e um preenchimento no lugar da ilustração

### Requirement: Nova tentativa da arte
Uma arte que falhou SHALL ser tentada de novo quando a carta voltar a aparecer com a rede disponível, sem precisar
recarregar o app.

#### Scenario: Volta da rede
- **WHEN** uma arte falhou offline e o jogador, já online, rola a grade até a carta de novo
- **THEN** a arte é baixada e aparece na face
