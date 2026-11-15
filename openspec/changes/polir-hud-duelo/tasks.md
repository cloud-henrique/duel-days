# Tarefas

Regra deste change: **nenhuma mudança de comportamento sem um teste que a cubra antes**. Cada grupo traz os próprios testes.

## 1. Ferramentas de teste

- [x] 1.1 Adicionar Vitest, `happy-dom` e `@testing-library/react` (devDependencies), com o script `npm test` (`vitest run`). O ambiente é `node` por padrão e `happy-dom` por arquivo de componente. Verificar: um teste trivial passa, e `npm run build` continua com `tsc --noEmit`.
- [x] 1.2 Documentar `npm test` na seção Comandos do `CLAUDE.md`. Verificar: o comando roda como escrito.

## 2. Rede de segurança e divisão da DuelScreen (sem mudar comportamento)

- [x] 2.1 Capturar alguns prompts reais (IDLECMD, BATTLECMD, CHAIN, SELECT_CARD) com o `monkey.ts` como fixtures JSON em `src/screens/duel/__fixtures__/`. Verificar: as fixtures carregam no teste.
- [x] 2.2 Mover `cardActions`, `highlighted`, o mapa de fases e o cálculo dos botões laterais (hoje dentro do `useMemo` `side`) para `src/screens/duel/prompt.ts`, com testes de caracterização sobre as fixtures. Os testes descrevem o comportamento **atual**. Verificar: `npm test` passa e o `webkit-e2e.mjs` passa sem mudança.
- [x] 2.3 Extrair `useDuelEngine` (Worker ou inline, mensagens, watchdog, reinício), `Field`, `Hand`, `Plate` e os painéis para `src/screens/duel/`, e a seção Duelo do CSS para `duel.css`. A mudança é só de lugar. Verificar: `tsc`, `npm test`, `webkit-e2e.mjs` e `npx tsx proto/monkey.ts 100` passam, e um print do duelo antes e depois sai igual.
- [x] 2.4 Trocar números soltos por constantes com nome (tempos do destaque, do watchdog, do popup) e máscaras cruas por `OcgType`/`OcgPhase`. Verificar: `grep` sem `& 2` / `& 4` de tipo em `src/screens/duel/`, e os testes do 2.2 continuam passando.

## 3. Assets e pipeline

- [x] 3.1 Adicionar a variante `cropped` (`cards_cropped`, 256px, WebP ~68) e o download do verso (`public/cards/back.webp`) em `scripts/fetch_card_art.py`, sem duplicar o laço de download (a variante entra na tabela `VARIANTS`). Verificar: rodar o script, conferir que `public/cards/cropped/` tem ~1.700 arquivos e que as cartas que faltam são listadas.
- [x] 3.2 Documentar o passo novo no README e no `CLAUDE.md`. Verificar: o comando documentado roda como escrito.
- [x] 3.3 Converter Chakra Petch Bold para `public/fonts/ChakraPetch-Bold.woff2` (com `OFL.txt`) e declarar o `@font-face` (`font-display: swap`). Verificar: o `dist/` tem a fonte na pré-carga e o `git status` não mostra material da Konami.

## 4. Métricas e layout

- [x] 4.1 Escrever o `proto/layout-e2e.mjs` (WebKit em 360×780, 390×844, 390×709 e 430×932). Ele mede o campo, as zonas, a proporção M/A, a faixa central, a carta da mão, os chips e o overflow, com as tolerâncias da spec `duel-hud`. Verificar: ele **falha** no layout atual (prova que mede o problema).
- [x] 4.2 Declarar os tokens e as métricas derivadas no topo de `duel.css` (`container-type: size`, `cqw`/`cqh`, design item 1) e remover a fórmula com `dvh`. Verificar: no `layout-e2e.mjs`, as medidas do campo e da mão passam nos 4 viewports.
- [x] 4.3 Fileiras com as alturas do design: monstro, M/A em 0,78 e centro 46, com as cores e o tracejado do nativo como tokens e a inclinação de 22° numa constante. Verificar: os itens de proporção do `layout-e2e.mjs` passam, e um print lado a lado com o nativo.
- [x] 4.4 Respiro: margem de 12, gap de 6 e espaço flexível entre a placa e a mão. Verificar: o item "Respiro" do `layout-e2e.mjs` passa.

## 5. Face própria da carta

- [x] 5.1 Escrever um teste que reproduz o `4294967294` (retrato do narrador com uma carta de ATK "?"), corrigir a conversão na origem e criar `formatStat` em `labels.ts` com testes (−2, 0x7fffffff, 4294967294, 0, 2500). Usar `formatStat` na folha. Verificar: `npm test` passa e a folha do Tyranno Infinity mostra `ATK ?`.
- [x] 5.2 Criar `frameOf(card)` (cor da moldura pelo tipo, reusando `isMonster` e os rótulos de `labels.ts`), com um teste por tipo. Verificar: `npm test`.
- [x] 5.3 Criar o `CardFace` (`compact`/`full`, escalado por `--w`, frações nomeadas), com testes de componente:
  - nome em PT;
  - tarja de monstro, magia e armadilha;
  - `?` no ATK;
  - fallback da arte com `onError`.

  Verificar: `npm test`, e uma página de teste com os 20 nomes mais longos do pool nas larguras 24, 61 e 91 sem nada saindo da moldura.
