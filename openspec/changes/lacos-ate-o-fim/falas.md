# Falas novas da change lacos-ate-o-fim

Para revisar antes do commit. Os eventos 1 a 4 não mudaram de texto: aqui só aparece a **resposta** nova de cada um (menos o 3º, que continua sendo amizade ou romance). Os eventos 5 e 6 são inteiros novos. A fonte é `src/campaign/data/dialogue-tier1.json`.

`{nome}` vira o nome do jogador; `{a|b|c}` escolhe pelo tratamento (ele, ela, neutro). "Lembrança" é a fala que toca no epílogo se aquela resposta foi a escolhida.

## Tristan

### 1º evento: Treino escondido

**Resposta do jogador**

- *Prometido. E amanhã eu trago mais desafios pra você.* (combina (+20))
  - **Tristan**: Isso! Treino secreto oficial. Até senha a gente vai ter.
- *Tá bom. Mas um dia você vai ter que contar pro Joey.* (neutra (+5))
  - **Tristan**: Um dia. Quando eu vencer ele. Aí a história fica melhor.
- *Sei não... segredo dá trabalho.* (destoa (−10))
  - **Tristan**: Ah, qual é, {nome}. Só esse, vai. Eu juro que não peço mais nenhum.

### 2º evento: A aposta do intervalo

**Resposta do jogador**

- *E se ele reclamar, eu divido o lanche com você.* (combina (+20))
  - **Tristan**: Fechado! Assim a dívida cai pela metade e a amizade dobra.
- *Da próxima vez, aposta só refrigerante.* (neutra (+5))
  - **Tristan**: Anotado. Aposta pequena, derrota pequena.
- *Bem feito, quem mandou apostar?* (destoa (−10))
  - **Tristan**: Ei! Eu vim aqui atrás de apoio, não de sermão!

### 4º evento: Do lado de dentro da arena

**Resposta do jogador**

- *Vou cuidar dele como se fosse o meu deck inteiro.* (combina (+20))
  - **Tristan**: Eu sabia que podia confiar em você. Ele tá em boas mãos.
  - Lembrança no epílogo: "Sabe aquele Comandante Cibernético? Eu sempre soube que você ia cuidar bem dele."
- *Valeu, Tristan. Vou usar no próximo duelo.* (neutra (+5))
  - **Tristan**: Então me chama pra ver! Quero ver ele brilhando no seu campo.
- *Tem certeza? Ele não combina muito com o meu deck.* (destoa (−10))
  - **Tristan**: Ah... Bom, então guarda ele de lembrança. Pelo menos isso, vai.

### 5º evento: Uma carta da Serenity (novo)

**Antes do duelo**

> **Tristan** (neutral): {nome}, o Joey foi pro Reino dos Duelistas. Ele quer o prêmio pra pagar a cirurgia da irmã dele, a Serenity.
> **Tristan** (sad): Eu queria ter ido junto. Mas fiquei aqui, de olho pra ninguém mexer com a família dele enquanto isso.
> **Tristan** (blushing): E... a Serenity me mandou uma carta agradecendo. Uma carta. Pra mim.
> **Você** (happy): Alguém tá todo bobo.
> **Tristan** (angry): Não tô nada! Duela comigo antes que eu fique ainda mais vermelho.

**Depois da vitória**

> **Tristan** (happy): Valeu. Duelar com você me deixa com a cabeça no lugar.
> **Tristan** (neutral): Eu respondi a carta dela. Escrevi que o Joey vai voltar campeão. Será que eu fiz bem?

**Resposta do jogador**

- *Fez. Ela precisa de alguém que acredite tanto quanto você.* (combina (+20))
  - **Tristan**: É isso! Quando o Joey voltar, a gente faz uma festa pros dois.
  - Lembrança no epílogo: "A Serenity mandou outra carta, sabia? Disse que guardou a minha resposta. E que eu tinha razão sobre o Joey."
- *Fez, mas manda notícias de verdade também.* (neutra (+5))
  - **Tristan**: Boa. Vou contar do torneio, das ruas, de tudo. Assim ela se sente aqui com a gente.
