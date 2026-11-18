# Tasks

## 1. Modelo

- [x] 1.1 `acquired?: number[]` no `CampaignState`: `addCards` acrescenta a carta nova, `newCampaign` começa com o deck
  inicial. Verificar: teste de que abrir um pacote põe as cartas novas no fim de `acquired` e não repete as que já havia.
- [x] 1.2 `addRefusal(deck, code, cards, owned)` em `decks.ts` com as quatro mensagens. Verificar: teste de cada motivo
  (sem cópia, limite de cópias e limitada, principal cheio, Extra cheio) e `null` quando pode.
- [x] 1.3 `src/screens/deck/trunk.ts`: `sortCodes` (10 chaves + inverter, monstros primeiro nas de monstro, desempate),
  `filterCode`, `deckGroups`, `trunkSummary`. Verificar: `trunk.test.ts` com ATK, Nome invertido, Obtenção, Atributo e
  os grupos com uma Fusão no Extra.

## 2. Sons e peças compartilhadas

- [x] 2.1 `copy_sounds.py` com `card-add` e `card-remove`; `sfx.ts` com `cardAdd`/`cardRemove`. Verificar: os dois
  `.m4a` gerados, `sfx.test.ts` atualizado e `npx tsc --noEmit`.
- [x] 2.2 `src/ui/Modal.tsx` (véu + `Backdrop` + painel HUD) usado pela loja (ajuda e caixa) e pelo editor. Verificar: os
  testes da loja e o `proto/shop-e2e.mjs` continuam passando.

## 3. Editor

- [x] 3.1 `DeckEditor` + `DeckHeader`: "Main N 40–60", "Extra N até 15", selo PRONTO / N problemas e o `IssuesDialog`.
  Verificar: teste de tela com deck de 37 cartas mostrando "3 problemas"… e a lista ao tocar.
- [x] 3.2 Seletor e `DeckSheet`: lista com contagem e prontidão, Novo (até 5), Renomear, Apagar (nunca o último) e "Usar
  este deck" (só válido). Verificar: teste de tela trocando o deck em uso e com 5 decks sem "Novo".
- [x] 3.3 `DeckPanel`: 6 colunas, grupos Normal/Efeito/Magia/Armadilha e a seção Extra, estado vazio; toque abre o zoom
  com Pôr/Tirar (`addRefusal`). Verificar: teste de tela com a Fusão na seção Extra.
- [x] 3.4 `Trunk` + `TrunkBar`: grade virtualizada com cópias uma a uma e a marca de "no deck", diálogo de ordem com
  Inverter, botão de inverter, busca, chips; ordem lembrada no `localStorage`; volta ao topo ao mudar. Verificar: teste
  de tela ordenando por ATK e filtrando Fusão.
- [x] 3.5 Gaveta (`useDrawer`): 3 posições, alça com toque e arraste, resumo recolhida, posição lembrada; movimento
  reduzido sem transição. Verificar: no navegador em viewport de celular, as três posições e a lembrança ao voltar.
- [x] 3.6 Arrastar (`useCardDrag`): segurar 300 ms, fantasma no portal, soltar no deck/maleta, volta ao soltar fora,
  rolagem e toque preservados, aviso de recusa de 1,6 s e os sons. Verificar: e2e no WebKit arrastando para o deck e de
  volta, a quarta cópia recusada e a rolagem da maleta sem arrastar.
- [x] 3.7 `App.tsx` usa o `DeckEditor`; o `DeckBuilder.tsx` sai; `campaign.test.tsx` e o teste das "moedas" apontam para
  os arquivos novos. Verificar: `npm test`.

## 4. Coleção e mapa

- [x] 4.1 `CollectionScreen` com os totais e a grade (sem pôr/tirar); tela `collection` no `App`; "Ver a coleção" do fim
  da campanha abre ela. Verificar: teste de tela com "28 cartas diferentes" e "45 no total".
- [x] 4.2 Mapa: barra Deck, Coleção, Laços, Loja; menu do cabeçalho abre Opções (Status da campanha, Voltar ao título,
  Fechar). Verificar: teste do `MapScreen` (Coleção chama o atalho, Opções → Status) e o e2e do fluxo antigo
  (`webkit-e2e.mjs`) ainda chega ao duelo.

## 5. Verificação

- [x] 5.1 `npx tsc --noEmit`, `npm test`, `npx vite build`. Verificar: tudo passa.
- [x] 5.2 `proto/deck-e2e.mjs` (WebKit): editor → gaveta nas 3 posições → ordenar → zoom pôr/tirar → arrastar → recusa
  → trocar deck em uso → Coleção. Verificar: o script termina sem erro, normal e com `--reduzir`.
- [x] 5.3 Conferência visual em viewport de celular contra os prints `37` e `38`, e no simulador de iOS o arrastar com
  toque (segurar, rolar sem arrastar, soltar fora) e a grade cheia com `?campaign=all-cards`. Verificar: screenshots no
  relatório.
- [x] 5.4 CLAUDE.md (arquitetura `src/screens/deck/`, Coleção, Opções do mapa; armadilha do arrastar no iOS) e README.
  Verificar: o diff menciona os arquivos novos.

## Workflow follow-up

- Arquivar a change e sincronizar `editor-de-deck`, `colecao`, `grade-de-cartas` e `campanha`.
- Próximo passo do porte: a CPU.
