# Spec Delta

## Purpose

Guarda o save de cada jogador numa conta ligada ao e-mail com que ele entra no jogo, para continuar de qualquer
aparelho, sem deixar de jogar offline e sem perder progresso quando dois aparelhos avançam separados.

## ADDED Requirements

### Requirement: Conta pelo acesso ao jogo
O save na nuvem SHALL pertencer ao e-mail com que o jogador entrou no jogo pelo controle de acesso do site, sem nenhum
login novo. O servidor MUST aceitar ler, gravar ou apagar só o save do e-mail do próprio pedido, verificado pela
assinatura do acesso, e MUST recusar um pedido sem identidade válida.

#### Scenario: Mesmo e-mail em dois aparelhos
- **WHEN** o jogador entra no jogo com o mesmo e-mail no celular e no notebook
- **THEN** os dois aparelhos leem e gravam o mesmo save

#### Scenario: Amigos separados
- **WHEN** dois amigos com e-mails diferentes jogam
- **THEN** cada um vê só o próprio save, e nenhum pedido de um lê ou muda o save do outro

#### Scenario: Pedido sem identidade
- **WHEN** chega ao servidor um pedido de save sem a identidade do acesso, ou com uma assinatura inválida
- **THEN** o servidor recusa e não lê nem grava nada

### Requirement: Tudo do jogador vai para a conta
O save na nuvem SHALL conter o mesmo que o save do aparelho: o perfil (nome, avatar, tratamento), as estatísticas, os
ajustes (animação, som, música, volume, correntes) e a campanha inteira.

#### Scenario: Ajustes em outro aparelho
- **WHEN** o jogador desliga a música no celular, com rede, e depois abre o jogo no notebook
- **THEN** o notebook abre com a música desligada

### Requirement: O jogo não espera a nuvem
Toda mudança do save SHALL gravar primeiro no aparelho, na hora, como antes desta capacidade. O jogo inteiro (campanha,
duelo, loja, editor, perfil) SHALL funcionar sem rede e com a sessão do acesso vencida, e o envio para a nuvem MUST NOT
travar nem atrasar nenhuma tela.

#### Scenario: Jogar offline
- **WHEN** o jogador, sem internet, joga três períodos da campanha e abre um pacote
- **THEN** tudo funciona e fica salvo no aparelho, e o indicador mostra que há progresso pendente

#### Scenario: Fechar offline
- **WHEN** o jogador fecha o app offline e o abre de novo, ainda offline
- **THEN** a campanha continua de onde parou

### Requirement: Envio do progresso pendente
O progresso que a nuvem ainda não tem SHALL ser enviado assim que houver rede e sessão: logo depois das mudanças (juntando
as que vêm em sequência), quando o app vai para o segundo plano, quando volta a ter rede e ao abrir o app.

#### Scenario: Voltar a ter rede
- **WHEN** o jogador jogou offline e o aparelho volta a ter internet com o app aberto
- **THEN** o progresso é enviado sem nenhum toque, e o indicador passa a "sincronizado"

#### Scenario: Fechar logo depois de um duelo
- **WHEN** o jogador vence um duelo, com rede, e manda o app para o segundo plano em seguida
- **THEN** a nuvem fica com a vitória

### Requirement: Trazer o progresso de outro aparelho
Ao abrir o app com rede, o jogo SHALL buscar a nuvem antes de liberar a entrada da campanha no título, esperando no
máximo cerca de 3 segundos. Se a nuvem tiver um progresso mais novo e o aparelho não tiver nada pendente, o save do
aparelho SHALL ser trocado pelo da nuvem.

#### Scenario: Do celular para o notebook
- **WHEN** o jogador termina a tarde do dia 5 no celular, com rede, e abre o notebook, que tinha parado no dia 3
- **THEN** o título do notebook mostra "Dia 5 · Noite" e o saldo do celular, e "Continuar" leva a esse ponto

#### Scenario: Nuvem demorando
- **WHEN** o app abre com rede, mas a nuvem não responde em cerca de 3 segundos
- **THEN** o título libera a campanha com o save do aparelho e a busca continua em segundo plano

### Requirement: Atualização com o app aberto
Ao voltar do segundo plano, se a nuvem tiver um progresso mais novo e o aparelho não tiver nada pendente, o jogo SHALL
trocar o save e voltar ao título com o aviso de que o progresso veio de outro aparelho. Durante um duelo, a troca SHALL
esperar o fim do duelo.

#### Scenario: Notebook esquecido aberto
- **WHEN** o notebook ficou no mapa, o jogador jogou no celular e depois volta ao notebook
- **THEN** o notebook vai para o título, avisa que o progresso foi atualizado de outro aparelho e mostra o dia do celular

### Requirement: Escolha quando os dois aparelhos avançaram
Quando o aparelho tiver progresso pendente e a nuvem tiver recebido outro progresso depois da última sincronização dele,
o jogo MUST NOT escolher sozinho. Ele SHALL mostrar os dois lados e o jogador escolhe qual fica. O lado descartado MUST
continuar guardado na nuvem como versão anterior.

#### Scenario: Os dois jogaram offline
- **WHEN** o jogador jogou o dia 4 no celular offline e o dia 4 no notebook offline, e o celular sincroniza depois do
  notebook
- **THEN** o celular mostra a escolha, com os dois lados, e nada é sobrescrito até o jogador escolher

#### Scenario: Resumo de cada lado
- **WHEN** a escolha aparece
- **THEN** cada lado mostra o dia e o período, o saldo em DP, as vitórias, o tamanho da coleção, o aparelho e a hora em
  que foi salvo