- *Prometer vitória é arriscado, Tristan.* (destoa (−10))
  - **Tristan**: Eu sei... Mas às vezes uma promessa é o que segura a pessoa de pé.

### 6º evento: Na linha de frente (novo)

**Amizade, antes do duelo**

> **Tristan** (angry): A Batalha da Cidade tá cheia desses Caçadores Raros, {nome}. Eles roubam as cartas raras de quem perde.
> **Tristan** (neutral): Eu não duelo no torneio, mas não vou ficar parado. Vou ficar de olho em cada beco perto do Yugi e do Joey.
> **Tristan** (happy): Só que antes quero ter certeza de que o meu deck aguenta. Um duelo pra valer?
> **Você** (happy): Pra valer. Vem.

**Amizade, depois da vitória**

> **Tristan** (happy): Isso! Se aparecer um Caçador Raro na minha frente, ele vai ter uma surpresa.
> **Você** (happy): Você mudou muito desde aquele treino atrás do ginásio.
> **Tristan** (neutral): Mudei. Antes eu só entrava na briga. Agora eu sei por que eu luto: pelos meus amigos. Por você também.

**Romance, antes do duelo**

> **Tristan** (blushing): {nome}, a cidade virou um torneio gigante. Tem duelo em cada esquina... e eu só consigo pensar em você.
> **Tristan** (neutral): Hoje eu vou te acompanhar até o fim do dia, aonde você for. Ninguém mexe com você enquanto eu estiver por perto.
> **Você** (blushing): Meu guarda-costas particular?
> **Tristan** (happy): O melhor da cidade! Mas antes, um duelo. Pra mostrar que eu também sei lutar com cartas.

**Romance, depois da vitória**

> **Tristan** (blushing): Do alto da torre do relógio dá pra ver os telões do torneio. Ficou tudo pequeno lá embaixo.
> **Tristan** (blushing): Eu entrei nessa batalha pra proteger os meus amigos. Mas, no fim, quem me deu coragem foi você.
> **Você** (blushing): Então a gente se protege. Um ao outro.

**Resposta do jogador**

- *Então a gente segue junto até o fim do torneio.* (combina (+20))
  - **Tristan**: Até o fim. E depois dele também.
  - Lembrança no epílogo: "E pensar que tudo começou com você me pegando no treino escondido... Lado a lado até aqui."
- *Cuidado nos becos, tá? Não quero te ver machucado.* (neutra (+5))
  - **Tristan**: Pode deixar. Eu volto inteiro. E com histórias pra contar.
- *Deixa os duelistas resolverem, Tristan.* (destoa (−10))
  - **Tristan**: Eu não consigo, {nome}. Ficar parado vendo os amigos em perigo não é comigo.

## Téa

### 1º evento: O segredo do Burger World

**Resposta do jogador**

- *Então agora são dois segredos: o seu emprego e que eu adoro milk-shake.* (combina (+20))
  - **Téa**: Ha ha! Esse segundo eu já tinha percebido pelo canudinho.
- *Se precisar de ajuda pra disfarçar, é só chamar.* (neutra (+5))
  - **Téa**: Vou lembrar. Ter alguém do meu lado nessa já ajuda muito.
- *Mas por que esconder? Não é crime trabalhar.* (destoa (−10))
  - **Téa**: Pra escola, quase é. Por favor, não faz pouco caso disso, {nome}.

### 2º evento: Passos depois do expediente

**Resposta do jogador**

- *E eu vou ser a primeira pessoa a comprar ingresso pro seu show.* (combina (+20))
  - **Téa**: Promessa anotada! Primeiro ingresso, primeira fila.
  - Lembrança no epílogo: "Lembra que você prometeu comprar o primeiro ingresso do meu show? Eu não esqueci, viu?"
- *Por que alguém riria? É um sonho de verdade.* (neutra (+5))
  - **Téa**: Porque sonho grande assusta. Mas com você parece menos assustador.
- *Nova York é longe, hein... Já pensou em algo mais perto?* (destoa (−10))
  - **Téa**: Já. Todo mundo me pergunta isso. Achei que você ia ser diferente.

