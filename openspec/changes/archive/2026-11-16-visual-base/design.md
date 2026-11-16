# Design

## Context

O motivo está em `proposal.md` (Why). A referência visual são os prints de `docs/nativo/` e o código do nativo:
- `App/DuelAcademy/UI/` (`GameStyle`, `GameTitleWordmark`, `TitleOrb`, `GameIcon`, `CardFanEmblem`);
- `Duel/Board/{CoinToss,DieRoll,DuelIntro}.swift` e `Duel/DuelEndOverlay.swift`;
- `Profile/` (`WelcomeView`, `ProfileView`, `PlayerAvatar`, `PlayerAddress`).

O estado da PWA que condiciona o desenho:
- **Fontes**: o HUD usa `system-ui`, e a face da carta usa `ui-serif`.
- **Ícones**:
  - os da interface vêm de `@phosphor-icons/react`, já instalado, mas misturados com caracteres (◎, ⋯, ☰);
  - as ações do duelo usam Phosphor (`icons.tsx`).
- **Telas**: `App.tsx` decide a tela por estado. Não há roteador. O título atual é um formulário (nome, "Novo jogo",
  "Apagar save").
- **Save** (`progress.ts`, Dexie):
  - `playerName`, `coins`, `wins`/`losses` por oponente;
  - `settings` lidas com `withDefaults`.
- **Avatares**: os 14 duelistas genéricos do nativo já estão em `public/characters/npc_duelists_{common,dm}__*`, com corpo
  e expressões (o `build-characters` os gera). O jogador hoje é sempre `yugi_muto`.
- **Moeda e dado**: hoje são CSS com gradiente.
  - A abertura (`Intro`) decide quem começa pelo turno 1.
  - O efeito de moeda chega como beat `toss`. A escolha de cara ou coroa chega antes, como um `SELECT_OPTION` que a tela
    mostra como "Opção 1/Opção 2".

## Goals / Non-Goals

**Goals:**
- Um módulo de estilo único: fontes, cores, títulos de destaque e ícones vêm de um lugar só, e as telas não repetem
  números nem nomes de ícone.
- Tudo funciona offline: fonte, ícones e avatares entram na pré-carga do PWA. A exceção é o logo, que fica fora do git.
- Nenhum save antigo se perde.

**Non-Goals:**
- Redesenhar loja, editor ou mapa além de trocar DP, ícones e fontes neles.
- Roteador ou URLs por tela.
- Fonte variável ou outros pesos da Chakra Petch.

## Decisions

### 1. Fontes como `@font-face` local e tokens no CSS

A Chakra Petch Bold (OFL) já estava em `public/fonts/` (woff2 + `OFL.txt`, versionados).
- O `@font-face` no `styles.css` usa `font-display: swap`.
- Dois tokens: `--font-game` (Chakra Petch) e `--font-display` (`ui-serif` 900 itálico; New York no iOS e Georgia fora,
  como o `.serif` black italic do nativo).
- Os números usam `font-variant-numeric: tabular-nums`, para a largura não mudar enquanto contam.

As classes `.num` (a que o HUD já usava para os números), `.game-title` e o componente `DisplayTitle` são o único
jeito de usar essas fontes nas telas. A fonte já estava no projeto, num subconjunto Latin-1 (cobre o português).

- *Alternativa:* Google Fonts. Descartada porque não funciona offline e depende de terceiros.

### 2. Títulos de destaque como um componente

`DisplayTitle({ tone: 'duel' | 'win' | 'loss' | 'draw' })` desenha o texto com `--font-display`:
- o degradê por `background-clip: text`;
- o brilho por `filter: drop-shadow`, na cor do tom;
- `font-size` em `cqw`/`clamp`, com `white-space: nowrap`, para encolher em vez de quebrar.

`Intro` e `Outro` passam a usá-lo. O nome metálico do título (`Wordmark`) é outro componente, com `--font-game`,
degradê metálico, contorno marinho (`-webkit-text-stroke` + sombras) e brilho ciano. O reflexo é uma faixa animada
recortada pelo texto.

### 3. Ícones por conceito numa tabela só

O `src/ui/icons.tsx` (o atual `screens/duel/icons.tsx` vai para lá) exporta `GameIcon({ name, size, big })`. O `name` é
o conceito (`dp`, `deck`, `graveyard`, `shop`, `settings`, `close`…), e a tabela é a do `GAME_ICONS` do nativo:
- Phosphor no peso `fill`, pelo `@phosphor-icons/react`;
- a lápide do cemitério, um SVG do Material Design Icons (`grave-stone`, Apache 2.0) versionado em `src/ui/`.

Com `big`, o ícone ganha o tratamento do *Duel Links*:
- degradê branco → ciano num `<linearGradient>` do SVG;
- contorno marinho por `drop-shadow` em 4 direções;
- brilho fraco.

Os caracteres usados como ícone (◎, ⋯, ☰, ▼) saem.

