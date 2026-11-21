# Design

## Context

Os ícones saem de três SVGs em `assets/app-icon/` rasterizados pelo `scripts/build_app_icons.mjs` (Chromium do
Playwright): `icon.svg` (manifest 192/512 e `apple-touch-icon` 180 com fundo opaco), `icon-maskable.svg` (512) e
`icon-small.svg` (SVG da aba e o `favicon.ico` 16/32/48). Os três embutem a carta da Polimerização com o caminho
`SPIRAL` de `src/ui/PolyCard.tsx`, num `viewBox` 100×100.

O caminho `SPIRAL` é um recorte de textura: os braços externos encostam nas bordas do quadrado e há fragmentos nos cantos
(sup. esquerdo, inf. direito, inf. esquerdo). Em 16/32 px as faixas ficam com ~1,5 px e o miolo vira mancha.

## Goals / Non-Goals

**Goals:**
- Um glifo de redemoinho fechado, reaproveitando a silhueta da carta nos tamanhos grandes.
- Um glifo pequeno desenhado para 16/32 px.
- Manter o pipeline atual (SVG versionado → script → PNG/ICO versionados).

**Non-Goals:**
- Liquid Glass / `.icon` do Icon Composer, variantes escuro/tingido do iOS.
- Mudar a carta do título (`PolyCard`) ou o `SPIRAL` usado nela.
- Mudar manifest, `index.html`, cores de tema ou pré-carga.

## Decisions

**Recortar a silhueta num disco, em vez de redesenhar a espiral.** Um `clipPath` circular (centro 50,50, r≈45 no quadro
de 100) tira os fragmentos dos cantos e fecha o glifo, e mantém a identidade com a carta do título. Alternativa
descartada: redesenhar uma espiral geométrica limpa, que ficaria mais "refinada" mas deixaria de ser o redemoinho da
carta. O centro do disco pode ser ajustado alguns décimos para cima ou para baixo para o centro óptico (a espiral pesa
embaixo); a escala final fica em ~72% do quadro.

**Glifo pequeno é desenho próprio.** Reduzir o `SPIRAL` não funciona em 16 px. O glifo pequeno é uma espiral de ~2 voltas
com faixas de largura uniforme (≥ 2 px em 16 px), desenhada à mão no SVG (traço grosso com `stroke-linecap: round`,
convertido em caminho ou mantido como traço), sem o miolo detalhado. Fica sobre uma placa escura que preenche o quadro
(cantos levemente arredondados), porque glifo solto some numa aba escura.

**Quadro de 1024 como referência.** Os SVGs passam a declarar `viewBox="0 0 1024 1024"` (ou mantêm 100 com o mesmo
resultado; o que importa é desenhar pensando em 1024 e conferir em 180). O `apple-touch-icon` é quadrado cheio, sem `rx`:
o iOS aplica a máscara. Os PNGs `any` do manifest podem manter cantos arredondados (o Android não mascara ícones `any`).

**Cores.** Fundo `#0a1a3a` → `#050c1f` (o mesmo de hoje); glifo em degradê `#ffffff` → `#7fd6ff`/`#2ab8ff`, como o
`GameIcon big`; brilho com `feDropShadow` ciano, mais fraco que o halo atual da carta. Nada de filtro no glifo pequeno
(borra em 16 px).

**O `SPIRAL` fica duplicado nos SVGs**, como já está hoje (os SVGs são estáticos, sem build de importação). Um comentário
aponta para o `PolyCard.tsx` como origem.

## Risks / Trade-offs

- [O glifo pequeno não se parece o bastante com o grande] → conferir os dois lado a lado; usar o mesmo sentido de giro e
  a mesma inclinação da abertura da espiral.
- [O recorte em disco corta um braço num ponto feio] → ajustar o raio e o centro olhando o render em 180 e 512.
- [O ícone antigo fica em cache no iOS] → o iOS guarda o ícone da tela de início ao adicionar; para conferir é preciso
  remover e adicionar de novo (vale avisar os amigos depois do deploy).
