# Design

## Context

- A CPU (`src/engine/cpu.ts`, `cpuRespond`) é uma função pura que sorteia uma resposta legal. O `DuelDriver` a chama para
  o jogador 1 e para os prompts automáticos do jogador 0. Ela roda no Worker (ou na thread principal com
  `?engine=inline`), no build **síncrono** do ocgcore.
- O ocgcore não copia nem salva o estado de um duelo. Mas o duelo é **determinístico**: a mesma semente (que também
  decide o nosso embaralhamento, no `session.ts`) e a mesma sequência de respostas reproduzem o mesmo duelo.
- Spike (Mac, Node, deck inicial × Rex): criar e destruir um duelo leva cerca de 12,5 ms. Recriar e reaplicar 1500
  respostas leva cerca de 21 ms. Uma "cópia" do duelo custa de 13 a 21 ms, quase todo o custo é carregar os scripts base.
  Num iPhone, a estimativa é de 2 a 4 vezes isso.
- Os chefes são os duelistas com `isBoss` (Yugi no Tier 1, Pegasus no Tier 2).
- O `DuelDriver` tem um vigia de 5 s por `run()` (`MAX_MS`), e o `useDuelEngine` também tem o dele. Com a CPU pensando
  até 2 s por decisão, um turno passa disso.

## Goals / Non-Goals

**Goals:**
- Decisões da CPU pelo resultado simulado no próprio motor, com as regras reais de todas as cartas, sem escrever regras
  carta a carta.
- Honestidade dos comuns garantida pela forma da simulação, não por disciplina em cada heurística.
- O mesmo código no Worker, no modo inline e nos protótipos em Node.
- Resultado reprodutível nos testes e nas ferramentas (orçamento por número de simulações).

**Non-Goals:**
- Busca em árvore profunda (minimax/MCTS completo) ou simulação além do turno atual.
- IA que aprende ou se adapta ao jogador.
- Nível de dificuldade escolhido pelo jogador.
- Mudar a CPU que responde os prompts automáticos do jogador 0 (continua a política barata).

## Decisions

### 1. Cópia do duelo por replay

O driver passa a registrar **todas** as respostas enviadas ao motor (jogador, prompts automáticos e CPU), além da
semente e dos decks. Uma cópia é `startDuel` com a mesma semente e os mesmos decks, seguida da reaplicação do registro.
A cópia é destruída logo depois de avaliada.

- Alternativa: montar um duelo novo colocando as cartas nas zonas (`duelNewCard` no campo). Foi descartada porque perde
  o estado interno: efeitos contínuos, contadores, "uma vez por turno", equipamentos, a fase e o turno.
- Alternativa: só heurísticas, sem simulação. Foi descartada porque não resolve efeitos (o caso do Metalmorph e da
  busca de campo) sem escrever regra por carta. As heurísticas ficam como política barata (decisão 3).

### 2. Busca de um nível com continuação (rollout)

Em cada decisão da CPU com escolha real:

```
candidatas legais --> ordenadas pela politica barata (prior)
      |
      v   para cada candidata, enquanto houver orcamento:
   copia --> aplica a candidata --> continua com a politica barata
         --> ate o horizonte --> avalia o tabuleiro
      |
      v
   melhor nota (empate ou sem orcamento: a ordem do prior)
```

- **Horizonte**: o fim do turno da CPU (ou o fim da corrente, numa resposta no turno do jogador) ou o fim do duelo.
  Nunca entra no turno seguinte do jogador. Assim a compra dele não importa.
- **Decisões encadeadas** (ativar e depois escolher o alvo) são buscas separadas. A busca do alvo acontece quando o motor
  pede o alvo. No rollout da ativação, o alvo vem da política barata.
- Na fase principal, "ir para a batalha" e "encerrar o turno" também são candidatas. Com isso, não fazer nada também é
  uma opção avaliada.
- **Orçamento**: um número máximo de simulações e um teto em ms, o que vier primeiro. No jogo, o teto em ms é o que
  limita (1 s comum, 2 s chefe). Nos testes e nas ferramentas, o limite é o número de simulações, para o resultado não
  depender da máquina.