### 4º evento: A noite de folga

**Resposta do jogador**

- *Vou guardar ela no meu deck, bem na frente.* (combina (+20))
  - **Téa**: Assim ela vai ser a primeira coisa que você vê quando abrir o deck. Gostei!
- *{Obrigado|Obrigada|Valeu}, Tea. Prometo usar bem.* (neutra (+5))
  - **Téa**: Eu sei que vai. Você sempre usa tudo bem.
- *Carta de amizade não combina muito comigo.* (destoa (−10))
  - **Téa**: Ah... Bom, combina comigo. E eu queria que ela ficasse com você.

### 5º evento: O símbolo da amizade (novo)

**Antes do duelo**

> **Téa** (neutral): {nome}, o Yugi foi pro Reino dos Duelistas pra salvar o avô. O Joey e o Tristan foram atrás.
> **Téa** (sad): Eu fiquei. Alguém tinha que cobrir o meu turno no Burger World... mas eu me sinto deixada pra trás.
> **Téa** (neutral): Eles mandam notícias pelo telefone. Disseram que o Yugi já venceu três duelistas.
> **Você** (happy): E você aqui, torcendo por todos eles.
> **Téa** (happy): Torcer cansa! Duela comigo, que eu preciso gastar essa energia.

**Depois da vitória**

> **Téa** (happy): Ah, agora sim. Parece que eu tô duelando junto com eles.
> **Téa** (neutral): Sabe o que eu fiz? Desenhei um símbolo de amizade na mão de cada um antes de irem. Pra lembrarem que não estão sozinhos.

**Resposta do jogador**

- *Desenha um na minha mão também?* (combina (+20))
  - **Téa**: Claro! Aqui, ó. Agora você faz parte do grupo oficialmente.
  - Lembrança no epílogo: "Ainda dá pra ver o símbolo que eu desenhei na sua mão? Eu desenharia de novo, todo dia."
- *Eles vão lembrar, Tea. Com certeza.* (neutra (+5))
  - **Téa**: Espero que sim. Às vezes um desenho de caneta segura mais que muita coisa.
- *Sério? Caneta na mão sai no primeiro banho.* (destoa (−10))
  - **Téa**: {nome}! Não é a tinta que importa, é o que ela significa!

### 6º evento: A audição ao vivo (novo)

**Amizade, antes do duelo**

> **Téa** (happy): {nome}! A escola de dança respondeu a minha fita: eles querem me ver dançar ao vivo!
> **Téa** (sad): Só que a audição é no mesmo dia da final da Batalha da Cidade. Eu não quero deixar o Yugi sem torcida.
> **Você** (neutral): Duela comigo. Às vezes a resposta aparece no meio do duelo.

**Amizade, depois da vitória**

> **Téa** (neutral): Decidi. Vou na final do Yugi de manhã e pego o trem pra audição de tarde. Vai ser corrido, mas dá.
> **Téa** (happy): Ninguém fica pra trás. Nem os meus amigos, nem o meu sonho.

**Romance, antes do duelo**

> **Téa** (blushing): {nome}, a escola de dança me chamou pra audição ao vivo. Você é a primeira pessoa pra quem eu conto.
> **Téa** (sad): E se eu for pra Nova York? A gente... como fica?
> **Você** (blushing): Duela comigo. Depois a gente pensa nisso juntos.

**Romance, depois da vitória**

> **Téa** (blushing): Durante o duelo eu percebi uma coisa. Distância não apaga o que a gente tem.
> **Téa** (happy): Eu vou pra audição. E você vai comigo até a estação, segurando a minha mão. Combinado?

**Resposta do jogador**

- *Eu vou estar lá, torcendo pelos dois sonhos.* (combina (+20))
  - **Téa**: Com você na torcida, eu danço até de olhos fechados.
  - Lembrança no epílogo: "Naquele dia corrido, entre a final e a audição, você esteve comigo o tempo todo. Eu nunca vou esquecer."
- *Vai dar tudo certo, Tea. Você ensaiou muito.* (neutra (+5))
  - **Téa**: Ensaiei. Agora é confiar nos passos.
