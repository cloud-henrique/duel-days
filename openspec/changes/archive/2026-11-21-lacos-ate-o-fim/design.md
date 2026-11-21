# Design

## Context

- **Modelo** (`src/campaign/bond.ts`):
  - afinidade com teto (fim do coração do próximo evento) e piso (começo do coração atual);
  - `MAX = pointsPerHeart * bondEvents`;
  - o próximo evento abre no fim do coração dele; o 1º pede uma vitória e o 4º, a escolha de rota;
  - o 3º termina com amizade ou romance (`BondEventChoice`), e o 4º tem uma versão por rota (`BondEventRoutes`);
  - o epílogo é do duelista com mais eventos vencidos.
- **Fechamento do evento**: o `applyDuel` (`rewards.ts`) marca o evento vencido e o `EncounterScreen` toca a cena de
  depois. Se a escolha de rota estiver pendente (`isChoicePending`), a tela mostra as duas opções. Se o app fechar no
  meio, o encontro oferece a escolha de novo.
- **Dados**:
  - os eventos vêm do `dialogue.json`, gerado pelo `copy_campaign_data.py` a partir do nativo;
  - o `dialogue-tier1.json` substitui momentos inteiros, porque o `update` é por chave de momento;
  - para mexer nos eventos, o arquivo do Tier 1 precisa trazer a lista `bondEvents` completa.
- **Calendário**: Tier 1 nos dias 1 a 7, Tier 2 a partir do dia 8 (ou do chefe vencido) e Tier 3 a partir do dia 15
  (`currentTier`).

## Goals / Non-Goals

**Goals:**

- O laço com cada um dos 5 do Tier 1 dura a campanha inteira, acompanhando os tiers.
- Toda conversa de evento tem uma decisão do jogador, com consequência pequena e visível (a afinidade e uma fala) e,
  às vezes, uma lembrança no epílogo.
- Os saves da versão 2 continuam valendo.

**Non-Goals:**

- Laços com os duelistas dos Tiers 2 e 3, ou com personagens novos.
- Conversas novas, cenas em dupla e presentes: ficaram de fora por escolha do usuário.
- Mudar a carta do laço ou a economia.

## Decisions

### 1. Seis eventos, os dois últimos presos ao tier

- `BALANCE.bondEvents` passa de 4 para 6. A afinidade vai até 600, e o teto e o piso seguem a regra de hoje.
- O 5º evento abre no fim do 5º coração (500) **e** com o Tier 2 aberto. O 6º, no fim do 6º coração (600) **e** com o
  Tier 3 aberto. Uma regra no modelo, `bondEventTier`, diz o tier mínimo de cada evento (5 → 2, 6 → 3).
- Com afinidade suficiente mas o tier ainda fechado, o evento não abre: nada de "!" e nada de botão. Ele aparece quando
  o tier abre.
- O 4º evento continua exigindo a escolha de rota feita no 3º. O 6º usa a rota também.
- **A carta do laço continua no 4º evento.** O 6º fecha a história, sem carta nova.

**Alternativa descartada**: corações extras sem prender ao tier. A história do 5º e do 6º fala do Reino dos Duelistas e
da Batalha da Cidade, e ficaria fora de ordem se o jogador chegasse lá ainda no Tier 1.

### 2. Escolha dentro do evento

Tipo novo, opcional em qualquer evento menos o 3º, que já tem a escolha de rota:

```ts
interface BondPick {
  prompt?: string;                 // a pergunta, se a última fala não bastar
  options: {
    label: string;                 // o botão (fala do jogador, curta)
    tone: 'good' | 'neutral' | 'bad';  // afinidade pelo BALANCE (respeita teto e piso)
    then: Scene;                   // a resposta do duelista
    remember?: Scene;              // fala que toca no epílogo, se esta opção foi a escolhida
  }[];                             // 2 ou 3
}
```

- **Quando aparece**: depois da cena de depois do evento vencido, como a escolha de rota. Aparece também para quem já
  tinha vencido o evento antes desta change (ver Decisão 4).
