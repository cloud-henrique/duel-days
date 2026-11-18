# Proposta

## Why

O editor de deck ainda é o do protótipo: seletor e campo de nome soltos no topo, abas "Coleção" / "Deste deck" e um
`<select>` de ordenação. O nativo resolveu o editor com o visual do jogo: o deck sempre à vista em cima, agrupado, e a
coleção numa "maleta" embaixo que abre e fecha, com ordenação, filtros, busca e arrastar cartas entre os dois. A loja
já foi portada (`loja-nativa`); o editor é o último passo de interface antes da CPU na ordem do porte.

## What Changes

- **Editor "Meu deck" no visual do nativo**:
  - cabeçalho com "Main N 40–60" e "Extra N até 15", e o selo **PRONTO** (verde) ou **N problemas** (laranja), que abre
    "O que falta no deck";
  - **até 5 decks**, como hoje: um seletor discreto no topo mostra o deck em edição (e "Em uso"), e a folha dele lista os
    decks e tem Novo, Renomear, Apagar e "Usar este deck";
  - **painel do deck** em cima, 6 colunas, agrupado (Normal, Efeito, Magia, Armadilha) e o Extra Deck numa seção à parte;
  - **maleta** embaixo, numa gaveta com 3 posições (recolhida, meio, aberta), lembrada no aparelho; a alça arrasta e,
    recolhida, resume ordenação, filtro e busca;
  - na maleta, **cada cópia continua uma miniatura** (como hoje na PWA); as cópias que já estão no deck ficam apagadas
    com a marca;
  - **ordenação do nativo** (Tipo de carta, Nível, ATK, DEF, Nome, Atributo, Tipo de monstro, Raridade, Cópias,
    Obtenção) com "Inverter", busca pelo nome e os filtros Todas, Monstros, Fusão, Magias e Armadilhas;
  - tocar numa carta abre o zoom com "No deck X · Você tem Y" e Pôr/Tirar (como hoje);
  - **arrastar**: segurar uma carta da maleta e soltar no deck põe uma cópia; segurar uma do deck e soltar na maleta tira.
    A carta "voa" com uma fantasma; recusas mostram um aviso curto ("Você só tem 2 cópias", "Máximo de 3 cópias", "O
    deck principal está cheio", "O Extra Deck está cheio");
  - sons de pôr e tirar carta do nativo; grava a cada mudança.
- **Tela Coleção** (nova): totais (cartas diferentes e no total) e a mesma grade da maleta, com ordenação, filtros, busca
  e o zoom, sem editar o deck.
- **Mapa**: o atalho **Coleção** entra no lugar de Status. O botão de menu do cabeçalho abre **Opções** (Status da
  campanha, Voltar ao título, Fechar), em vez de voltar direto ao título. **BREAKING (atalho)**: Status sai da barra de
  baixo.
- O fim da campanha ("Ver a coleção") passa a abrir a tela Coleção.
- **Ordem de obtenção**: o save passa a guardar em que ordem cada carta entrou na coleção (para "Obtenção"); save antigo
  sem o campo ordena pelo número da carta, sem migração.

## Capabilities

### New Capabilities
- `editor-de-deck`: o editor no visual do nativo (cabeçalho e selo de pronto, os 5 decks, painel agrupado, maleta em
  gaveta, ordenação/filtros/busca, zoom, arrastar com voo e recusas, sons, gravação).
- `colecao`: a tela Coleção (totais e a grade com ordenação, filtros, busca e zoom).

### Modified Capabilities
- `grade-de-cartas`: a grade virtualizada passa a ser a da maleta e a da Coleção (sem as abas "Coleção" / "Deste
  deck"), com as ordenações do nativo.
- `campanha`: o mapa dá acesso a Deck, Coleção, Laços e Loja, e o Status passa para as Opções do cabeçalho.

## Impact

- Telas: `src/screens/DeckBuilder.tsx` substituído por `src/screens/deck/` (editor, painel do deck, maleta/gaveta,
  barra de ordenação e filtros, folha dos decks, diálogo de problemas, arrastar, `deck.css`) e `src/screens/campaign/`
  ganha `CollectionScreen` e o painel de Opções do mapa; `App.tsx` ganha a tela `collection`.
- Modelo: ordenação e filtros puros em `src/screens/deck/trunk.ts` (testados); `src/game/decks.ts` ganha a checagem de
  "pode pôr" com o motivo da recusa; `src/campaign/state.ts` ganha `acquired?: number[]` gravado no `addCards`.
- Áudio: `copy_sounds.py` copia `card-add` e `card-remove`; `sfx.ts` ganha os nomes.
- Testes: unidade da ordenação, da recusa e do grupo do deck; teste de tela do editor e da Coleção; e2e no WebKit com
  arrastar e a gaveta; conferência no simulador de iOS (arrastar com toque).
