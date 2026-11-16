# Tarefas

Referência visual: `docs/nativo/` (prints fora do git) e o código do nativo citado no `design.md`.

Regra deste change: cada grupo traz os próprios testes; mudança visual se confere no navegador (viewport de celular) e,
no fim de cada grupo que mexe em tela, no simulador de iOS.

## 1. Fundação: fontes, títulos e ícones

- [x] 1.1 (A fonte já estava em `public/fonts/`, woff2 Latin-1.) Declarar o
  `@font-face` e os tokens `--font-game`/`--font-display` e as classes `.num`, `.game-title` e `.display-title` no
  `styles.css`. A fonte entra na pré-carga do PWA. Verificar:
  - no navegador, `document.fonts.check('bold 16px "Chakra Petch"')`;
  - com a rede cortada depois da primeira visita (aba Network offline), os números continuam na fonte.
- [x] 1.2 Aplicar `.num` a LP, variação de LP, ATK/DEF da folha e das zonas, contadores das placas e números das
  telas, e `.game-title` aos títulos de tela e de painel. Verificar: `node proto/layout-e2e.mjs` continua passando, e o
  LP contando de 8000 a 7500 não muda a largura da placa (medido no navegador).
- [x] 1.3 Criar o `DisplayTitle` (tons `duel`, `win`, `loss`, `draw`) e o `Wordmark` metálico, com teste de componente
  (texto, tom e nome acessível "Duel Days" do wordmark). Verificar: `npm test`, e "VITÓRIA!" em 320 px de largura cabe
  numa linha.
- [x] 1.4 Criar `src/ui/icons.tsx` com o `GameIcon` (tabela de conceitos do `GAME_ICONS` do nativo, Phosphor `fill` e a
  lápide do MDI versionada com crédito) e o modo `big`. Mover os ícones do duelo para lá e trocar ◎, ⋯, ☰ e ▼ das telas
  por `GameIcon`. Verificar:
  - teste de unidade: todo conceito da tabela renderiza um SVG;
  - `grep -rn "◎\|⋯\|☰" src` não acha nada;
  - print do botão de ajustes `big`.

## 2. DP

- [x] 2.1 Criar o `Dp` (ícone de moedas, número na fonte do jogo, "DP", com `delta` para "+30 DP") com teste de
  componente, e trocar o saldo do mapa, da loja e do `Outro` por ele. Os valores não mudam. Verificar: `npm test`, e
  um teste que procura "moeda" nos textos visíveis das telas da loja, do mapa e do fim, sem achar nada.

## 3. Moeda e dado desenhados

- [x] 3.1 Spike: num duelo real com o Mago do Tempo (`proto/`), registrar o `SELECT_OPTION` do cara ou coroa (as
  descrições das opções) e o `TOSS_COIN` em seguida. Verificar: o script imprime as duas descrições. Registrar no
  `design.md` como reconhecer a escolha (ou a alternativa, se não der).
- [x] 3.2 Criar a `Coin` (disco dourado, "CARA"/"COROA", giro 3D com o `PACING`) e o `Die` (pontos 1–6), com teste de
  componente (face por resultado, pontos por número e parada imediata com "reduzir movimento"). Trocar a moeda do
  `Intro` e do `Toss` e o dado do `Toss` por eles. Verificar: `npm test` e prints da moeda girando e parada.
- [x] 3.3 No painel de opções, mostrar "Cara"/"Coroa" no `SELECT_OPTION` de moeda, guardar a escolha e fazer o próximo
  `toss` do jogador mostrar "Você disse …" e "Acertou!/Errou!", com teste puro do reconhecimento e do texto. Verificar:
  `npm test`, e no navegador o cenário "Efeito com escolha" com o Mago do Tempo.

## 4. Perfil do jogador

- [x] 4.1 Acrescentar `avatar` e `address` ao `Progress` e criar `profileOf` (padrões), `playerStats` (vitórias,
  derrotas e aproveitamento somando os oponentes), `PLAYER_AVATARS` e `say(address, …)`, todos com testes de unidade
  (save antigo, save novo, 3 vitórias e 1 derrota = 75%, os três tratamentos). Verificar: `npm test`.
- [x] 4.2 Criar as boas-vindas: nome de 1 a 20 caracteres, grade de 14 avatares e tratamento, com o botão desativado
  enquanto o nome está vazio. Ela só aparece sem save. Verificar:
  - teste de componente (botão desativado e escolha gravada);
  - no navegador, com o IndexedDB apagado, as boas-vindas aparecem e criam o save.
- [x] 4.3 Criar a tela de perfil: troca de nome, avatar e tratamento e as estatísticas. Verificar: teste de componente
  das estatísticas, e no navegador trocar o avatar e ver o rosto novo no título.
