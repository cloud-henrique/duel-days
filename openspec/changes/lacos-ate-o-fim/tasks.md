# Tarefas

## 1. Modelo

- [x] 1.1 `BALANCE`: `bondEvents: 6`, `bondPickGood: 20`, `bondPickNeutral: 5`, `bondPickBad: -10`; o mínimo de tier
  por evento (`bondEventTier`: 5 → 2, 6 → 3). Verificar: `npx tsc --noEmit`.
- [x] 1.2 `data/types.ts`: o tipo `BondPick` (Decisão 2) e o campo `pick?` nos eventos (simples e por rota).
  `state.ts`: `bondPicks?` e `bondPicksFrom?` opcionais. Verificar: `npx tsc --noEmit`.
- [x] 1.3 `bond.ts`:
  - `openBondEvent` respeita o tier do 5º e do 6º;
  - `pendingPick` (o evento vencido mais antigo com escolha e sem resposta, a partir do `bondPicksFrom`);
  - `choosePick` (grava, aplica a afinidade pelo tom e devolve o `then`);
  - `eventScenes` usa a rota também no 6º;
  - `eventReview` inclui o `then` escolhido;
  - `epilogue` acrescenta os `remember`, antes da última fala.

  Verificar: testes em `bond.test.ts` para o tier do 5º e do 6º, a escolha, o pendente, o save antigo sem
  `bondPicks`, o rever e o epílogo com lembrança.
- [x] 1.4 Save antigo (v2 sem `bondPicks`): na leitura, `bondPicksFrom` recebe os eventos já vencidos. Verificar: teste
  com uma campanha que já tem 2 eventos vencidos (sem escolha pendente para eles; o 3º vencido depois pede a escolha se
  tiver uma).

## 2. Falas

- [x] 2.1 `dialogue-tier1.json`: `bondEvents` completo para Tristan, Téa, Joey, Bakura e Yugi:
  - eventos 1 a 4 do nativo sem mudar o texto, com o `pick` (menos o 3º);
  - 5º evento simples, com `pick`;
  - 6º com as duas rotas e `pick`;
  - cerca de 2 opções com `remember` por duelista.

  Rodar `python3 scripts/copy_campaign_data.py`. Verificar: `data.test.ts` com as regras da Decisão 5.
- [x] 2.2 Revisão do usuário: os textos novos, mandados num resumo legível (evento por evento) antes do commit (aprovado)
  (`openspec/changes/lacos-ate-o-fim/falas.md`).

## 3. Tela

- [x] 3.1 `BondHearts`/`Hearts` com a quantidade do `BALANCE`; a `BondsScreen` com 6 eventos. Verificar: testes de
  render existentes ajustados.
- [x] 3.2 `EncounterScreen`: a fase `pick` depois da cena de depois (e no menu, se estiver pendente), com o "+N" nos
  corações. Verificar: teste de render da escolha e, no navegador (viewport de celular), um evento com escolha pelo
  `?campaign=bond`.
- [x] 3.3 Atalho de conferência `?campaign=bond-late`: Tier 3, com o Joey a um passo do 6º evento e um evento vencido
  com escolha pendente. Verificar: no simulador de iOS, o 6º evento do Joey nas duas rotas e o epílogo com lembrança
  (`?campaign=last-evening` ajustado).
  Feito no Safari do simulador: o "!" do Joey pela resposta pendente, os 6 corações, as 3 respostas do 5º evento, a fala
  de resposta e a cena de antes do 6º na rota de amizade. A rota de romance do 6º e o epílogo com lembrança ficaram nos
  testes (`bond-picks.test.ts`) e no `story-smoke` (165 de 200 epílogos com lembrança), não no simulador.

## 4. Conferência

- [x] 4.1 `npx tsx proto/story-smoke.ts`: as campanhas simuladas alcançam os eventos 5 e 6, as escolhas e o epílogo
  com lembrança; `npm test` e `npx tsc --noEmit` verdes.
- [x] 4.2 `CLAUDE.md`: 6 eventos, as escolhas e o `dialogue-tier1.json` com os eventos completos.