- [x] 5.4 Usar o `CardFace` na mão, no campo (altura total da zona, defesa a 90° com selos em pé, selo de 10pt) e no destaque de ativação; versos com `back.webp`. Verificar: os cenários "Carta no campo ocupa a zona" e "Mão do oponente" no navegador, e o `webkit-e2e.mjs` passa.
- [ ] 5.5 Medir o desempenho no iPhone 11 Pro físico (pelo túnel) com o campo cheio e 7 cartas na mão. Verificar: sem travadas perceptíveis, com as anotações no PR.

## 6. Placas, barra de fases e botões

- [x] 6.1 Criar `lpTween` e `lpTone` (puras) com testes, e reescrever a `Plate` com as medidas do design (item 7) usando essas funções. Testes de componente:
  - popup de dano e de cura;
  - borda ativa;
  - cemitério vazio e cheio.

  Verificar: `npm test`, e no navegador a altura da placa ~60 e o layout sem deslocamento ao tomar dano.
- [x] 6.2 Criar `phaseChips` (pura, em `prompt.ts`) com teste por fase, e a `PhaseBar` (largura pelo conteúdo, narrador) com teste de componente. Remover o toast e ajustar o `webkit-e2e.mjs`, se ele dependia do toast. Verificar: `npm test`, o item de chips do `layout-e2e.mjs` em 360 e o cenário "Novo evento".
- [x] 6.3 Botão lateral 64×60 e "Encerrar" compacto: atualizar os testes de caracterização do 2.2 para os rótulos novos (a mudança de comportamento é deliberada e coberta). Verificar: `npm test` e o cenário "Main Phase 1 com batalha disponível".
- [x] 6.4 Criar o `DuelMenu` (44×40, folha com `Backdrop` e confirmação do Desistir) e remover a bandeira. Teste de componente: Desistir pede confirmação e tocar fora fecha. Verificar: `npm test` e um duelo desistido pelo menu terminando em derrota.

## 7. Integração

- [x] 7.1 Rodar `npx tsc --noEmit`, `npm test`, `npx tsx proto/monkey.ts 100`, `node proto/webkit-e2e.mjs` e `node proto/layout-e2e.mjs`. Verificar: todos passam.
- [ ] 7.2 Testar no simulador de iOS (Safari e app instalado) e no iPhone físico pelo túnel. Verificar: prints dos cenários da spec `duel-hud` anexados ao PR.
- [x] 7.3 Atualizar o `docs/HANDOFF.md` (imagens em PT, toast removido, arte recortada) e o `CLAUDE.md` (estrutura de `src/screens/duel/`, testes). Verificar: as seções refletem o código.

## 8. Ajustes do primeiro teste no iPhone

- [x] 8.1 Corrigir subtipos de Magia/Armadilha (bits trocados: Contínua aparecia como Rápida/Contra-Ataque, Campo como Equipamento) com os nomes do Manual Oficial. Teste em `labels.test.ts`.
- [x] 8.2 Folha da carta compacta como o `CardDetails` do nativo: X sem moldura no canto, ATK/DEF numa linha, atributo + tipo numa linha menor com os ícones oficiais (`scripts/copy_card_icons.py`), botões menores. Teste em `CardSheet.test.tsx`.
- [x] 8.3 "Ativar" sempre primeiro nas ações da carta. Teste em `prompt.test.ts`.
- [x] 8.4 Texto da carta em `ui-serif` black (New York, como o nativo); PhaseBar na largura toda da faixa central; painéis de resposta menores; Phosphor (`@phosphor-icons/react`) para os ícones de interface.
- [x] 8.5 Ícone e texto na mesma linha nos botões de ação; hambúrguer (Phosphor `List`) centralizado no menu (o padding do `.hud-btn` sobrescrevia o do menu).
- [x] 8.6 Ordenar cartas (SORT_CARD, ex.: Classificar Livro de Magia): painel com arrastar e setas; patch no `ocgcore-wasm` (byte de tamanho a mais na resposta). Testes em `sort.test.ts` e `SortCards.test.tsx`; conferência no motor em `proto/sort-check.ts`.
- [x] 8.7 Tocar de novo na carta aberta fecha a folha.
- [x] 8.8 "Ver campo" em todos os painéis de resposta e escolha; no lugar do painel, a barra "Só olhando" (PeekBar do nativo). O painel fica escondido sem desmontar, então guarda o que estava marcado ou ordenado.
- [x] 8.9 Escolha de cartas como no nativo (`choice.ts`, `ChoicePanels.tsx`): com tudo no campo ou na mão, barra compacta (carta que age, título, dica, contador) e toque nas cartas que brilham (alvo de ataque em vermelho); com cartas fora do campo, fileira de cartas com a origem. Testes em `choice.test.ts`; conferência visual em dev com `?choices`.

## Workflow follow-up

- Arquivar o change depois da revisão e do teste no iPhone.
- Depois, implementar o change `animar-duelo`, que depende do `CardFace`, da divisão da `DuelScreen` e do Vitest.
