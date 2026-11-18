# Proposta

## Why

A loja da PWA ainda é a do protótipo: uma lista de painéis com botões de compra e, depois, uma grade com as cartas
surgindo. O nativo já resolveu a loja e a abertura de pacote com o visual do jogo (balcão do vovô com fala, vitrine de
capas, detalhe do pacote com o que falta na coleção, rasgar o pacote e virar as cartas). As regras e o sorteio já são
os do nativo (`economia-dp`); falta a tela. É o próximo passo da ordem do porte (loja e editor no visual do nativo); o
editor de deck vem numa change própria depois desta.

## What Changes

- **Balcão do vovô** no topo da loja: o Solomon atrás do balcão, sobre o fundo da Loja de Jogos, com o nome da loja, o
  saldo em DP (contando até o valor novo depois de uma compra) e um balão de fala que some sozinho ou com um toque. As
  falas saem do `shopkeeper` do `dialogue.json` (boas-vindas, comprou pacote, comprou caixa, saiu Ultra, sem DP).
- **Vitrine em grade**: "Pacotes ganhos" (com "Abrir pacote grátis" e a contagem), "À venda" (coleções) e "Pacotes de
  personagem", em grade de 3 capas com nome e preço; bloqueados com a capa apagada e o motivo ("Dia 7", "Tier 2 · dia
  8", "3/5"); sem DP, "faltam N DP"; selo NOVA no recém-liberado. Entrada em cascata e balanço ao tocar num bloqueado.
- **Detalhe do pacote** (nova tela, ao tocar numa capa): capa, contagem por raridade, "X de Y cartas" com barra de
  progresso, balcão compacto, grade das cartas do pacote com as que faltam apagadas (toque abre o detalhe da carta) e
  uma barra fixa com o saldo e os botões "Comprar 1 pacote" e "Caixa · 20 pacotes" (a caixa pede confirmação com o
  total, a economia e o saldo depois).
- **Abertura de pacote como no nativo**: tela cheia com o pacote fechado ("Toque no pacote para abrir"), rasgo, 5
  cartas de verso (3 em cima, 2 embaixo), virar uma a uma ou "Revelar tudo", brilho e rótulo da raridade, selo NOVA,
  "Pronto" com a contagem de novas. Na caixa e nos pacotes ganhos, pacote a pacote ("Pacote 3 de 20"), com "Abrir
  todos" e um resumo no fim. "Reduzir movimento" troca a encenação por transições simples.
- **Ajuda**: botão "?" no topo com "Como funcionam os pacotes?" (composição, chances do slot e a caixa).
- **Sons**: rasgar o pacote e o brilho da Super/Ultra (`sfx-tear` e `sfx-rare` do nativo, novos); virar a carta usa o
  `flip` que o duelo já tem; a compra, o `purchase`. A música da loja já existe.
- Sem mudança de regra: preços, liberação, sorteio e a caixa continuam como no spec `economia-dp`. A compra continua
  gravada antes da encenação (fechar no meio não perde cartas).

## Capabilities

### New Capabilities
- `loja-de-pacotes`: a tela da loja (balcão e falas, vitrine e estados das capas), o detalhe do pacote com a barra de
  compra e a confirmação da caixa, e a abertura de pacote (rasgo, virar, revelar tudo, caixa pacote a pacote, resumo).

### Modified Capabilities
(nenhuma: as regras da loja e dos pacotes no `economia-dp` não mudam)

## Impact

- Telas: `src/screens/ShopScreen.tsx` reescrita e dividida em `src/screens/shop/` (vitrine, balcão, detalhe, abertura,
  resumo, `shop.css`); `App.tsx` ganha a tela do detalhe do pacote (`Screen`).
- Modelo: `src/campaign/packs.ts` ganha consultas puras para o detalhe (contagem por raridade, cartas que o jogador tem)
  e o texto da ajuda; sorteio e compra intactos. Escolha da fala do balconista pura e testada.
- Áudio: `scripts/copy_sounds.py` copia `tear` e `rare`; `sfx.ts` ganha os nomes (`flip` já existe).
- Arte: capas `pack-*.jpg` e o sprite do Solomon já existem; capa que falta (LON, pacotes de personagem) usa a capa
  desenhada. Fundo da loja: `bg-loja-de-jogos.jpg`.
- Testes: unidade do modelo e da fala; e2e no WebKit do fluxo comprar → abrir → revelar tudo → pronto.
