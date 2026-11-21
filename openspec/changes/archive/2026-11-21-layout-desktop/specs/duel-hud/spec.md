## ADDED Requirements

### Requirement: Duelo em três colunas na tela larga
Em tela larga, o duelo SHALL ter 3 colunas: à esquerda, o menu e a placa do oponente em cima e a placa do jogador
embaixo; no centro, a mão do oponente, o campo e a mão do jogador; à direita, o painel da carta, com o botão de avançar
fase no pé. As zonas SHALL derivar só da altura disponível. As placas MUST NOT se esticar pela largura da tela.

#### Scenario: Desktop 1440×900
- **WHEN** um duelo é aberto num viewport de 1440×900
- **THEN** a placa do oponente fica no alto da coluna esquerda e a do jogador embaixo, o campo fica no centro com a mão
  logo abaixo, e nada transborda nem rola

#### Scenario: Tela larga baixa
- **WHEN** o viewport tem 1280×650
- **THEN** a mão encolhe antes das zonas, nenhuma carta fica cortada e a carta da zona não fica menor que 46pt de largura

#### Scenario: Botão de fase
- **WHEN** é a Main Phase 1 do jogador em tela larga
- **THEN** o botão BATALHA aparece no pé da coluna direita

### Requirement: Histórico recente na coluna esquerda
Em tela larga, o espaço entre as duas placas SHALL mostrar as últimas linhas do histórico do duelo (os mesmos textos do
narrador), com a mais nova embaixo.

#### Scenario: Oponente invoca
- **WHEN** o oponente invoca um monstro em tela larga
- **THEN** a linha da invocação aparece por último no histórico da coluna esquerda

### Requirement: Painel fixo da carta na tela larga
Em tela larga, o detalhe da carta (face grande, dados, texto e ligações) SHALL ficar num painel fixo na coluna direita,
no lugar da folha modal. O painel MUST NOT escurecer nem cobrir o campo ou a mão. Sem carta em foco, ele SHALL mostrar
uma dica curta.

#### Scenario: Clique numa carta da mão
- **WHEN** o jogador clica numa carta da mão em tela larga
- **THEN** o painel da direita mostra a carta, e o campo continua visível e sem véu

#### Scenario: Trocar de carta
- **WHEN** há uma carta fixada no painel e o jogador clica em outra carta visível
- **THEN** o painel passa a mostrar a nova carta, sem precisar fechar a anterior

### Requirement: Passar o mouse mostra a carta
Em tela larga, com mouse ou trackpad, passar o ponteiro sobre uma carta visível (zona, mão, topo do Cemitério ou das
Banidas) SHALL mostrar essa carta no painel. Ao sair dela, o painel SHALL voltar à carta fixada, se houver. Cartas
viradas do oponente e versos de deck MUST NOT mudar o painel. Sem ponteiro fino (só toque), não há hover.

#### Scenario: Hover numa zona do oponente
- **WHEN** o jogador passa o mouse sobre um monstro virado para cima do oponente
- **THEN** o painel mostra esse monstro, e ao tirar o mouse volta à carta fixada

#### Scenario: Monstro virado do oponente
- **WHEN** o jogador passa o mouse sobre um monstro virado para baixo do oponente
- **THEN** o painel não muda

### Requirement: Fixar e soltar a carta
Em tela larga, clicar numa carta visível SHALL fixá-la no painel. Clicar de novo na carta fixada ou apertar Esc SHALL
soltá-la. Durante a encenação, o clique MUST NOT fixar carta. Quando há uma escolha no tabuleiro, o clique numa opção
válida SHALL marcar a escolha, como no retrato.

#### Scenario: Soltar com Esc
- **WHEN** há uma carta fixada e o jogador aperta Esc
- **THEN** o painel volta à dica e as ações somem

### Requirement: Ações sobre a carta na tela larga
Em tela larga, as ações da carta fixada (Invocar, Baixar, Ativar, Atacar, Mudar posição…) SHALL aparecer numa fileira
de botões logo acima da própria carta, na mão ou na zona, e acompanhar a posição dela. Sem espaço acima, a fileira SHALL
ir para baixo da carta. As ações MUST NOT aparecer no painel da direita. No retrato, as ações continuam na folha da
carta.

#### Scenario: Invocar da mão
- **WHEN** o jogador clica num monstro da mão que pode ser invocado, em tela larga
- **THEN** os botões Invocar e Baixar aparecem logo acima da carta erguida, e clicar em Invocar faz a invocação

#### Scenario: Atacar
- **WHEN** na Battle Phase o jogador clica num monstro seu que pode atacar
- **THEN** o botão Atacar aparece logo acima da zona dele

### Requirement: Escolhas na coluna direita
Em tela larga, os pedidos do duelo (responder na corrente, escolher cartas fora do tabuleiro, ordenar, escolher
posição, opções) e a barra de escolha no tabuleiro SHALL aparecer na coluna direita, sem cobrir o campo. Enquanto houver
um pedido, a carta em foco SHALL continuar visível de forma compacta acima dele. "Ver campo" MUST NOT existir em tela
larga.

#### Scenario: Corrente do oponente
- **WHEN** o oponente ativa uma armadilha e o jogador pode responder, em tela larga
- **THEN** a pergunta da corrente aparece na coluna direita, e o campo e a mão continuam visíveis e clicáveis para ler as
  cartas

## MODIFIED Requirements

### Requirement: Respiro da tela
Fora da tela larga, a tela de duelo SHALL manter margem lateral e espaçamento entre placa, campo e mão. MUST NOT haver
faixa vazia de fundo entre a placa do oponente e o campo. O espaço vertical que sobrar depois do tamanho máximo das zonas
SHALL ficar entre a placa do jogador e a mão.

#### Scenario: Altura sobrando
- **WHEN** o viewport tem 430×932
- **THEN** há pelo menos 12pt de margem lateral nas placas, o campo começa logo abaixo dos versos da mão do oponente, e
  o espaço livre vertical aparece entre a placa do jogador e a mão

### Requirement: Campo na largura da tela
Fora da tela larga, o campo SHALL poder ocupar a largura da tela até uma borda pequena (~4pt de cada lado), sobre a
margem lateral das placas e da mão. Quando a altura é que limita as zonas, as colunas de pilhas SHALL crescer até a
largura de uma zona para o campo não deixar faixas vazias nas laterais.

#### Scenario: Safari com barras
- **WHEN** o viewport tem 390 de largura e ~709 de altura
- **THEN** o campo vai de ~4pt da borda esquerda a ~4pt da direita, sem faixa vazia de fundo nas laterais

### Requirement: Mão reta
As cartas da mão do jogador SHALL ficar em fila reta, sem arco nem inclinação, sobrepostas só quando faltar largura. A
mão MUST NOT reservar altura para a carta selecionada: ela sobe por cima do que estiver acima da mão (a placa do jogador
no retrato, a borda do campo em tela larga). O espaço economizado SHALL ir para as zonas.

#### Scenario: Carta selecionada
- **WHEN** o jogador toca numa carta da mão
- **THEN** a carta sobe por cima da placa do jogador e as outras continuam alinhadas na mesma altura

#### Scenario: Carta selecionada em tela larga
- **WHEN** o jogador clica numa carta da mão em tela larga
- **THEN** a carta sobe sem empurrar o campo, e as outras continuam alinhadas na mesma altura