- [x] 4.4 Trocar o `yugi_muto` do jogador pelo avatar do perfil no duelo (placa, abertura e fim) e nas cenas da
  história. Verificar: `grep -rn "yugi_muto" src` só acha o Yugi como personagem da série, e o print da placa e da
  abertura com o avatar.

## 5. Tela de título e ajustes

- [x] 5.1 Copiar o logo do nativo para `public/brand/` com `scripts/copy_brand.py` (fora do git; registrar no README e
  no `.gitignore`). Verificar: `git check-ignore public/brand/logo-yugioh.png`.
- [x] 5.2 Criar a tela de título:
  - orbe com o leque de cartas, logo (escondido se não carregar), `Wordmark` e entrada animada (sem ela com "reduzir
    movimento");
  - perfil e ajustes no topo;
  - "Jogar"/"Continuar" com o saldo em `Dp`;
  - "Meu deck".

  Ela substitui o formulário atual. Verificar:
  - teste de componente das entradas (sem "Duelo rápido" e sem "Histórico");
  - prints no navegador e no simulador de iOS;
  - o build sem `public/brand/` mostra a tela sem imagem quebrada.
- [x] 5.3 Criar a tela de ajustes (animações, som e "Apagar save" com confirmação), extraindo o `Choice` do `DuelMenu`
  para `src/ui/`. Verificar: teste de componente, e desligar o som nos ajustes aparece desligado no menu do duelo.

## 6. Abertura e fim no padrão novo

- [x] 6.1 Trocar no `Intro` e no `Outro` os títulos pelo `DisplayTitle`, a moeda pela `Coin`, o retrato do jogador pelo
  avatar e o ganho pelo `Dp`. Atualizar os testes do `IntroOutro.test.tsx`. Verificar: `npm test`, e prints da abertura
  e da vitória no simulador de iOS lado a lado com `docs/nativo/prints/20-abertura-duelo.jpg` e `44-fim-vitoria.jpg`.

## 7. Integração

- [x] 7.1 Rodar `npx tsc --noEmit`, `npm test`, `node proto/webkit-e2e.mjs`, `node proto/duel-e2e.mjs` e
  `node proto/layout-e2e.mjs` (ajustando os roteiros às boas-vindas e ao título novos). Verificar: todos passam.
- [x] 7.2 Atualizar o `CLAUDE.md` (fontes, `GameIcon`, `Dp`, `DisplayTitle`, perfil e logo fora do git) e o
  `docs/HANDOFF.md`. Verificar: as seções refletem o código.

## 8. Ajustes do duelo (pedidos do usuário no teste, 16/11/2026)

- [x] 8.1 Botão de menu do duelo com a altura da placa do oponente. Verificar: print no simulador de iOS.
- [x] 8.2 Um botão de fase só (BATALHA → MAIN 2 → FIM DO TURNO, sem "Encerrar" nem atalho), com a borda azul-clara no
  chanfro. Verificar: testes do `sideActions` e `node proto/webkit-e2e.mjs <url> normal --turno` passando o turno pelas
  fases; print do chanfro no simulador.
- [x] 8.3 A zona tracejada não some durante a encenação: o `play.ts` esconde só o conteúdo da zona. Verificar:
  `src/screens/duel/anim/play.test.ts` (virar e destruir).
- [x] 8.4 Zonas de Magia/Armadilha com a altura das de monstro (`--st-ratio: 1`). Verificar: `node proto/layout-e2e.mjs`
  nos 4 viewports.

## 9. Fundo, brilho e Magia de Campo (pedidos do usuário, 16/11/2026)

- [x] 9.1 Fundo de colmeia com circuito (`scripts/build_circuit.mjs` → `src/ui/circuit.svg`, arte própria) no `.hexbg`,
  com degradê mais claro. Verificar: print no simulador de iOS.
- [x] 9.2 Brilho ciano no tabuleiro, nas placas (mais forte no turno) e nas molduras dos retratos; sem brilho nas cartas
  da mão. Verificar: print no simulador de iOS.
- [x] 9.3 Zonas de campo nas pontas da faixa central, barra de fases encolhida entre elas. Verificar:
  `node proto/layout-e2e.mjs` nos 4 viewports e Umi ativada aparecendo na zona.
- [x] 9.4 Arte recortada da Magia de Campo a 50% no fundo do tabuleiro (`fieldArt.ts`, testes em `fieldArt.test.ts`).
  Verificar: `npm test` e Umi ativada no navegador.

## Workflow follow-up

- Teste no iPhone físico pelo usuário, depois arquivar o change.
- Próximo change: a campanha DM Tier 1 do nativo (calendário, mapa, encontro, falas, laço, economia em DP).