- **Pontos**: a opção que combina com o personagem dá +20, a neutra +5 e a que destoa −10. São números do `BALANCE`
  (`bondPickGood`, `bondPickNeutral`, `bondPickBad`); cada opção aponta para um deles pelo campo `tone` nos dados, em vez
  de ter números soltos no JSON.
- **Gravação**: `CampaignState.bondPicks?: Record<string, Record<number, number>>` (duelista → evento → índice da
  opção), lido com `?? {}`.
- **Pendente**: o evento vencido tem escolha e não há resposta gravada. Assim como a rota, se o app fechar o encontro
  oferece a escolha de novo (`pendingPick`).
- **Rever** (tela de Laços): a cena do evento inclui a resposta escolhida (`then`).

### 3. O epílogo lembra as escolhas

O epílogo do duelista (rota amizade ou romance) ganha, antes da última fala, os `remember` das opções escolhidas com
ele, na ordem dos eventos. Só algumas opções têm `remember`, cerca de 2 por duelista, para não alongar o epílogo.

### 4. Saves já existentes

- `bondPicks` ausente vale `{}`.
- Quem já venceu eventos antes desta change (campanha v2 em andamento) não tem resposta gravada para eles. A escolha
  desses eventos **não** aparece retroativamente: o pendente só vale para eventos vencidos depois que a escolha passou
  a existir. Para isso, gravamos `bondPicksFrom?: Record<string, number>`, o número de eventos já vencidos com cada
  duelista quando o save foi lido pela primeira vez com esta versão.

**Alternativa descartada**: oferecer todas as escolhas antigas de uma vez no próximo encontro, o que viraria uma fila de
perguntas sem a cena que as motiva.

### 5. Dados e falas

- O `dialogue-tier1.json` passa a trazer `bondEvents` completo para os 5, com os eventos 1 a 4 do nativo copiados sem
  mudança de texto, mais o `pick` de cada um e os eventos 5 e 6.
- **5º evento**: simples (`before`/`after`) e com escolha.
- **6º evento**: uma versão por rota (como o 4º) e com escolha.
- Ganchos da história (do anime):
  - **Joey**: a Serenity e a cirurgia (Reino dos Duelistas); a final contra o Marik (Batalha da Cidade);
  - **Téa**: o medo de ficar para trás no Reino dos Duelistas; o sonho de dançar em Nova York;
  - **Tristan**: a Serenity e a disputa com o Duke; o Tristan sem duelar, protegendo os amigos;
  - **Bakura**: o Anel do Milênio tomando conta; a Batalha da Cidade e o outro Bakura;
  - **Yugi**: o enigma do Faraó; a memória perdida e as cartas de deuses egípcios.
- O `data.test.ts` confere, para cada duelista com laço:
  - 6 eventos;
  - o 6º com as duas rotas;
  - escolha em todos menos o 3º, com 2 ou 3 opções e um `tone` válido;
  - ao menos uma opção com `remember`.

### 6. Tela

- `BondHearts` e `Hearts` usam `BALANCE.bondEvents` como quantidade, em vez de 4 fixo.
- O `EncounterScreen` ganha a fase `pick`, desenhada como a escolha de rota: a última fala e um botão por opção.
- A resposta toca com o "+20" animado ao lado dos corações, como na conversa.

## Risks / Trade-offs

- **[Risco] Volume de texto**: 10 eventos novos (2 por duelista, o 6º com duas rotas) e 25 escolhas, com 2 ou 3 opções
  cada.
  → **Mitigação**: o tom e o tamanho seguem os eventos atuais (4 a 6 falas por cena). O usuário revisa os
  `dialogue-tier1.json` antes do commit.
- **[Trade-off] Fidelidade ao anime**: os ganchos são do anime, mas o jogador é um personagem novo no grupo. As cenas
  acompanham o que acontece, sem recontar o anime.
- **[Risco] Equilíbrio do laço**: as escolhas mexem na afinidade (+20 ou −10).
  → **Mitigação**: o teto e o piso continuam valendo, então uma escolha ruim não fecha evento já aberto nem tira coração.
  O `story-smoke` mede quantos 6º eventos as campanhas simuladas alcançam.

## Migration Plan

Não há mudança de versão do save. Os campos novos são opcionais. O deploy segue o fluxo normal.
