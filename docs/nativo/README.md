# Referência: telas do app nativo

O app nativo (`~/Projects/personal/duel-academy`, SwiftUI) é a referência de **interface, fluxo e conteúdo** da campanha
Duel Monsters (Tier 1) que a PWA vai portar. O motor da PWA continua o ocgcore.

Os prints ficam em `prints/` e **não vão ao git** (mostram arte de cartas e personagens da Konami). Para refazer:
compile o nativo para o simulador (`xcodebuild … -scheme DuelAcademy`), instale num simulador limpo e capture com
`xcrun simctl io <udid> screenshot`. Atalhos de DEBUG úteis (argumentos de lançamento):

- `-campaignDialogueCheck`: um duelista sem vitória (a cena de primeira vitória), o Yugi a uma vitória de aparecer,
  pacotes de personagem quase liberados; a CPU desiste depois da abertura.
- `-campaignBondCheck`: cada duelista num ponto do laço (eventos abertos, escolha amizade/romance, presente).
- `-campaignLastEvening`: pula para a noite do dia 30 (encerramento e epílogo).
- `-coinSandbox`, `-chainSandbox`, `-targetSandbox`, `-equipSandbox`…: duelos montados para conferir mecânicas.

Capturado em 16/11/2026, iPhone 17 Pro (iOS 27).

## Entrada

| Print | Tela | O que a PWA precisa trazer |
|---|---|---|
| `00-titulo-save-existente` | Título (save com campanha) | Logo "Yu-Gi-Oh!" + "DUEL DAYS" metálico, orbe com leque de cartas, perfil no topo, ajustes |
| `01-boas-vindas`, `02-…-avatar-tratamento` | Boas-vindas (1ª abertura) | Nome, **avatar entre 14 personagens genéricos** (Escola Domino + casuais) e tratamento Ele/Ela/Neutro |
| `03-titulo`, `03b-titulo-com-campanha` | Título | Botões grandes: Campanha ("Continuar · Dia X · Período" + DP), Duelo rápido, Meu deck, Histórico |
| `04-perfil`, `05-perfil-estatisticas` | Perfil | Avatar e nome editáveis, vitórias/derrotas/aproveitamento, deck favorito, conquistas com data |
| `06-ajustes`, `07-creditos` | Ajustes e créditos | Efeitos, vozes e **música** (interruptor + volume cada), corrente automática/manual, créditos |
| `08-historico-vazio` | Histórico | Lista de duelos com retrato do oponente e resultado |
| `09-meu-deck` | Meu deck sem campanha | Estado vazio explicando que o deck nasce na campanha |

## Campanha

| Print | Tela | O que a PWA precisa trazer |
|---|---|---|
| `10-campanha-escolha-serie` | Escolha da série | (Só Duel Monsters na PWA; GX fica de fora) |
| `11-campanha-inicio`, `12-mapa-rolado` | Mapa | Cabeçalho Dia/período/DP, progresso do tier, mapa ilustrado da cidade com os lugares e o nº de duelistas, atalhos (Deck, Coleção, Laços, Loja) |
| `47-mapa-chefe-yugi` | Mapa rolado para o lado | O mapa rola na horizontal; o chefe aparece com retrato e coroa |
| `30-mapa-tarde`, `50-mapa-eventos` | Períodos e eventos | Filtro de cor por período (manhã, tarde, noite); "!" de evento no retrato do duelista |
| `13-mapa-lugar-painel`, `48-mapa-loja-painel` | Painel do lugar | Gaveta com quem está lá (corações), "Entrar na loja" e "Encontrar" o chefe |
| `14-encontro-saudacao`, `42-encontro-escola` | Cena de encontro | Fundo do lugar, duelista de corpo inteiro, corações no topo, caixa de fala com nome, "Pular" |
| `15-encontro-menu`, `51-encontro-com-evento` | Menu do encontro | Conversar, Duelar, Voltar ao mapa; com evento aberto, o título do evento como botão principal |
| `16-conversar-temas`, `17-…-resposta`, `18-…-coracoes` | Conversar | 4 temas (Duelos, Escola, Hobbies, Boatos), resposta do personagem, corações mudando |
| `19-duelo-fala-antes` | Fala antes do duelo | A fala acontece no lugar, antes do tabuleiro |
| `45-primeira-vitoria-cena`, `46-fala-do-jogador` | Cena de primeira vitória | O jogador entra no palco com o avatar dele; quem não fala fica escurecido |
| `49-chefe-entrada` | Chefe (Yugi) | Entrada própria do chefe na Loja do Vovô |
| `55-evento-cena` | Cena de evento do laço | O evento é uma cena no lugar do personagem, seguida de um duelo que precisa ser vencido |
| `56-mapa-noite`, `57-encontro-noite` | Noite | Filtro azulado no mapa e no fundo do lugar |
| `39-lacos` | Laços | Corações e eventos de cada personagem, com "Rever" |
| `40-campanha-status`, `41-campanha-menu` | Status e opções | Vitórias, derrotas, dias restantes, dia e DP; trocar de série |
| `58-epilogo`, `59-encerramento` | Fim da campanha | Epílogo com o personagem de mais eventos vencidos; "Fim da campanha" com o resumo, "Rever epílogo" e a coleção |

