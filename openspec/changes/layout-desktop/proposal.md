# Proposal

## Why

O PWA foi desenhado só para celular em retrato. Aberto num navegador de desktop (ou num tablet deitado), ele estica o
layout de retrato: os botões do encontro viram faixas de 2000px, e as placas dos duelistas atravessam a tela enquanto o
campo fica num corredor estreito no meio. A folha da carta cobre o campo por baixo e escurece tudo. Os amigos também
jogam no computador, então a tela larga precisa de um layout próprio.

## What Changes

- Novo modo **tela larga**: paisagem com largura ≥ ~900px (desktop e tablet deitado). Fora dele (celular em retrato ou
  deitado), tudo continua como hoje.
- **Encontro** em tela larga: os botões do menu (evento, Conversar, Duelar, Voltar ao mapa) ficam lado a lado numa linha
  só. A caixa de fala e as listas de escolha (tópicos, respostas) ganham largura máxima.
- **Duelo** em tela larga, em 3 colunas:
  - esquerda: a placa do oponente em cima, a do jogador embaixo, e o narrador/histórico entre elas;
  - centro: o campo na altura toda e a mão embaixo, com a mão do oponente acima do campo;
  - direita: um painel fixo com o detalhe da carta (no lugar da folha modal), com o botão de avançar fase no pé.
- Em tela larga, passar o mouse numa carta visível mostra o detalhe no painel. O clique fixa a carta, e as ações dela
  (Invocar, Baixar, Ativar, Atacar…) aparecem flutuando logo acima da própria carta, na mão ou na zona. O campo não
  escurece.
- Em tela larga, as escolhas do motor (corrente, escolher cartas, ordenar) aparecem na coluna da direita, não na folha
  sobre a mão.
- As animações continuam saindo dos lugares medidos (`data-loc`), agora nas posições novas das placas e pilhas.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `visual-do-jogo`: define o que é "tela larga" (o gatilho único que as telas consultam).
- `duel-hud`: layout de 3 colunas em tela larga, painel fixo da carta com hover, ações sobre a carta e escolhas na
  coluna lateral. "Respiro da tela" e "Campo na largura da tela" passam a valer só fora da tela larga.
- `campanha`: no requisito "Encontro", o menu fica em linha e as falas ganham largura máxima em tela larga.

## Impact

- CSS: `src/screens/duel/duel.css` (tokens e grade alternativos sob a consulta de tela larga), `src/screens/campaign/campaign.css`
  e `src/styles.css` (`.sheet`/`.acts` do encontro e do diálogo).
- React: `DuelScreen.tsx` (painel lateral, carta em foco por hover, ações ancoradas), `CardSheet.tsx` (`CardDetails`
  reaproveitado no painel), `PromptPanel`/`ChoicePanels` (alvo na coluna direita), `EncounterScreen.tsx`/`Dialogue.tsx`
  (menu em linha), e um hook pequeno para a consulta de tela larga.
- Testes: `proto/layout-e2e.mjs` ganha viewports de desktop (ex.: 1440×900, 1280×720, 1024×768 deitado). O
  `duel-e2e.mjs` precisa rodar também em tela larga, para garantir que nenhuma encenação fica presa.
- Sem mudança no motor, no save nem nas regras.
