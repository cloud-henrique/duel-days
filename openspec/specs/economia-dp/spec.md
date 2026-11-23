# economia-dp Specification

## Purpose
Define a economia da campanha em DP, portada do app nativo: o começo da campanha, o que cada duelo paga, as cartas
ganhas por vitória, os pacotes à venda (coleções e pacotes de personagem) e o conteúdo de cada pacote.

## Requirements

### Requirement: Começo da campanha
Uma campanha nova SHALL começar com:
- 0 DP;
- as 40 cartas do deck inicial do nativo na coleção;
- um deck ativo com 30 dessas cartas, numa lista fixa;
- 3 pacotes LOB fechados para abrir na loja.

#### Scenario: Campanha nova
- **WHEN** o jogador começa a campanha
- **THEN** ele tem 0 DP, a coleção tem as 40 cartas do deck inicial, o deck ativo tem 30 delas e é válido, e há 3 pacotes
  LOB para abrir

### Requirement: DP por duelo
Uma vitória SHALL pagar uma base pelo tier do oponente (Tier 1: 300 DP; Tier 2: 400 DP; Tier 3: 500 DP; Tier 4: 600 DP),
mais os bônus que valerem:
- +20% se o jogador terminou com ao menos metade dos LP;
- +20% se venceu até o turno 10;
- +10% se terminou sem perder LP.

O bônus somado MUST NOT passar de +50%. Derrota, empate e desistência SHALL pagar 60 DP, sem bônus. O fim do duelo SHALL
mostrar a base e cada bônus.

#### Scenario: Vitória rápida e limpa
- **WHEN** o jogador vence o Joey no turno 7 sem perder LP
- **THEN** ganha 450 DP (300 + 50%, no teto), com os três bônus listados

#### Scenario: Vitória no Tier 2
- **WHEN** o jogador vence o Rex Raptor no turno 12 terminando com 5000 LP
- **THEN** ganha 480 DP (400 + 20%)

#### Scenario: Derrota
- **WHEN** o jogador perde um duelo
- **THEN** ganha 60 DP

### Requirement: Tier que vale no pagamento
O tier que vale no pagamento SHALL ser o do duelista, não o tier atual da campanha. O duelo contra o chefe e o duelo de
evento SHALL seguir a mesma tabela.

#### Scenario: Amigo do Tier 1 no Tier 2
- **WHEN** o jogador vence o Joey durante o Tier 2
- **THEN** a vitória paga a base do Tier 1 (300 DP), mais os bônus

### Requirement: Carta por vitória
Cada vitória SHALL dar uma carta sorteada entre as cópias do deck do oponente. Ficam de fora as cartas limitadas e as
que o jogador já tem em 3 cópias. Na 5ª vitória contra o mesmo duelista, o jogador SHALL ganhar também a
carta-assinatura dele (requisito "Cartas-assinatura"). A carta ganha SHALL aparecer no fim do duelo, com o selo NOVA se
o jogador não a tinha.

#### Scenario: Assinatura
- **WHEN** o jogador vence o Joey pela 5ª vez
- **THEN** o fim do duelo mostra a carta sorteada e o Red-Eyes Black Dragon

#### Scenario: Assinatura do Tier 2
- **WHEN** o jogador vence o Bandit Keith pela 5ª vez
- **THEN** o fim do duelo mostra a carta sorteada e o Barrel Dragon

### Requirement: Cartas-assinatura
A carta-assinatura de cada duelista dos Tiers 1 e 2 SHALL ser:
- Tristan: Sengenjin;
- Tea: Dark Magician Girl;
- Joey: Red-Eyes Black Dragon;
- Bakura: Man-Eater Bug;
- Yugi: Dark Magician;
- Weevil Underwood: Insect Queen;
- Rex Raptor: Serpent Night Dragon;
- Mako Tsunami: The Legendary Fisherman;
- Bandit Keith: Barrel Dragon;
- Mai Valentine: Harpie Lady Sisters;
- Maximillion Pegasus: Toon World.

#### Scenario: Assinatura do Yugi
- **WHEN** o jogador vence o Yugi pela 5ª vez
- **THEN** ganha também a Dark Magician

### Requirement: Pacotes à venda
A loja SHALL vender as coleções TCG da época, liberadas pelo tier e, dentro dele, em ordem a partir do dia em que o tier
abriu:
- Tier 1: LOB, 150 DP, e MRD, 200 DP, no dia 1; MRL, 200 DP, no dia 3; PSV, 225 DP, no dia 5;
- Tier 2: LON, 250 DP, no dia em que o tier abre; LOD, 250 DP, 2 dias depois; PGD, 250 DP, 4 dias depois;
- Tier 3: MFC, 300 DP, no dia em que o tier abre; DCR, 300 DP, 2 dias depois; IOC, 300 DP, 4 dias depois.

As coleções dos tiers anteriores SHALL continuar à venda.

#### Scenario: Antes do dia 3
- **WHEN** o jogador abre a loja no dia 2
- **THEN** o MRL aparece bloqueado com "Dia 3"

#### Scenario: Tier 2 adiantado
- **WHEN** o jogador vence o Yugi no dia 5 e abre a loja na manhã do dia 6
- **THEN** o LON está à venda, o LOD aparece bloqueado com "Dia 7" e o PGD com "Dia 9", e LOB, MRD, MRL e PSV continuam
  à venda

#### Scenario: Próximo tier na vitrine
- **WHEN** o tier atual é o Tier 1, no dia 4 ou no dia 10
- **THEN** LON, LOD e PGD aparecem bloqueados com "Tier 2", com o motivo "depois de vencer Yugi"

#### Scenario: Tier 3 na vitrine
- **WHEN** o tier atual é o Tier 2
- **THEN** MFC, DCR e IOC aparecem bloqueados com "Tier 3", com o motivo "depois de vencer Pegasus"

#### Scenario: Tier 3 pelo prazo
- **WHEN** o Pegasus é vencido no dia 15 e o jogador abre a loja no dia 16
- **THEN** o MFC está à venda por 300 DP, o DCR aparece bloqueado com "Dia 17" e o IOC com "Dia 19", e as sete coleções
  dos Tiers 1 e 2 continuam à venda

#### Scenario: Sem DP
- **WHEN** o jogador tem 120 DP e olha o LOB
- **THEN** o LOB diz que faltam 30 DP e não deixa comprar

### Requirement: Bloqueio e compra das coleções
Uma coleção do tier atual ainda fechada SHALL aparecer bloqueada com o dia em que abre; as do próximo tier SHALL
aparecer bloqueadas com o nome do tier e o chefe que falta vencer para abri-lo. Sem DP suficiente, o pacote SHALL dizer
quantos DP faltam. Cada coleção SHALL poder ser comprada em pacote avulso ou na caixa de 20, com 10% de desconto
arredondado para baixo na dezena.

#### Scenario: Caixa do LOB
- **WHEN** o jogador olha a caixa de 20 pacotes do LOB (150 DP o pacote)
- **THEN** a caixa custa 2700 DP (3000 com 10% de desconto, arredondado para baixo na dezena)

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
