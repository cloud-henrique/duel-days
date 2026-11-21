# Design

## Context

- O `Sprite` (`src/screens/campaign/Dialogue.tsx`) desenha o corpo e o rosto da expressão por cima. Ele fica escondido
  (`.actor.loading`) até os dois carregarem e, ao trocar de expressão, mantém o rosto antigo até o novo estar pronto.
  Dentro de um mesmo `<Dialogue>`, a troca de rosto já é instantânea.
- A entrada é o `@keyframes actor-in` do `campaign.css`: opacidade 0 → 1 **e** `translate: 0 12%` → 0, aplicado a todo
  `.actor` montado.
- O `EncounterScreen` renderiza um `<Dialogue>` por fase, com `key` própria (`talk`, `pre`, `after`, `choice`, `then`,
  `pick`, `pickThen`). Cada troca de `key` desmonta o palco e o `actor-in` toca de novo: o "desce e sobe".
- As `key` existem por um motivo: o `Dialogue` reinicia o índice da fala num efeito (`setI(0)` quando `scene` muda) e
  chama `onDone` num efeito quando `finished`. Sem remontar, haveria um render com a cena nova e o índice antigo
  (`finished` verdadeiro) e o `onDone` da fase nova poderia disparar na hora. A `key` também reinicia o "+20" dos
  corações.
- O vovô da loja (`ShopCounter`) usa o mesmo `Sprite`, fora de qualquer encontro.

## Goals / Non-Goals

**Goals:**
- Entrada só por opacidade.
- Nenhuma entrada repetida para quem já apareceu no mesmo encontro, sem mexer no ciclo de vida do `Dialogue`.

**Non-Goals:**
- Animar a troca de rosto (fica seca, como hoje).
- Animar a saída de um personagem (ele continua sumindo de uma vez, como hoje).
- Mudar o deslize lateral do duelista quando o jogador entra.
- Tela de vitória/derrota.

## Decisions

### 1. `actor-in` só com opacidade

A keyframe vira `from { opacity: 0; }`, e a duração (.35s ease-out) continua a mesma. O `translate` sai. O `transform`
do `.actor` (posição horizontal e deslize) não é tocado, porque a keyframe usa a propriedade `translate`, separada do
`transform`. Com "reduzir movimento" no sistema, a entrada continua sendo um esmaecer, que não é movimento.

### 2. Memória do palco por encontro, em vez de tirar as `key`

Um contexto React (`StageMemory`: um `Map` do id do sprite para o último rosto mostrado) é criado uma vez por
encontro (no `App`, em volta do `EncounterScreen`, com a `key` dele) e por cena avulsa, e envolve os `<Dialogue>`. O
`Sprite`:
- no primeiro render (inicializador do `useState`), lê o último rosto daquele personagem; sem ele, `enter`;
- já tendo aparecido, monta pronto (sem o `loading`, que o esconderia por um quadro) com o último rosto, que está em
  cache, e troca para o rosto da fala nova quando ele carrega;
- quando está pronto, grava o rosto atual na memória;
- só com `enter` ganha a classe que aplica o `actor-in`. Sem ela, aparece pronto, sem animação.

Sem provedor (vovô da loja, testes), o padrão é "sempre entra", e a loja continua com a entrada, agora só esmaecendo.

**Alternativas consideradas:**
- *Tirar as `key` das fases*: o palco ficaria montado, mas mexe no ciclo de vida do `Dialogue` (índice e `onDone`
  disparando com a cena nova, reinício do "+20"), e isso é mais arriscado que o problema.
- *Tirar o palco de dentro do `Dialogue`* (o `EncounterScreen` desenharia os atores): resolve na raiz, mas espalha a
  lógica de quem está em cena e qual expressão vale (hoje tudo no `Dialogue`) por dois lugares, e a cena avulsa e a loja
  precisariam do mesmo tratamento.

### 3. A memória vale para o encontro inteiro

A primeira aparição de cada personagem no encontro esmaece. Se o jogador sai de cena (fim de uma fase) e volta numa fase
seguinte, ele reaparece sem animação, simétrico com a saída, que também é seca. A volta do duelo é outro
`EncounterScreen` (a `key` do `App` muda de `greet` para `after`), então a cena de depois do duelo começa com a entrada
de novo, o que é o esperado ao voltar de outra tela.

O id registrado é o do sprite (`c.id`), não a chave do duelista. Assim duelista e jogador ficam separados naturalmente.

## Risks / Trade-offs

- [O `Sprite` registra o id só quando fica pronto: se a fase trocar antes de a imagem carregar, a próxima fase ainda
  faz a entrada] → É o comportamento certo: ele ainda não tinha aparecido.
- [Modo estrito do React em dev monta duas vezes: o inicializador roda duas vezes e a segunda já veria o id registrado]
  → O registro acontece num efeito depois de pronto, não no inicializador. A decisão `enter` é tomada antes de
  qualquer registro daquele `Sprite`.
- [Reaparecer sem animação pode parecer um "pulo" para o avatar do jogador] → Aceito por enquanto. Se incomodar, a
  regra passa a ser "esteve em cena na fase anterior", sem mudar a spec.