- *Talvez fosse melhor esperar a próxima audição.* (destoa (−10))
  - **Téa**: Esperar de novo? Eu já esperei demais, {nome}.

## Joey

### 1º evento: O recorde da máquina

**Resposta do jogador**

- *Revanche aceita. Mas o recorde da máquina é meu.* (combina (+20))
  - **Joey**: Ah, é? Então amanhã é revanche dupla! Prepara as fichas!
- *Pode ser. Se eu tiver tempo.* (neutra (+5))
  - **Joey**: Tempo a gente arruma. Eu fico aqui esperando, sem pressa... tá, com um pouco de pressa.
- *Revanche? Você perdeu nos dois, Joey.* (destoa (−10))
  - **Joey**: Ei! Pisar em quem tá caído não vale, hein!

### 2º evento: O torneio do fliperama

**Resposta do jogador**

- *Vou te cobrar esse turno a mais em todo treino.* (combina (+20))
  - **Joey**: Fechado! A partir de hoje, você é quem me treina oficialmente.
  - Lembrança no epílogo: "Lembra quando você me cobrava esperar um turno a mais em todo treino? Eu fazia careta, mas valeu cada um."
- *Paciência se treina, igual o deck.* (neutra (+5))
  - **Joey**: Então vou treinar as duas coisas. Uma de cada vez, com paciência... viu? Já tô aprendendo.
- *Ou você só joga no ataque mesmo. Também funciona.* (destoa (−10))
  - **Joey**: Funciona até não funcionar, né? Achei que você ia me ensinar alguma coisa, {nome}.

### 4º evento: A última ficha

**Resposta do jogador**

- *Ele vai lutar do meu lado como lutou do seu.* (combina (+20))
  - **Joey**: É assim que se fala! Um espadachim, dois parceiros.
- *Valeu, Joey. Vou cuidar bem dele.* (neutra (+5))
  - **Joey**: Eu sei que vai. Senão ele me conta, hein!
- *Ele não vai fazer falta no seu deck? Fica com ele.* (destoa (−10))
  - **Joey**: Ah... Eu queria que ele ficasse com você. Mas tudo bem, se você não quer.

### 5º evento: A promessa da Serenity (novo)

**Antes do duelo**

> **Joey** (angry): {nome}, eu vou pro Reino dos Duelistas. Não tem discussão.
> **Joey** (sad): A minha irmã, a Serenity, tá perdendo a visão. O prêmio do torneio paga a cirurgia dela.
> **Joey** (neutral): Antes de embarcar, quero um último duelo. Contra a pessoa mais forte que eu conheço.
> **Você** (happy): Então vem com tudo.

**Depois da vitória**

> **Joey** (happy): Esse deck tá afiado! O Pegasus que se prepare.
> **Joey** (neutral): Liguei pra Serenity ontem. Prometi que ela vai me ver duelar numa final. Com os próprios olhos.

**Resposta do jogador**

- *Ela vai ver. E eu vou estar torcendo junto dela.* (combina (+20))
  - **Joey**: Sério? Isso vale mais que o prêmio inteiro, {nome}.
  - Lembrança no epílogo: "A Serenity me contou que você ligou pra ela durante o torneio. Ela disse que nunca se sentiu tão perto de mim."
- *Você vai conseguir. Você é teimoso demais pra perder.* (neutra (+5))
  - **Joey**: Teimoso é o meu nome do meio! Valeu!
- *E se você não ganhar? Já pensou num plano B?* (destoa (−10))
  - **Joey**: Não existe plano B! Existe a Serenity enxergando, e ponto.

### 6º evento: Antes do Marik (novo)

**Amizade, antes do duelo**

> **Joey** (happy): {nome}! Cheguei nas finais da Batalha da Cidade! E a Serenity veio assistir, enxergando tudo!
> **Joey** (neutral): O próximo é o Marik. Dizem que ele controla as pessoas com aquele Bastão do Milênio. Eu tô com medo, e não tenho vergonha de dizer.
> **Joey** (happy): Por isso eu preciso de um duelo com você. Pra lembrar quem eu sou.

**Amizade, depois da vitória**

