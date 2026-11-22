# Spec Delta

## MODIFIED Requirements

### Requirement: Save da campanha
O progresso da campanha SHALL ficar salvo no aparelho a cada mudança (período, DP, coleção, deck, pacotes, vitórias,
afinidade, eventos e rotas) e sobreviver a fechar o app. Ele SHALL ir também para a conta do jogador quando houver rede
(capacidade `save-na-nuvem`), sem que o jogo espere por isso. Tudo o que é sorteado (quem aparece, falas, tema ruim,
cartas dos pacotes e da vitória) SHALL sair da semente salva, para o mesmo estado dar o mesmo resultado, também em
outro aparelho. Um save da história antiga SHALL abrir no título com o perfil intacto e a campanha por começar. Uma
campanha salva no formato anterior (duelos de 5 zonas e decks de 40) SHALL ser descartada da mesma forma: o perfil, as
estatísticas e os ajustes ficam, e a campanha recomeça do dia 1. Uma campanha de uma versão mais nova que a do app MUST
NOT ser descartada.

#### Scenario: Save antigo
- **WHEN** um save da história antiga é carregado
- **THEN** o título mostra o mesmo perfil e "Campanha" começa do dia 1

#### Scenario: Campanha do formato anterior
- **WHEN** o app abre com uma campanha salva antes do formato Speed
- **THEN** o título mostra o mesmo perfil, sem "Continuar", e "Campanha" começa do dia 1 com a coleção e o deck iniciais

#### Scenario: Mesmo sorteio em outro aparelho
- **WHEN** o jogador chega à noite do dia 6 no celular, sincroniza e abre o mapa no notebook
- **THEN** o notebook mostra os mesmos duelistas no mapa que o celular mostraria

#### Scenario: Campanha mais nova que o app
- **WHEN** a conta tem uma campanha gravada por uma versão mais nova do jogo e o aparelho abre com a versão antiga
- **THEN** a campanha da conta não é descartada nem trocada, e continua inteira para quando o app atualizar
