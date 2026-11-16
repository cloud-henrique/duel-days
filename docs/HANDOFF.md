# Handoff — Duel Days

Documento para continuar o projeto numa sessão nova. Leia também o `CLAUDE.md` (arquitetura, comandos e armadilhas).

## Estado atual (funcionando)

- **Duelo** com o ocgcore oficial em WASM, num Worker: regras da era DM (modo MR1), CPU simples, pool de ~1.700 cartas
  (caixas de 2002–2005) com Extra Deck e fichas. Testado em massa (1.500 duelos CPU x CPU sem trava) e no **iPhone 11 Pro
  físico** (Safari e app instalado).
- **Interface do duelo** com as proporções do app nativo (change OpenSpec `polir-hud-duelo`): métricas derivadas da
  largura (`duel.css`), campo inclinado 22°, zonas M/A em 0,78, **face própria da carta em português** com arte
  recortada, placas de 60 com contagem e "−500" no LP, barra de fases com o narrador (sem balão), botão de fase 64×60,
  menu com Desistir, mão em leque como no nativo. Testes de unidade (Vitest) e `proto/layout-e2e.mjs`.
- Próximo change planejado: `animar-duelo` (linha do tempo de eventos no motor + animações, sons, abertura/fim).
- **História**: mapa com 3 locais (Colégio Domino/Joey, Parque/Bakura, Kaiba Corp/Kaiba), corações de amizade (0–4),
  cenas `intro` → `bond` (4 corações) → `rematch`, nome do jogador (`{nome}`), botão Pular, save em IndexedDB.
- **Economia**: 300 moedas e 40 cartas iniciais; vitória +100, derrota +30; loja com pack de 5 cartas (1 rara garantida),
  resumo com selo NOVA e borda por raridade; deck builder (até 5 decks, filtros, regras reais).
- **Textos das cartas em português** (YGOPRODeck) para ~1.590 cartas; o resto cai para inglês.

## Ambiente em execução (pode não estar mais de pé)

- Preview do build: `npx vite preview --port 5181 --host 127.0.0.1` (com o middleware de logs `/__log`).
- Túnel temporário: `cloudflared tunnel --url http://127.0.0.1:5181` → URL `*.trycloudflare.com` (muda a cada execução).
  O usuário pediu para **manter o túnel por enquanto**; derrube (`pkill -f cloudflared`) só quando ele pedir.
- Depois de mudar código: `npx vite build` (o preview serve o `dist/` novo; o PWA se atualiza sozinho no celular).
- Logs do celular: abrir a URL com `?debug=1` → `/tmp/duel-days-device.log`. `?engine=inline` roda o motor sem Worker.
- Simulador de iOS: iPhone 17 Pro (`44D43819-C0DF-474A-9D03-C4881D4F9CDF`), Safari em `http://127.0.0.1:5181`.

## Referências do usuário

- Prints de UI de referência foram enviados (HUD azul, campo em perspectiva, folha da carta com arte + dados + ações,
  resumo de pack com NOVA, cena com local/corações/Pular). O app nativo dele em `/Users/cloudy/Projects/personal/duel-academy`
  (o "Duel Days" original, SwiftUI, motor próprio em Swift) é referência de **interface e de fluxo** (mapa, loja, abertura animada,
  editor de deck, histórico) — o motor de lá não é ocgcore.
- O usuário prefere ser consultado antes de decisões grandes ("faça perguntas antes se necessário") e usa pt-BR.

## Próximos passos sugeridos (em ordem)

1. **Hospedagem fixa com acesso protegido** (Cloudflare Pages + Cloudflare Access, ou similar) para os 4 amigos usarem
   sem o túnel. Os assets (~85 MB no `dist/`) não podem ficar públicos.
2. **Mais conteúdo da história**: mais personagens no mapa (há 44 com sprites/expressões em `public/characters`), mais
   cenas, fundos por local (hoje são degradês).
3. **Decks temáticos por oponente** (hoje são aleatórios por personagem, via `randomDeck(hash(id))`).
4. **Escolha manual de zona** e prompts que hoje são automáticos (anunciar carta/atributo, ordenar, soma de ritual).
5. **Animações** de invocação/ataque/dano e sons (referência: `DuelPresentation` do app nativo).
6. **Protagonista**: avatar próprio do jogador (hoje usa o do Yugi como provisório).
7. **Offline completo**: botão "baixar toda a arte" (hoje a arte é guardada conforme vista).
8. PvP via relay (cada aparelho roda o próprio ocgcore com a mesma semente; só trafegam respostas).

## Limitações conhecidas

- ~0,5% dos duelos simulados ainda podem ter resposta rejeitada em casos raros; a UI reenvia o pedido ("Jogada inválida").
- No Safari (fora do app instalado), a barra flutuante cobre parte da mão; instalado na tela inicial fica em tela cheia.
- A folha da carta (zoom), o deck builder e a loja ainda usam a imagem oficial em inglês; o duelo usa a face própria em
  português. Arte recortada: `.venv/bin/python scripts/fetch_card_art.py cropped`.
