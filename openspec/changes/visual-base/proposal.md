# Proposta

## Why

A PWA ainda tem cara de protótipo:
- textos em fonte padrão ("VITÓRIA!", "DUELO!");
- moeda e dado feitos de gradiente e um "◎" no lugar do dinheiro do jogo;
- uma tela inicial com "protótipo" e um campo de nome;
- o jogador duelando como o Yugi.

O app nativo (`duel-academy`) já resolveu isso no padrão do *Duel Links*, e o porte combinado começa pelo visual base:
tudo o que vem depois (campanha, loja, editor) já nasce nesse padrão. As telas de referência estão em `docs/nativo/`.

## What Changes

- **Fontes do jogo**:
  - Chakra Petch (OFL, versionada) nos números (LP, ATK/DEF, DP, contadores) e nos títulos de tela e de seção;
  - os títulos de destaque ("DUELO!", "VITÓRIA!", "DERROTA", "EMPATE") em serifada preta e itálica, com degradê e
    brilho, como no nativo.
- **Ícones**:
  - uma família só, a do nativo: Phosphor no estilo cheio para os controles e os conceitos do jogo (DP são moedas,
    deck é uma pilha, loja, pacote…), com a lápide do Material Design Icons para o cemitério;
  - um conceito, um ícone, numa tabela só, com a mesma escolha do nativo;
  - os grandes com o degradê branco → ciano e o contorno marinho do *Duel Links*.
- **DP no lugar de "moedas"**:
  - o dinheiro do jogo passa a se chamar DP, com o ícone de moedas, em todo lugar (mapa, loja, fim do duelo);
  - **só nome e ícone**: os valores de hoje continuam, e a economia do nativo entra com a campanha.
- **Moeda e dado desenhados**:
  - a moeda dourada do nativo ("CARA"/"COROA"), na abertura e nos efeitos;
  - o legenda "Você disse cara" e "Acertou!/Errou!" quando há escolha;
  - um dado desenhado no mesmo padrão.
- **Tela de título** no padrão do nativo:
  - o logo "Yu-Gi-Oh!" (arte da Konami, fora do git, como os sprites);
  - o nome "DUEL DAYS" em letras metálicas, sobre o orbe azul com o leque de cartas;
  - o perfil no topo e os ajustes;
  - entradas só para o que existe hoje: **Jogar/Continuar** (a história atual, depois a campanha) e **Meu deck**.
    Duelo rápido e Histórico entram quando existirem.
- **Boas-vindas e perfil**:
  - na primeira abertura, o jogador escolhe nome, avatar e tratamento (Ele, Ela ou Neutro);
  - os avatares são os 14 duelistas genéricos do *Duel Links* que a PWA já tem;
  - a tela de perfil troca nome, avatar e tratamento e mostra vitórias, derrotas e aproveitamento;
  - o jogador aparece com o próprio avatar no duelo (placa, abertura, fim) e na história, **no lugar do Yugi**.
- **Ajustes**: uma tela de ajustes a partir do título, com as preferências que já existem (animações e som).
- **Save**: o progresso ganha avatar, tratamento e contagem de vitórias/derrotas. Saves antigos continuam válidos: o
  avatar padrão e o tratamento neutro valem até o jogador escolher.

## Capabilities

### New Capabilities

- `visual-do-jogo`: a identidade visual compartilhada pelas telas:
  - fontes de números, títulos e destaques;
  - família de ícones e ícones do jogo;
  - nome e ícone do DP;
  - moeda e dado desenhados.
- `tela-de-titulo`: a tela inicial (logo, nome metálico, orbe, entradas, perfil e ajustes).
- `perfil-do-jogador`: boas-vindas, avatar, tratamento, tela de perfil com estatísticas e o jogador representado pelo
  próprio avatar.

### Modified Capabilities

- `duel-animacoes`: a abertura e o fim do duelo passam a usar a moeda desenhada, o avatar do jogador e os títulos
  estilizados; o fim mostra o ganho em DP; os efeitos de moeda mostram a escolha e o acerto.

## Impact

- **Telas**:
  - `src/App.tsx`: título, boas-vindas, perfil e ajustes no lugar do formulário atual;
  - `src/screens/HubScreen.tsx`, `ShopScreen.tsx` e `DeckBuilder.tsx`: DP, ícones e fontes;
  - `src/screens/duel/anim/{Intro,Outro,Toss}.tsx` e `Plate.tsx`: moeda, títulos e avatar.
- **Estilo**: `src/styles.css` ganha os tokens de fonte, os títulos de destaque e o tratamento dos ícones grandes.
- **Save**: `src/story/progress.ts` ganha `avatar`, `address` (tratamento) e `stats`, com valores padrão para saves
  antigos (lidos por uma função testada, como o `withDefaults`).
- **Assets**:
  - `public/fonts/ChakraPetch-Bold.woff2` (OFL, versionada);
  - a lápide do cemitério (Material Design Icons, Apache 2.0) como SVG versionado, com crédito;
  - o logo "Yu-Gi-Oh!" em `public/brand/` (fora do git, copiado do nativo por script);
  - os avatares, que já estão em `public/characters/npc_duelists_*`.
- **Dependências**: nenhuma nova; `@phosphor-icons/react` já está no projeto.
- **Fora deste change**:
  - a economia em DP do nativo, campanha, loja, editor e histórico;
  - músicas;
  - as conquistas do perfil.