- **Uma opção só** (ou resposta forçada): responde direto, sem cópia.
- Alternativa: MCTS com várias continuações aleatórias por candidata. Foi descartada porque o orçamento do iPhone
  (cerca de 20 a 60 cópias por decisão) não cobre isso. Uma continuação determinística com política barata boa vale mais.

### 3. Política barata: regras simples

O `cpuRespond` vira a política barata, sem sorteio. Ela é usada no prior, nas continuações e nos prompts automáticos do
jogador 0:

- Invocar o monstro de maior ATK em ataque, se ele vencer o maior ATK visível do jogador ou se o campo dele estiver vazio.
  Senão, baixar em defesa.
- Atacar só quando vence (ou quando empata com vantagem de LP). Ataque direto sempre.
- Alvo de Magia de Equipamento ou de efeito de aumento vai para o monstro próprio. Alvo de destruir, enfraquecer ou tomar
  o controle vai para a carta do jogador de maior valor.
- Correntes: ativa armadilhas que respondem a um ataque ou a um efeito do jogador, quando há gatilho.
- Nada de `rng`. A política barata é determinística, e com isso a busca também é.

### 4. Honestidade pela forma da simulação

Comuns (perfil `comum`):

- Nas continuações, o jogador **nunca responde**: corrente opcional é "não", e o prompt obrigatório dele recebe uma
  resposta neutra (os primeiros índices). As armadilhas viradas dele não disparam, e o conteúdo delas não vaza.
- A **avaliação só lê o que é público** do lado do jogador: LP, monstros com a face para cima, quantas cartas viradas,
  quantas cartas na mão, cemitério. Uma carta virada destruída vale uma estimativa fixa, sem olhar o que era.
- **Risco das viradas**: cada Magia/Armadilha virada do jogador desconta uma fração do valor dos monstros da CPU que
  atacaram. Com isso, atacar com tudo contra três cartas viradas fica mais caro.
- O horizonte nunca chega à compra do jogador (decisão 2), então a ordem do deck dele não importa.

Chefe (perfil `chefe`): nas continuações, o lado do jogador responde com a política barata usando o estado real (ativa
Mirror Force se puder), e a avaliação lê o tabuleiro inteiro, inclusive a mão e as viradas. O orçamento é de 2 s. O
horizonte é o mesmo dos comuns, então a ordem do deck do jogador continua fora.

### 5. Avaliação do tabuleiro

É uma nota simples, do ponto de vista da CPU:

- Vitória e derrota valem ±infinito.
- Diferença de LP, com peso alto quando o LP de alguém está perto de zero.
- Força em campo: o ATK dos monstros em ataque e o máximo entre ATK e DEF dos monstros em defesa, com o bônus dos
  equipamentos já aplicado (a consulta ao motor devolve os valores atuais).
- Vantagem de cartas: cartas no campo e na mão de cada lado.
- O desconto das viradas (só no perfil comum).

Os pesos ficam num único objeto (como o `PACING`) e são calibrados pela medida de dificuldade.

### 6. Perfil na mensagem `start`

A mensagem `start` do protocolo ganha `cpu: 'comum' | 'chefe'`, e o padrão é `comum`. O `App`/`DuelScreen` passa
`chefe` quando o oponente da campanha tem `isBoss`. O driver guarda o perfil e o entrega à busca.

### 7. Vigias, tempo de pensamento e beats aos poucos

O tempo gasto pensando não conta no `MAX_MS` do `run()` (só o tempo do motor fora da busca conta). Uma busca que estoura o
próprio teto responde com o prior, nunca com erro.

Antes de cada decisão da CPU, o driver manda os steps acumulados numa mensagem `steps` (`onProgress`). A tela encena
enquanto a CPU pensa, em vez de esperar o turno inteiro dela. Cada mensagem rearma o vigia do `useDuelEngine`, que passa
a medir silêncio do motor (sem multiplicar o teto pelo número de decisões, como estava previsto). As partes entram numa
fila no `useDuelEngine`, uma encenação depois da outra (a fila de animação aborta a anterior se chamada de novo).

