# Proposta

## Why

Os laços com os 5 do Tier 1 (Tristan, Téa, Joey, Bakura e Yugi) se esgotam cedo. São 4 eventos, e quem joga com
frequência fecha a história ainda no Tier 1 (dias 1 a 7). Nos 23 dias seguintes, esses personagens viram só oponentes
de duelo, sem nada novo para contar. Além disso, a única decisão do jogador em toda a história é amizade ou romance, no
3º evento.

O usuário escolheu aprofundar os laços que já existem, em vez de criar laços com os personagens dos outros tiers ou com
personagens novos.

## What Changes

- **Dois eventos novos por duelista do Tier 1**, totalizando 6 corações e 6 eventos:
  - o 5º só abre a partir do Tier 2 (Reino dos Duelistas);
  - o 6º, a partir do Tier 3 (Batalha da Cidade);
  - cada um continua a história do personagem naquele momento: Joey e a Serenity, Bakura e o Anel, Yugi e o Faraó, Téa
    e os amigos, Tristan e a Serenity;
  - o 6º tem uma versão por rota (amizade ou romance), como o 4º.
- **Uma escolha de resposta dentro de cada evento** (1º, 2º, 4º, 5º e 6º; o 3º continua com amizade ou romance):
  - 2 ou 3 opções;
  - cada opção muda a afinidade e tem uma fala de resposta;
  - algumas escolhas ficam lembradas e ganham uma fala no epílogo.
- **O epílogo passa a lembrar escolhas** feitas nos eventos com aquele duelista.
- **A carta do laço continua no 4º evento.** O 6º fecha a história.
- **A tela de Laços mostra 6 corações e 6 eventos.** Rever um evento inclui a resposta que o jogador escolheu.
- **Save**: a campanha guarda as escolhas (`bondPicks`). O campo é opcional, então não muda a versão do save e não
  recomeça a campanha de ninguém.
- **Falas novas em pt-BR**, no tom das atuais (com `{nome}` e `{m|f|n}`), escritas por Claude e revisadas pelo usuário.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `lacos`:
  - afinidade de 0 a 600 (6 corações);
  - 6 eventos, com o 5º e o 6º presos ao tier;
  - a rota muda também o 6º evento;
  - escolha dentro do evento (requisito novo);
  - rever com a escolha feita.
- `campanha`: o epílogo inclui as falas das escolhas lembradas.

## Impact

- **Modelo da campanha**:
  - `src/campaign/balance.ts` (`bondEvents: 6`);
  - `bond.ts` (abertura por tier, escolhas, epílogo com lembranças, rever);
  - `state.ts` (`bondPicks` opcional);
  - `data/types.ts` (tipo da escolha no evento).
- **Dados**:
  - `src/campaign/data/dialogue-tier1.json`, que passa a ter os 6 eventos completos de cada um, com as escolhas;
  - `campaign.json` e `dialogue.json`, regerados pelo `copy_campaign_data.py`;
  - `data.test.ts`, que confere que todo duelista com laço tem os 6 eventos, as escolhas e as duas rotas.
- **Telas**:
  - `EncounterScreen` (a escolha depois do evento);
  - `BondsScreen` e `Hearts`/`BondHearts` (6 corações);
  - `Dialogue`, para mostrar as opções de resposta, como já faz com amizade ou romance.
- **Ferramentas**: `proto/story-smoke.ts`, que passa a alcançar os eventos 5 e 6 e as escolhas.