> **Joey** (happy): É isso! Eu sou o Joey Wheeler, e eu não desisto nunca!
> **Joey** (neutral): Lá do fliperama até as finais... Você esteve em cada passo. Isso eu não esqueço nunca.

**Romance, antes do duelo**

> **Joey** (blushing): {nome}, cheguei nas finais. E a Serenity veio, enxergando. Ela quer te conhecer, sabia? Eu falo de você o tempo todo.
> **Joey** (sad): Amanhã eu enfrento o Marik. Se eu cair, quero que a última coisa boa que eu lembre seja hoje.
> **Você** (blushing): Você não vai cair. Duela comigo.

**Romance, depois da vitória**

> **Joey** (blushing): Do convés do dirigível dá pra ver a cidade toda. Eu sabia que ia gostar de te mostrar.
> **Joey** (happy): Amanhã eu vou vencer. Por mim, pela Serenity... e por você.

**Resposta do jogador**

- *Você vai vencer porque nunca desiste, Joey.* (combina (+20))
  - **Joey**: Nunca! E com você na torcida, menos ainda.
  - Lembrança no epílogo: "E na final da Batalha da Cidade, quando apertou, eu lembrei do que você disse: eu nunca desisto."
- *Cuidado com o Marik. Joga com a cabeça fria.* (neutra (+5))
  - **Joey**: Cabeça fria, coração quente. Pode deixar.
- *Talvez seja melhor desistir dessa final...* (destoa (−10))
  - **Joey**: Desistir? Eu? Nunca, {nome}! Achei que você me conhecia.

## Bakura

### 1º evento: Miniaturas no banco do parque

**Resposta do jogador**

- *E da próxima vez você me ensina a pintar uma miniatura.* (combina (+20))
  - **Bakura**: Ensino, sim! Vou separar um pincel só para você.
- *Combinado. Aqui no parque, então.* (neutra (+5))
  - **Bakura**: No mesmo banco. Vai ser o nosso lugar.
- *Só se for rapidinho, tá? Eu tenho mais o que fazer.* (destoa (−10))
  - **Bakura**: Ah... Claro. Desculpe por tomar o seu tempo.

### 2º evento: Uma partida de RPG

**Resposta do jogador**

- *O meu aventureiro enfrenta o dragão de frente!* (combina (+20))
  - **Bakura**: Que coragem! O dragão vai tremer nas escamas.
  - Lembrança no epílogo: "O seu aventureiro ainda é o herói mais corajoso da nossa mesa. Enfrentou o dragão de frente, lembra?"
- *Vou tentar negociar com o dragão.* (neutra (+5))
  - **Bakura**: Negociar? Interessante... Ninguém nunca tentou isso. Vou ter que inventar as regras.
- *RPG é meio infantil, não acha?* (destoa (−10))
  - **Bakura**: Infantil? Eu... achei que você estava gostando.

### 4º evento: Uma tarde no gramado

**Resposta do jogador**

- *E eu cuido de você também, Bakura.* (combina (+20))
  - **Bakura**: Ninguém nunca me disse isso. Obrigado, {nome}.
- *Vou deixar ele no meu deck.* (neutra (+5))
  - **Bakura**: Que bom. Assim ele está sempre por perto.
- *Cura não é muito o meu estilo de jogo...* (destoa (−10))
  - **Bakura**: Entendo. Mesmo assim, fique com ele. Por mim.

### 5º evento: A voz do Anel (novo)

**Antes do duelo**

> **Bakura** (sad): {nome}... Eu tive aquele sonho de novo. Uma voz que não é minha, falando de um jogo das sombras.
> **Bakura** (neutral): Começou quando o meu pai me deu este Anel do Milênio. Às vezes eu acordo em lugares aonde não lembro de ter ido.
> **Você** (surprised): E por que você ainda usa ele?
> **Bakura** (sad): Porque eu tentei tirar, e ele sempre volta. Duela comigo? Quando eu duelo com você, a voz fica quieta.

**Depois da vitória**

> **Bakura** (neutral): Ficou tudo em silêncio. Só a sua voz e as cartas.
> **Bakura** (sad): Se um dia eu agir de um jeito estranho... promete que não vai desistir de mim?