- *Alternativa:* SVGs soltos copiados do nativo. Descartada: os `.symbolset` do nativo são SF Symbols (SVG de modelo da
  Apple), e o pacote React já entrega os mesmos desenhos.

### 4. DP é só o nome

O campo continua `coins` no save, porque renomear exigiria migração sem ganho.
- Um componente `Dp({ value, delta })` desenha o ícone de moedas, o número na fonte do jogo e "DP" (ou "+30 DP").
- Mapa, loja, título e `Outro` usam esse componente.
- Os textos "moedas" saem da interface. Um teste procura "moeda" nos textos visíveis das telas, fora de "moeda" no
  sentido de cara/coroa.

### 5. Moeda e dado desenhados

- **Moeda:** `Coin` em SVG desenha um disco dourado com gradiente radial, borda em relevo e o texto "CARA" e "COROA" nas duas
  faces, as duas douradas como no nativo, de um cartão 3D. O giro usa a Web Animations, com a duração do `PACING`, como já
  faz o `Toss`. `Intro` e `Toss` usam a mesma moeda.
- **Dado:** `Die` desenha os pontos de 1 a 6 em grade 3×3, num quadrado claro de cantos arredondados; ele gira e para no
  número sorteado.
- **A escolha:** a tela reconhece o `SELECT_OPTION` de cara ou coroa pelas descrições das opções (as strings de sistema
  de cara e coroa), mostra "Cara"/"Coroa" no lugar de "Opção 1/2" e guarda a escolha. O próximo beat `toss` do
  jogador sai com o texto "Você disse …" e, ao parar, "Acertou!/Errou!". Uma tarefa de spike confirma as descrições
  **Resultado do spike (3.1, `proto/coin-call.ts`):** o `Duel.CallCoin` chega como `SELECT_OPTION` com
  `options: [60n, 61n]` (cara, coroa; índice 0 é cara) e o beat `toss` do jogador vem nos steps da resposta seguinte,
  com `results` 1 para cara e 0 para coroa.
  reais no motor antes.

### 6. Perfil no save, com padrões

`Progress` ganha `avatar?: string` (id do personagem em `public/characters`) e `address?: 'he' | 'she' | 'neutral'`.
- Uma função pura, `profileOf(progress)`, devolve `{ name, avatar, address }` com os padrões: o primeiro avatar da lista
  e `neutral`.
- As estatísticas são calculadas, não gravadas: somam `wins` e `losses` de todos os oponentes, e o aproveitamento é
  `wins / (wins + losses)`. Assim os saves antigos já chegam com números.
- A lista de avatares (`PLAYER_AVATARS`) segue a ordem do nativo, com nome acessível e sem o nome do *Duel Links*.

O texto com gênero passa por `say(address, { he, she, neutral })`, testada. Hoje ela só é usada nas boas-vindas e na
saudação do título; a campanha vai usar a mesma função depois.

### 7. Telas novas no `App.tsx`, sem roteador

O `App` ganha os estados `welcome | title | profile | settings`, ao lado dos que já existem (história, deck, loja).
- **Boas-vindas:** aparece só sem save.
- **Título:** substitui o formulário atual.
  - "Jogar/Continuar" vai para a história.
  - "Apagar save" vai para os ajustes, com confirmação.
- **Ajustes:** reutilizam o seletor do `DuelMenu` (`Choice`, extraído para `src/ui/`).

### 8. Logo fora do git

O `logo-yugioh.png` do nativo vai para `public/brand/`, copiado por `scripts/copy_brand.py` e no `.gitignore`, como os
sons. O título testa se o logo carregou (`onError` → esconde), para o build sem o arquivo continuar completo.

## Risks / Trade-offs

- **[Risco] A string de cara ou coroa no `SELECT_OPTION` não é a esperada.** Mitigação: o spike da tarefa 1 confirma
  com o motor real. Se não der para reconhecer, os botões mostram o texto da descrição e o "Você disse" sai sem cair na
  "Opção 1".
- **[Risco] `ui-serif` fora do Safari cai em Georgia**, que tem outro desenho. Mitigação: é o mesmo critério da face da
  carta; o alvo são iPhones.
- **[Trade-off] Estatísticas calculadas das vitórias por oponente:** não distinguem empate de derrota. Isso é aceito pela
  spec e fica para o histórico da campanha.
- **[Risco] Contorno por `-webkit-text-stroke` engrossa o traço por dentro.** Mitigação: contorno por sombras
  empilhadas, conferido no simulador de iOS.

## Migration Plan

Sai num deploy só. O save antigo abre direto no título, com o nome dele, o primeiro avatar e o tratamento neutro. Para
voltar atrás, basta reverter o commit: os campos novos do save são opcionais e o código antigo os ignora.

## Open Questions

- O avatar padrão dos saves antigos: o primeiro da lista ou um sorteado? O primeiro é previsível; dá para trocar no
  perfil.
