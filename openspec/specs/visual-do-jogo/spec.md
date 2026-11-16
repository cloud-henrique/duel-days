# visual-do-jogo Specification

## Purpose
Define a identidade visual compartilhada pelas telas do jogo, no padrão do *Duel Links* que o app nativo usa: fontes de
números, títulos e destaques, a família de ícones, o DP como dinheiro do jogo e a moeda e o dado desenhados.

## Requirements

### Requirement: Fonte dos números e títulos
Os números em destaque SHALL usar a fonte do jogo (Chakra Petch, negrito):
- LP e a variação de LP;
- ATK/DEF;
- DP;
- contadores (deck, mão, cemitério, cópias, dia).

Os títulos de tela, de seção e de diálogo também SHALL usar essa fonte. Os números que contam (LP, DP) MUST manter a
largura enquanto mudam, sem a linha tremer. A fonte MUST funcionar offline.

#### Scenario: LP contando
- **WHEN** o LP de um duelista cai de 8000 para 7500
- **THEN** os números aparecem na fonte do jogo e a placa não muda de largura durante a contagem

#### Scenario: Sem rede
- **WHEN** o app instalado é aberto sem rede depois da primeira visita
- **THEN** os números e títulos continuam na fonte do jogo

### Requirement: Títulos de destaque
Os títulos de momento do duelo ("DUELO!", "VITÓRIA!", "DERROTA" e "EMPATE") SHALL aparecer em letras serifadas, pretas,
em itálico e grandes. Cada um SHALL ter um degradê vertical e um brilho na cor do momento:
- "DUELO!" e "VITÓRIA!": amarelo → laranja → vermelho;
- "DERROTA": vermelho → vinho;
- "EMPATE": prata.

Numa tela estreita, o título MUST encolher em vez de quebrar ou cortar a palavra.

#### Scenario: Vitória
- **WHEN** o jogador vence um duelo
- **THEN** "VITÓRIA!" aparece em serifada itálica com degradê quente e brilho, e não na fonte padrão do sistema

#### Scenario: Tela estreita
- **WHEN** o fim do duelo aparece numa tela de 320 px de largura
- **THEN** o título cabe numa linha, menor

### Requirement: Uma família de ícones
Os controles da interface (fechar, voltar, setas, busca, ordenar, menu) e os conceitos do jogo SHALL usar ícones de uma
única família, no estilo cheio. Os conceitos do jogo com ícone próprio (DP, deck, Extra Deck, cemitério, coleção, loja,
pacote, duelo, mapa) SHALL ter sempre o mesmo ícone em todas as telas. Os símbolos de texto que fazem as vezes de
ícone ("◎", "⋯", "☰") MUST NOT aparecer.

#### Scenario: Dinheiro na loja e no mapa
- **WHEN** o jogador olha o saldo no mapa e depois na loja
- **THEN** os dois mostram o mesmo ícone de DP

### Requirement: Ícones grandes no padrão do jogo
Os ícones usados sozinhos e grandes SHALL ter o tratamento do *Duel Links*: degradê branco → ciano, contorno marinho e
um brilho fraco. Isso vale para os botões da tela de título, os botões só de ícone das barras e as telas vazias. Ao lado
de texto, o ícone SHALL ficar numa cor só, a do texto.

#### Scenario: Botão de ajustes
- **WHEN** a tela de título é exibida
- **THEN** o botão de ajustes mostra a engrenagem com degradê branco → ciano e contorno marinho

### Requirement: DP como dinheiro do jogo
O dinheiro do jogo SHALL se chamar **DP** e aparecer sempre como o ícone de moedas seguido do valor e de "DP" (ex.:
"500 DP"). Nenhum texto da interface MUST chamar o dinheiro de "moedas". Os valores ganhos e gastos não mudam com o novo
nome.

#### Scenario: Fim do duelo
- **WHEN** o jogador vence um duelo
- **THEN** o fim mostra o ganho como "+100 DP" com o ícone de moedas

#### Scenario: Save antigo
- **WHEN** um save com 450 moedas é carregado
- **THEN** o saldo aparece como 450 DP

### Requirement: Moeda desenhada
A moeda do jogo SHALL ser uma moeda dourada desenhada, com "CARA" numa face e "COROA" na outra. Ela gira no eixo
vertical e para no lado que caiu. É a mesma moeda na abertura do duelo e nos efeitos de carta.

Quando o jogador escolhe um lado antes do lance:
- acima da moeda SHALL aparecer a escolha ("Você disse cara");
- depois de parar, SHALL aparecer o resultado ("Acertou!" ou "Errou!").

Com "reduzir movimento", a moeda SHALL aparecer já parada no lado que caiu.

#### Scenario: Efeito com escolha
- **WHEN** o jogador escolhe "Cara" no efeito do Mago do Tempo e a moeda cai em coroa
- **THEN** aparece "Você disse cara", a moeda dourada gira e para em "COROA", e então aparece "Errou!"

#### Scenario: Reduzir movimento
- **WHEN** "reduzir movimento" está ativo e um efeito lança a moeda
- **THEN** a moeda aparece parada no lado que caiu, sem girar

### Requirement: Dado desenhado
O dado SHALL ser desenhado no mesmo padrão da moeda: um dado claro com os pontos do resultado, que gira e para no número
sorteado, e então o resultado aparece em texto.

#### Scenario: Lance de dado
- **WHEN** um efeito lança um dado e sai 4
- **THEN** um dado gira, para mostrando os quatro pontos e o texto do resultado aparece

### Requirement: Fundo de circuito e brilho dos componentes
O fundo das telas SHALL ser o padrão do app nativo: colmeia de hexágonos com trilhas e pontos de circuito em ciano
translúcido sobre um degradê radial azul, mais claro no centro. O tabuleiro, as placas e as molduras dos retratos SHALL
ter um brilho ciano suave; a placa de quem joga o turno brilha mais forte. As cartas da mão MUST NOT ter brilho.

#### Scenario: Duelo aberto
- **WHEN** o duelo é exibido
- **THEN** o fundo mostra a colmeia de circuito, o tabuleiro e as placas têm brilho ciano e as cartas da mão não brilham
