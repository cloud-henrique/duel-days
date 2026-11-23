# loja-de-pacotes Specification

## Purpose
TBD - created by archiving change loja-nativa. Update Purpose after archive.

## Requirements

### Requirement: Balcão do vovô
A loja SHALL abrir com o balcão da Loja de Jogos do Vovô no topo: o Solomon atrás do balcão, o nome da loja e o saldo
em DP. Ao entrar, o vovô SHALL dizer uma fala de boas-vindas num balão; o balão SHALL sumir sozinho depois de alguns
segundos ou com um toque, sem bloquear o resto da tela. Depois de uma compra o saldo SHALL contar até o valor novo e o
vovô SHALL dizer uma fala da compra (pacote ou caixa); se uma abertura trouxer Ultra Rara, a fala ao voltar SHALL ser a
de Ultra. Tentar comprar sem DP SHALL trazer uma fala de "sem DP". As falas SHALL sair dos dados do balconista, com o
nome e o tratamento do jogador.

#### Scenario: Boas-vindas
- **WHEN** o jogador entra na loja
- **THEN** o balcão mostra o vovô, "Loja de Jogos do Vovô", o saldo em DP e um balão de boas-vindas com o nome do jogador

#### Scenario: Depois da compra
- **WHEN** o jogador com 400 DP compra um LOB e fecha a abertura
- **THEN** o saldo conta até 250 DP e o vovô agradece a compra

#### Scenario: Saiu Ultra
- **WHEN** a abertura de um pacote revela uma Ultra Rara e o jogador volta à loja
- **THEN** o vovô diz uma fala de Ultra Rara

### Requirement: Vitrine
Abaixo do balcão, a loja SHALL mostrar, nesta ordem: "Pacotes ganhos" (só quando houver pacotes ganhos fechados, com o
número deles e o botão "Abrir pacote grátis"), "À venda" (as coleções) e "Pacotes de personagem". As coleções e os
pacotes de personagem SHALL aparecer em grade de capas com o nome e o preço em DP. Um pacote bloqueado SHALL mostrar a
capa apagada com um ícone e o motivo ("Dia 7", "Tier 2", "3/5"); sem DP, o preço SHALL vir com "faltam N DP";
um pacote recém-liberado SHALL ter o selo NOVA. Tocar numa capa liberada SHALL abrir o detalhe do pacote; tocar numa
bloqueada SHALL só balançar a capa e mostrar o motivo (no próximo tier, o chefe que falta vencer). Pacote sem arquivo de
capa SHALL usar uma capa desenhada com o nome.

#### Scenario: Coleção do próximo tier
- **WHEN** o tier atual é o Tier 1 no dia 4
- **THEN** a vitrine mostra LON, LOD e PGD apagados com "Tier 2", e tocar neles não abre nada e mostra "Chega com o
  Tier 2, depois de vencer Yugi"

#### Scenario: Sem pacotes ganhos
- **WHEN** o jogador já abriu todos os pacotes ganhos
- **THEN** a seção "Pacotes ganhos" não aparece

### Requirement: Detalhe do pacote
O detalhe do pacote SHALL mostrar a capa, o nome, a contagem de cartas por raridade (Ultra, Super, Rara, Comum, cada uma
na sua cor), quantas cartas diferentes do pacote o jogador tem ("14 de 104 cartas") com uma barra de progresso, o balcão
compacto e a grade com todas as cartas do pacote, com as que o jogador não tem apagadas. Tocar numa carta SHALL abrir o
detalhe da carta. Uma barra fixa embaixo SHALL mostrar o saldo e os botões "Comprar 1 pacote" e "Caixa · 20 pacotes",
cada um com o preço ou com "faltam N DP" (desabilitado). Comprar a caixa SHALL pedir confirmação com o total, a economia
sobre 20 avulsos e o saldo depois; cancelar ou tocar fora MUST NOT gastar DP.

#### Scenario: Progresso no pacote
- **WHEN** o jogador tem 14 cartas diferentes do LOB e abre o detalhe do LOB
- **THEN** o detalhe mostra "14 de 104 cartas" e as outras 90 aparecem apagadas na grade

#### Scenario: Caixa cancelada
- **WHEN** o jogador toca em "Caixa · 20 pacotes" e depois em "Cancelar"
- **THEN** o saldo continua o mesmo e nenhum pacote é aberto

#### Scenario: Sem DP para o avulso
- **WHEN** o jogador tem 60 DP e abre o detalhe do LOB
- **THEN** "Comprar 1 pacote" mostra "faltam 90 DP" e não compra

