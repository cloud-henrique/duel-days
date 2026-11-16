# Spec Delta

## Purpose

Define a economia da campanha em DP, portada do app nativo: o começo da campanha, o que cada duelo paga, as cartas
ganhas por vitória, os pacotes à venda (coleções e pacotes de personagem) e o conteúdo de cada pacote.

## ADDED Requirements

### Requirement: Começo da campanha
Uma campanha nova SHALL começar com 0 DP, com o deck inicial do nativo (40 cartas) como coleção e deck ativo, e com 3
pacotes LOB fechados para abrir na loja.

#### Scenario: Campanha nova
- **WHEN** o jogador começa a campanha
- **THEN** ele tem 0 DP, a coleção é o deck inicial de 40 cartas, que já está ativo, e há 3 pacotes LOB para abrir

### Requirement: DP por duelo
Uma vitória SHALL pagar 300 DP de base, mais os bônus que valerem:
- +20% se o jogador terminou com ao menos metade dos LP;
- +20% se venceu até o turno 10;
- +10% se terminou sem perder LP.

O bônus somado MUST NOT passar de +50%. Derrota, empate e desistência SHALL pagar 60 DP, sem bônus. O duelo contra o
chefe e o duelo de evento seguem a mesma tabela. O fim do duelo SHALL mostrar a base e cada bônus.

#### Scenario: Vitória rápida e limpa
- **WHEN** o jogador vence no turno 7 sem perder LP
- **THEN** ganha 450 DP (300 + 50%, no teto), com os três bônus listados

#### Scenario: Derrota
- **WHEN** o jogador perde um duelo
- **THEN** ganha 60 DP

### Requirement: Carta por vitória
Cada vitória SHALL dar uma carta sorteada entre as cópias do deck do oponente. Ficam de fora as cartas limitadas e as
que o jogador já tem em 3 cópias. Na 10ª vitória contra o mesmo duelista, o jogador SHALL ganhar também a
carta-assinatura dele:
- Tristan: Sengenjin;
- Tea: Dark Magician Girl;
- Joey: Red-Eyes Black Dragon;
- Bakura: Man-Eater Bug;
- Yugi: Dark Magician.

A carta ganha SHALL aparecer no fim do duelo, com o selo NOVA se o jogador não a tinha.

#### Scenario: Assinatura
- **WHEN** o jogador vence o Joey pela 10ª vez
- **THEN** o fim do duelo mostra a carta sorteada e o Red-Eyes Black Dragon

### Requirement: Pacotes à venda
A loja SHALL vender as coleções da época, cada uma liberada a partir de um dia:
- LOB, 150 DP, desde o dia 1;
- MRD, 200 DP, desde o dia 1;
- MRL, 200 DP, a partir do dia 11;
- PSV, 225 DP, a partir do dia 21.

Um pacote ainda fechado SHALL aparecer bloqueado com o dia em que abre. Sem DP suficiente, o pacote SHALL dizer
quantos DP faltam. Cada coleção SHALL poder ser comprada em pacote avulso ou na caixa de 20, com 10% de desconto
arredondado para baixo na dezena.

#### Scenario: Antes do dia 11
- **WHEN** o jogador abre a loja no dia 6
- **THEN** o MRL aparece bloqueado com "Dia 11"

#### Scenario: Sem DP
- **WHEN** o jogador tem 120 DP e olha o LOB
- **THEN** o LOB diz que faltam 30 DP e não deixa comprar

### Requirement: Pacotes de personagem
Cada duelista SHALL ter um pacote próprio, com as cartas do estilo dele, vendido a 250 DP. O pacote SHALL aparecer na
loja depois de 5 vitórias contra o dono, e antes disso SHALL mostrar o progresso ("3/5").

#### Scenario: Liberar o pacote do Tristan
- **WHEN** o jogador vence o Tristan pela 5ª vez
- **THEN** o pacote do Tristan fica à venda na loja

### Requirement: Conteúdo do pacote
Cada pacote SHALL ter 5 cartas da coleção dele: 4 comuns e 1 carta de raridade. A carta de raridade SHALL ser Rara
(70%), Super Rara (20%) ou Ultra Rara (10%). Se a coleção não tiver a raridade sorteada, vale a raridade abaixo até a
Rara, e então a de cima. O sorteio SHALL sair da semente da campanha e do número de pacotes abertos. As cartas entram
na coleção ao abrir o pacote, com o selo NOVA nas que o jogador não tinha.

#### Scenario: Abrir um LOB
- **WHEN** o jogador abre um pacote LOB
- **THEN** aparecem 5 cartas do LOB, 4 comuns e 1 Rara, Super ou Ultra, e elas entram na coleção

### Requirement: Loja na campanha
A loja SHALL ficar na Loja de Jogos do Vovô e mostrar o saldo em DP, os pacotes ganhos ainda fechados, as coleções à
venda e os pacotes de personagem. Entrar na loja, comprar e abrir pacotes MUST NOT gastar período.

#### Scenario: Pacotes ganhos
- **WHEN** o jogador entra na loja no começo da campanha
- **THEN** a loja mostra os 3 pacotes LOB ganhos para abrir, sem cobrar DP