#### Scenario: Escolher a nuvem
- **WHEN** o jogador escolhe o lado da nuvem
- **THEN** o aparelho passa a ter o save da nuvem, e o progresso que era só do aparelho é guardado na nuvem como versão
  anterior

#### Scenario: Escolher este aparelho
- **WHEN** o jogador escolhe o lado deste aparelho
- **THEN** a nuvem passa a ter o save deste aparelho, e o que estava na nuvem fica como versão anterior

### Requirement: Versões anteriores na nuvem
A nuvem SHALL guardar, para cada jogador, ao menos as 10 últimas versões do save substituídas ou apagadas, cada uma com o
aparelho e a hora, para que o administrador do jogo possa devolver uma delas.

#### Scenario: Escolha errada
- **WHEN** o jogador escolheu o lado errado num conflito e avisa o administrador
- **THEN** a versão descartada ainda está na nuvem e pode voltar a ser o save da conta

### Requirement: Indicador da sincronização
O título e o mapa SHALL mostrar um indicador discreto do estado da sincronização, com um ícone do jogo e um texto curto:
sincronizado, sincronizando, pendente (sem rede), sessão vencida, conflito, atualizar o app ou desligada. Tocar no
indicador SHALL mostrar o estado por extenso e a hora da última sincronização.

#### Scenario: Sem rede
- **WHEN** o jogador tem progresso pendente e o aparelho está sem internet
- **THEN** o indicador mostra "pendente", e tocar nele explica que o progresso será enviado quando houver rede

### Requirement: Sessão do acesso vencida
Quando a sessão do acesso ao site tiver vencido, o jogo SHALL seguir jogável com o save do aparelho e o indicador SHALL
oferecer entrar de novo. A entrada MUST acontecer só quando o jogador tocar nela, e MUST NOT tirar o jogador de um
duelo nem de uma cena.

#### Scenario: Sessão vencida
- **WHEN** o jogador abre o app com rede, mas a sessão do acesso venceu
- **THEN** o título abre com o save do aparelho, o indicador mostra "Entre de novo para sincronizar" e nenhuma página de
  login abre sozinha

#### Scenario: Entrar de novo
- **WHEN** o jogador toca em entrar, recebe o código por e-mail e volta ao jogo
- **THEN** o progresso pendente é enviado e o indicador mostra "sincronizado"

### Requirement: App desatualizado não estraga o save
Se a nuvem tiver um save gravado por uma versão mais nova do jogo, o aparelho com o app antigo MUST NOT trazê-lo, nem
descartar a campanha dele, nem enviar o seu por cima. O indicador SHALL pedir para atualizar o app.

#### Scenario: Celular com o app velho
- **WHEN** o notebook já gravou na nuvem uma campanha de uma versão nova e o celular ainda abre com a versão antiga
- **THEN** o celular não muda a nuvem, mostra "Atualize o app para sincronizar", e depois de atualizado traz a campanha
  do notebook inteira

### Requirement: Apagar progresso vale para a conta
"Apagar progresso" SHALL apagar o save do aparelho e o da conta, e a confirmação MUST dizer que vale para todos os
aparelhos. Os outros aparelhos SHALL voltar às boas-vindas na próxima sincronização; um aparelho com progresso pendente
SHALL cair na escolha entre o apagado e o seu. O save apagado SHALL ficar entre as versões anteriores.

#### Scenario: Apagar no celular
- **WHEN** o jogador confirma "Apagar progresso" no celular e depois abre o notebook com rede
- **THEN** o notebook abre nas boas-vindas

#### Scenario: Apagar offline
- **WHEN** o jogador apaga o progresso sem rede
- **THEN** o aparelho volta às boas-vindas na hora, e a nuvem é apagada quando houver rede

### Requirement: Primeira sincronização de um save que já existia
Um save que existia no aparelho antes desta capacidade SHALL ir para a conta na primeira sincronização, se a conta
ainda não tiver save. Se a conta já tiver um save de outro aparelho, SHALL valer a escolha entre os dois lados.

#### Scenario: Primeiro aparelho
- **WHEN** o jogador abre a versão nova no celular, que já tinha uma campanha, e a conta está vazia
- **THEN** a campanha do celular vai para a conta, sem pergunta

#### Scenario: Dois saves antigos
- **WHEN** o celular e o notebook já tinham campanhas diferentes antes desta versão, e o notebook abre depois do celular
- **THEN** o notebook mostra a escolha entre a campanha dele e a da conta

### Requirement: Campanhas de depuração não sincronizam
Com uma campanha de depuração ativa, ou com a sincronização desligada de propósito pelo endereço, o jogo MUST NOT ler nem
gravar a nuvem, e o indicador SHALL mostrar que a sincronização está desligada.

#### Scenario: Depurar a loja
- **WHEN** o app abre com uma campanha de depuração da loja
- **THEN** a conta do jogador fica como estava e o indicador mostra "desligada"

### Requirement: O save nunca sai de um cache
As leituras e gravações do save na nuvem MUST sempre ir ao servidor: o app instalado MUST NOT responder a elas com uma
cópia guardada em cache. Sem rede, elas SHALL falhar e o progresso SHALL ficar pendente.

#### Scenario: Offline com o app instalado
- **WHEN** o app instalado tenta ler a nuvem sem internet
- **THEN** a leitura falha, o título abre com o save do aparelho e o indicador mostra "pendente" ou "sincronizado"
  conforme o que o aparelho tem por enviar