**Resposta do jogador**

- *Prometo. Eu vou te chamar de volta, quantas vezes for preciso.* (combina (+20))
  - **Bakura**: Obrigado... Essa promessa vale mais que qualquer item do milênio.
  - Lembrança no epílogo: "Teve dias em que a voz do Anel falou mais alto. Mas você sempre me chamou de volta, como prometeu."
- *A gente conta pro Yugi. Ele entende dessas coisas.* (neutra (+5))
  - **Bakura**: O Yugi... É, talvez ele saiba o que fazer. Vou pensar nisso.
- *Talvez seja só cansaço, Bakura.* (destoa (−10))
  - **Bakura**: Eu queria que fosse. Mas eu sei que não é.

### 6º evento: O outro Bakura (novo)

**Amizade, antes do duelo**

> **Bakura** (neutral): Na Batalha da Cidade, o outro eu apareceu. Ele quase machucou os nossos amigos, {nome}.
> **Bakura** (sad): O Yugi conseguiu me trazer de volta. Mas eu fiquei com medo de mim mesmo.
> **Bakura** (happy): Só que hoje eu acordei e pensei: o meu jogo ainda é meu. Duela comigo, do jeito de sempre?

**Amizade, depois da vitória**

> **Bakura** (happy): Fui eu que joguei. Cada carta. Eu senti.
> **Bakura** (neutral): Enquanto eu tiver amigos assim, a escuridão do Anel não me leva. Obrigado por ficar, {nome}.

**Romance, antes do duelo**

> **Bakura** (blushing): {nome}, depois de tudo na Batalha da Cidade, você ainda quer passar a tarde comigo?
> **Bakura** (sad): O outro eu fez coisas horríveis. E se ele voltar quando eu estiver com você?
> **Você** (blushing): Eu fico. Duela comigo e para de se preocupar.

**Romance, depois da vitória**

> **Bakura** (blushing): Pintei uma cena nova para a mesa de RPG: nós dois atravessando uma ponte sobre as sombras.
> **Bakura** (happy): Do outro lado, tem luz. Foi você que me mostrou que ela existe.

**Resposta do jogador**

- *Você é mais forte que o Anel, Bakura.* (combina (+20))
  - **Bakura**: Com você por perto, eu começo a acreditar nisso.
- *Se ele voltar, a gente enfrenta junto.* (neutra (+5))
  - **Bakura**: Junto. É uma palavra boa.
- *Talvez fosse melhor jogar esse Anel no rio.* (destoa (−10))
  - **Bakura**: Eu já tentei, {nome}. Ele sempre volta.

## Yugi

### 1º evento: A vitrine da loja

**Resposta do jogador**

- *Volto amanhã. Quero conhecer todas as caixas da vitrine.* (combina (+20))
  - **Yugi**: Todas?! Então vou separar uma por dia. O vovô vai adorar.
- *Volto, sim. Quando sair carta nova.* (neutra (+5))
  - **Yugi**: Combinado. Eu aviso você primeiro.
- *Ah, eu prefiro comprar pela internet.* (destoa (−10))
  - **Yugi**: Ah... É que a loja do vovô é meio pequena mesmo.

### 2º evento: O quebra-cabeça de oito anos

**Resposta do jogador**

- *Então o seu pedido também realizou o meu.* (combina (+20))
  - **Yugi**: Assim eu fico sem palavras, {nome}.
  - Lembrança no epílogo: "Sabe o pedido do Enigma? Você disse que ele realizou o seu também. Eu penso nisso toda vez que olho pra ele."
- *Oito anos montando... você tem muita paciência.* (neutra (+5))
  - **Yugi**: Paciência e um pouco de teimosia! Igual nos duelos.
- *Pedido em quebra-cabeça? Isso não existe, Yugi.* (destoa (−10))
  - **Yugi**: Talvez não. Mas os meus amigos existem. Pra mim, basta.

### 4º evento: A última partida

**Resposta do jogador**