### Requirement: Abertura de pacote
Abrir um pacote (comprado ou ganho) SHALL levar a uma tela cheia com o pacote fechado e "Toque no pacote para abrir".
Tocar no pacote SHALL rasgá-lo (com som) e mostrar as 5 cartas viradas para baixo, 3 em cima e 2 embaixo. Tocar numa
carta virada para baixo SHALL virá-la; tocar numa carta já virada SHALL abrir o detalhe da carta. Cada carta virada SHALL
mostrar o rótulo da raridade (Comum, Rara, Super Rara, Ultra Rara) com o brilho da cor dela, e o selo NOVA se o jogador
não a tinha antes deste pacote; Super e Ultra SHALL tocar o som de rara. "Revelar tudo" SHALL virar as que faltam. Com
todas viradas, "Pronto" SHALL mostrar quantas cartas novas entraram e voltar. As cartas e o DP SHALL estar gravados
antes da encenação: fechar a tela no meio MUST NOT perder cartas nem cobrar de novo.

#### Scenario: Revelar tudo
- **WHEN** o jogador rasga um LOB e toca em "Revelar tudo"
- **THEN** as 5 cartas aparecem viradas com a raridade e o NOVA nas que ele não tinha, e o botão "Pronto" aparece

#### Scenario: Fechar no meio
- **WHEN** o jogador compra um pacote, rasga e fecha a tela antes de virar as cartas
- **THEN** as 5 cartas já estão na coleção e o DP foi cobrado uma vez só

### Requirement: Vários pacotes de uma vez
Ao comprar a caixa, a abertura SHALL seguir pacote a pacote, com a posição no título ("Pacote 3 de 20"), o botão "Abrir
todos" e, com as cartas do pacote viradas, "Próximo pacote" (ou "Ver resumo" no último). "Abrir todos" SHALL pular para o
resumo. O resumo SHALL mostrar todas as cartas da caixa ordenadas da raridade mais alta para a mais baixa, com as raras
destacadas e o NOVA, e o número de cartas novas. Os pacotes ganhos SHALL ser abertos um por vez a cada toque em "Abrir
pacote grátis".

#### Scenario: Pular para o resumo
- **WHEN** o jogador compra uma caixa de MRD e toca em "Abrir todos" no primeiro pacote
- **THEN** aparece o resumo com as 100 cartas, Ultras primeiro

### Requirement: Ajuda dos pacotes
O topo da loja SHALL ter um botão de ajuda que abre "Como funcionam os pacotes?", com a composição (4 comuns e 1 carta de
raridade), as chances da carta de raridade e a regra da caixa (20 pacotes com desconto, as mesmas cartas de comprar um a
um).

#### Scenario: Ver as chances
- **WHEN** o jogador toca na ajuda
- **THEN** o texto mostra 70% Rara, 20% Super Rara e 10% Ultra Rara

### Requirement: Movimento reduzido na loja
Com "reduzir movimento" ligado no sistema, a cascata da vitrine, o balanço, o rasgo e o giro das
cartas SHALL virar transições de opacidade, sem perder nenhum passo do fluxo.

#### Scenario: Abrir com movimento reduzido
- **WHEN** "reduzir movimento" está ligado e o jogador abre um pacote
- **THEN** o pacote e as cartas aparecem por esmaecimento, e "Revelar tudo" e "Pronto" funcionam igual

### Requirement: Loja na tela larga
Na tela larga, o conteúdo da loja (balcão, pacotes ganhos e vitrine) SHALL ficar centralizado com largura máxima, e as
capas da vitrine SHALL ter um tamanho máximo (cerca de 190px de largura), com quantas couberem por linha. No detalhe do
pacote, a grade de cartas SHALL seguir o tamanho das cartas escolhido, e a barra de compra SHALL ter largura máxima. No
resumo da abertura, as cartas também SHALL seguir o tamanho escolhido.

#### Scenario: Vitrine no desktop
- **WHEN** o jogador abre a loja numa janela de 1440×900
- **THEN** as capas da vitrine ficam com no máximo ~190px de largura, várias por linha, e o vovô do balcão aparece inteiro

#### Scenario: Detalhe do pacote no desktop
- **WHEN** o jogador abre o detalhe do LOB numa janela de 1440×900
- **THEN** as cartas do pacote seguem o tamanho escolhido e os botões de compra não ocupam a largura toda da tela
