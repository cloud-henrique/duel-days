# Proposal

## Why

O fundo do jogo é quase preto (o `.hexbg` vai de `#1a4066` no centro a `#050a18` nas bordas) e, sobre ele, ficam o ciano
neon, o texto quase branco e as cartas claras. Esse contraste extremo cansa a vista depois de alguns minutos de duelo,
tanto de dia (brilho alto) quanto à noite. Além disso, o azul escuro está espalhado em ~120 cores soltas pelos CSS, o que
impede ajustar a paleta num lugar só.

## What Changes

- A paleta azul do jogo sobe para um **azul médio** (direção "B" da exploração: fundo por volta de `#26507f`, placas e
  painéis por volta de `#2c609c`, tapete do duelo por volta de `#2d6a9a`), mantendo a identidade de HUD azul do *Duel
  Links*. Os valores finais saem de uma calibração na tela real.
- A paleta vira uma **escala de tokens** no `:root` do `styles.css`. Todo fundo, painel, botão, chip, poço (barra de LP,
  moldura de avatar) e texto apagado das telas passa a usar esses tokens; nenhuma cor de fundo azul fica solta nos CSS.
- Vale para **todas as telas**: duelo, título, boas-vindas, perfil, mapa, encontro e diálogo (a folha, a `TopBar` e as
  placas, não a arte de fundo), laços, status, coleção, loja, abertura de pacote, editor de deck, modais e folhas.
- O **neon continua**: o brilho ciano do tabuleiro, das placas e das molduras e a luz do turno permanecem, com a
  intensidade reajustada para manter o destaque sobre o fundo mais claro.
- As tintas das zonas (laranja dos monstros, verde das Magias/Armadilhas) são reajustadas para não ficarem barrentas
  sobre o tapete mais claro.
- O padrão de circuito do fundo (`circuit.svg`) continua, com as trilhas reajustadas para seguirem visíveis.
- O texto apagado e os chips passam a ter contraste mínimo AA (4,5:1) contra o fundo onde aparecem.
- As cores de tema do PWA (`theme_color`, `background_color`, `<meta name="theme-color">`) passam a acompanhar o novo
  fundo, para a barra do sistema e a abertura não mostrarem uma faixa quase preta.
- Fora do escopo: a face das cartas (`cardface.css`), a arte das cenas da campanha e o filtro do período, o véu escuro
  dos diálogos (`.scrim`) e o **ícone do app**, que continua sobre o fundo escuro.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `visual-do-jogo`: o requisito "Fundo de circuito e brilho dos componentes" passa a exigir o degradê em azul médio e o
  brilho ciano ainda visível; requisito novo "Paleta azul em tokens" (uma escala única, nenhuma cor de fundo solta,
  contraste AA do texto apagado).
- `pwa-app-icons`: o requisito "Cores de tema alinhadas ao HUD" passa a seguir o novo fundo em vez de `#050c1f`; o ícone
  não muda.

## Impact

- `src/styles.css` (tokens no `:root`, `.hexbg`, `.hud`, `.hud-btn`, campos, folhas).
- `src/screens/duel/duel.css`, `src/screens/campaign/campaign.css`, `src/screens/shop/shop.css`,
  `src/screens/deck/deck.css`, `src/screens/title/title.css`, `src/ui/{modal,coin,icons,titles}.css`.
- `src/screens/campaign/assets.ts` (degradê de reserva quando falta a arte).
- `src/ui/circuit.svg` via `scripts/build_circuit.mjs` (opacidade das trilhas).
- `index.html` e `vite.config.ts` (cores de tema do PWA).
- Conferência: `proto/layout-e2e.mjs`, `proto/shop-e2e.mjs`, `proto/deck-e2e.mjs`, screenshots em viewport de celular
  e no simulador do iOS.