- *E eu vou proteger você também, Yugi.* (combina (+20))
  - **Yugi**: Então a gente se protege. Combinado de verdade.
- *Vou colocar ela no meu deck hoje mesmo.* (neutra (+5))
  - **Yugi**: Que bom! Ela gosta de entrar em ação.
- *Carta rara assim? Vou guardar no fichário, longe dos duelos.* (destoa (−10))
  - **Yugi**: Ah... Carta foi feita pra duelar, {nome}. Mas tudo bem.

### 5º evento: A outra voz do Enigma (novo)

**Antes do duelo**

> **Yugi** (neutral): {nome}, posso te contar uma coisa que eu nunca contei pra ninguém?
> **Yugi** (sad): Quando eu duelo sério, parece que outra pessoa duela comigo. Uma voz dentro do Enigma do Milênio.
> **Yugi** (neutral): O Pegasus prendeu a alma do vovô numa carta, e eu vou pro Reino dos Duelistas buscar ele. Essa voz vai comigo.
> **Você** (surprised): Outra pessoa... dentro do quebra-cabeça?
> **Yugi** (happy): Eu sei que parece loucura. Duela comigo, que talvez você sinta também.

**Depois da vitória**

> **Yugi** (surprised): No fim do duelo, você sentiu? A voz disse que você joga com o coração.
> **Yugi** (neutral): Ele não lembra quem é. Nem o próprio nome. Eu prometi que vou ajudar ele a descobrir.

**Resposta do jogador**

- *Então eu ajudo vocês dois.* (combina (+20))
  - **Yugi**: Vocês dois... É a primeira vez que alguém conta ele também. Obrigado, {nome}.
  - Lembrança no epílogo: "Você prometeu ajudar a gente a descobrir o nome dele. E ajudou, sabia? Cada duelo foi uma pista."
- *Deve ser estranho dividir a cabeça com alguém.* (neutra (+5))
  - **Yugi**: Às vezes é. Mas também é bom nunca estar sozinho.
- *Será que não é só nervosismo, Yugi?* (destoa (−10))
  - **Yugi**: Talvez... Mas eu sinto ele, {nome}.

### 6º evento: O nome do Faraó (novo)

**Amizade, antes do duelo**

> **Yugi** (neutral): {nome}, o Marik tem as cartas dos deuses egípcios. Dizem que elas guardam as memórias do Faraó.
> **Yugi** (happy): Se eu vencer a Batalha da Cidade, ele pode lembrar quem é. Eu e ele vamos até o fim.
> **Yugi** (neutral): Mas antes, quero um duelo só nosso. Sem deuses, sem destino. Só cartas e amigos.

**Amizade, depois da vitória**

> **Yugi** (happy): É disso que eu precisava. Lembrar por que eu comecei a jogar.
> **Yugi** (neutral): Quando o Faraó lembrar o nome dele, eu quero que você esteja lá. Você faz parte dessa história.

**Romance, antes do duelo**

> **Yugi** (blushing): {nome}, amanhã é a final da Batalha da Cidade. O Faraó pode descobrir quem ele é... e ir embora.
> **Yugi** (sad): Eu tenho medo de ficar sozinho de novo. Até lembrar que agora eu tenho você.
> **Você** (blushing): Você nunca vai ficar sozinho, Yugi. Duela comigo.

**Romance, depois da vitória**

> **Yugi** (blushing): Na loja, com as luzes baixas, tudo parece mais calmo. Até o meu coração.
> **Yugi** (happy): Aconteça o que acontecer amanhã, eu sei quem eu sou. Eu sou o Yugi. E eu escolhi você.

**Resposta do jogador**

- *Eu vou estar do seu lado na final. Dos dois lados do Enigma.* (combina (+20))
  - **Yugi**: Com você ali, nenhum deus egípcio me assusta.
- *Vai dar tudo certo. Vocês dois são o melhor time.* (neutra (+5))
  - **Yugi**: O melhor time. E você é a nossa melhor carta.
- *E se o Faraó for embora? Não seria melhor ele não lembrar?* (destoa (−10))
  - **Yugi**: Eu já pensei nisso. Mas ele merece saber quem é, {nome}.
