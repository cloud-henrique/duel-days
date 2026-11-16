# Proposta

## Why

A tela de duelo do PWA ainda parece grosseira ao lado do app nativo (Duel Days). O campo, que deveria ser o elemento
mais aproveitado, encolhe para ~80% da largura no Safari. As tarjas ATK/DEF, MAGIA e ARMADILHA são desproporcionais:
17px fixos sobrepostos à carta oficial em inglês. Placas, botões e contadores são grandes demais, e a tela não tem
respiro. O nativo resolve tudo isso com um modelo de métricas derivado da largura e uma face de carta própria. Este
change traz o mesmo modelo antes das animações (change `animar-duelo`), que dependem desse layout.

## What Changes

- **Métricas centrais**: todas as medidas do duelo derivam da largura da tela, com tetos, como o `BoardMetrics` do
  nativo:
  - campo `min(W−40, 500)`;
  - zona `min(96, (campo−44)/5, H·0,1)`;
  - zona de Magia/Armadilha com 0,78 da altura;
  - faixa central de 46;
  - carta da mão `min(96, (W−24)·0,25)`.

  A fórmula com `dvh` que encolhia o campo sai.
- **Campo**:
  - inclinação de 22° com âncora no centro;
  - carta ocupando 100% da altura da zona;
  - selo de ATK/DEF pequeno (10pt) e proporcional.
- **Face de carta própria** (template), usada na mão, no campo e no destaque de ativação:
  - moldura pela cor do tipo;
  - nome em português;
  - estrelas e atributo;
  - arte recortada (sem a moldura oficial);
  - tarja proporcional (~13,75% da largura) com `ATK / DEF`, MAGIA ou ARMADILHA.

  A folha de detalhe continua com a imagem oficial grande.
- **Arte recortada**: nova variante no pipeline de arte, com ~1.700 imagens WebP de ~256px. Fica fora do git e da
  pré-carga.
- **Tipografia**: Chakra Petch Bold (OFL) nos números: LP, mudança de LP, selos e contadores.
- **Placas** com ~60pt de altura:
  - avatar 44;
  - LP 22;
  - contadores 13;
  - cemitério 26×38;
  - barra de LP com cor pela porcentagem;
  - borda acesa no duelista da vez.
- **Popup de LP**: "−500" / "+500" ao lado do LP por 1,2s, com o número contando até o valor novo.
- **Barra de fases** que abraça o conteúdo (sem chips cortados). A legenda passa a ser o **último evento** do duelo, no
  papel de narrador. **BREAKING (UX)**: o balão flutuante (toast) de eventos é removido.
- **Botões**:
  - botão lateral 64×60 com rótulo 11pt (BATALHA / MAIN 2 / FIM DO TURNO);
  - "Encerrar" compacto;
  - a bandeira sai e entra um **botão de menu** (44×40) com "Desistir" dentro.
- **Mão do oponente** com 24pt de largura por carta e verso de carta de verdade, sem listras.
- **Respiro**: margem lateral de 12, 6 entre blocos e um espaço flexível entre a placa do jogador e a mão.
- **Correção**: ATK/DEF "?" (valor −2 do motor) aparece como `?`, e não como `4294967294`.

## Capabilities

### New Capabilities

- `duel-hud`: layout, dimensionamento e conteúdo visual da tela de duelo, isto é:
  - campo e zonas;
  - face da carta;
  - placas dos duelistas;
  - barra de fases e narrador;
  - botões de ação e menu.

### Modified Capabilities

(nenhuma; ainda não há specs em `openspec/specs/`)

## Impact

- Código:
  - `src/screens/DuelScreen.tsx` (378 linhas) dividido por responsabilidade em `src/screens/duel/`, com testes de
    caracterização antes de mover;
  - a seção Duelo do `src/styles.css` vai para `duel.css`, sobre tokens com nome;
  - novo componente de face de carta em `src/components/`;
  - `src/data/` (nome em PT e formatação de ATK/DEF "?").
- Testes: Vitest + `happy-dom` + `@testing-library/react` (novas devDependencies, script `npm test`), e o novo
  `proto/layout-e2e.mjs`.
- Pipeline: `scripts/fetch_card_art.py` ganha a variante `cropped` (YGOPRODeck `cards_cropped`). O README documenta o
  passo novo.
- Assets:
  - fonte Chakra Petch Bold (OFL), versionada com a licença;
  - arte recortada (~20–30 MB), não versionada, em cache de tempo de execução no service worker.
- Alvo principal: o PWA instalado (tela cheia). No Safari com barras só a mão diminui; o campo mantém a largura.
- Telas fora do duelo (deck builder, loja) não mudam neste change.