### 8. Ferramentas e testes

- **Quebra-cabeças**: um ajudante de teste monta um duelo com cartas já nas zonas (campo, mão, viradas), via
  `duelNewCard`, e pede uma decisão. Os cenários da spec (ataque que vence, não atacar para perder, ataque direto,
  Metalmorph no próprio monstro, campo já ativo, honestidade com mãos diferentes) viram testes do Vitest.
- **`proto/difficulty.ts`**: cada duelista contra o deck inicial, trocando quem começa, com a CPU nova dos dois lados e o
  orçamento por número de simulações. Ele roda em vários processos (`child_process`, um por núcleo), porque cada duelo
  passa a levar segundos.
- **`proto/deck-pick.ts`**: o torneio passa a usar a CPU nova, cada candidata contra o deck inicial (não todas contra
  todas), com orçamento reduzido. Depois, o `difficulty.ts` confere as metas.
- `smoke`, `monkey` e `tier-balance` ganham a opção de rodar com a política barata (rápido) ou com a busca.

### 9. Achados da implementação

- A consulta com `OcgQueryFlags.TYPE` quebra o leitor do `ocgcore-wasm`. O tipo da carta vem da base (`view.ts`).
- O `SELECT_SUM` "igual ou maior" (Ritual) com carta sobrando era recusado e o duelo entrava em laço de RETRY. A política
  barata procura o menor conjunto que alcança o total.
- Medido no WebKit (JavaScriptCore, o motor do Safari do iOS): 11,6 ms por simulação; as decisões têm em média 4 opções
  (no máximo 10 num duelo inteiro), e a mais lenta levou 111 ms. O teto de tempo (1 s e 2 s) quase nunca limita: a busca
  simula todas as opções (até 24). Nas ferramentas, `--cpu=busca:24` equivale ao jogo. Na prática o chefe não pensa mais
  tempo; a vantagem dele é ver a mão e as viradas do jogador.

## Risks / Trade-offs

- [O iPhone é mais lento que a estimativa e poucas cópias cabem em 1 s] → O orçamento é em ms, então o pior caso é
  decidir pelo prior (que já é bem melhor que hoje). Medir no aparelho com `?debug=1` (quantas cópias por decisão).
- [Vazamento das próprias sortes da CPU: o replay sabe o resultado da moeda, do dado e das compras por efeito no turno
  atual] → Aceito. O ganho é pequeno e restrito a poucas cartas (Pote da Ganância, Mago do Tempo). Se a medida mostrar
  abuso, essas ativações passam a ser avaliadas pelo prior.
- [Uma continuação com política barata avalia mal uma jogada boa que depende de um alvo bem escolhido] → A política barata
  já escolhe o lado certo do alvo (decisão 3), e a busca do alvo acontece de verdade quando o motor pede.
- [Turno da CPU mais longo, somado à encenação] → O `think` já existe no beat. O pensamento acontece no Worker, sem travar
  a tela. Os tetos são os combinados (1 s e 2 s).
- [Ferramentas muito mais lentas] → Orçamento por número de simulações, vários processos e menos duelos no torneio das
  receitas.
- [Cópias acumulando memória no WASM] → Toda cópia é destruída num `finally`. O `smoke` confere que a memória não cresce.
- [Scripts Lua com estado global entre duelos do mesmo core] → Cada cópia é um duelo novo no mesmo core, como já acontece
  no reinício. Conferir no `monkey` que o duelo principal não muda depois de N buscas (o último retrato bate).

## Migration Plan

Nada muda no save. O `start` sem `cpu` vale `comum`, então um Worker em cache com a página nova continua funcionando.
Para voltar atrás, basta reverter o commit. A política barata sozinha também funciona, com orçamento zero.

## Open Questions

- Os pesos exatos da avaliação e a fração do risco das viradas: calibrados pela `proto/difficulty.ts`.
- Quantas cópias por segundo o iPhone real faz (medido só no WebKit do Mac): conferir pelo túnel com `?debug=1`.