## Duelo

| Print | Tela | O que a PWA precisa trazer |
|---|---|---|
| `43-abertura-faixas`, `20-abertura-duelo` | Abertura | Faixas com retrato (oponente laranja, jogador azul) e "DUELO!" em fonte estilizada com degradê |
| `21-duelo-tabuleiro`, `23-…-apos-invocar`, `24-…-turno-cpu` | Tabuleiro | Placas, LP, campo em perspectiva, barra de fases, botões de fase (já próximos na PWA) |
| `22-duelo-folha-da-carta`, `25-…-batalha-folha` | Folha da carta | Carta grande, ATK/DEF, texto, ações como botões de ícone + uma palavra |
| `25b-duelo-ataque`, `26-duelo-ativacao-armadilha` | Ataque e ativação | Destaque da carta ativada com halo (já na PWA) |
| `27-duelo-menu`, `27b-duelo-menu-completo`, `28-…-desistir-confirma` | Menu do duelo | Tela inteira com áudio (efeitos, vozes, música), corrente sempre/automática e "Desistir do duelo" com confirmação ("gasta o período") |
| `52-duelo-cara-ou-coroa`, `53-…-moeda-girando`, `54-…-moeda-resultado` | Moeda | Painel "Cara ou coroa?" e **moeda dourada desenhada** com "CARA"/"COROA" e "Errou!/Acertou!" |
| `44-fim-vitoria` | Fim do duelo | **"VITÓRIA!" estilizado**, motivo, turnos, DP com bônus (vida sobrando, vitória rápida, sem arranhão), carta ganha com "NOVA", laço +30 |
| `29-depois-desistir` | Depois de desistir | Volta ao lugar com a fala de derrota |

## Loja, pacotes e deck

| Print | Tela | O que a PWA precisa trazer |
|---|---|---|
| `31-loja`, `35-loja-rolada` | Loja | Balconista (vovô) com fala, saldo em **DP**, pacotes ganhos, à venda (bloqueado "Dia 11", "faltam N DP"), pacotes de personagem (0/5) |
| `36-pacote-detalhes` | Detalhes do pacote | Raridades, "14 de 104 cartas", grade das cartas (as que faltam apagadas), comprar 1 ou a caixa de 20 |
| `32-pacote-fechado`, `33-…-versos`, `34-…-revelado` | Abertura do pacote | Tocar para rasgar, versos, "Revelar tudo", raridade e selo NOVA |
| `37-editor-de-deck` | Editor | Deck em cima (Main/Extra, "PRONTO"), maleta embaixo com filtros, ordenação e busca, "1/2" cópias |
| `38-colecao` | Coleção | Totais e a mesma grade da maleta |

## Música

O nativo tem trilha por tela (`App/DuelAcademy/Sounds/music-*.m4a`): título, mapa, encontro, loja, duelo, duelo de chefe,
vitória e derrota, com ajuste próprio (interruptor e volume). Portar junto com os sons (fora do git).
