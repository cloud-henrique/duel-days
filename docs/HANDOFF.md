# Handoff — Duel Days

Documento para continuar o projeto numa sessão nova. Leia também o `CLAUDE.md` (arquitetura, comandos e armadilhas).

## Estado atual (funcionando)

- **Duelo** com o ocgcore oficial em WASM, num Worker: regras da era DM (modo MR1), CPU simples, pool de ~1.700 cartas
  (caixas de 2002–2005) com Extra Deck e fichas. Testado em massa (1.500 duelos CPU x CPU sem trava) e no **iPhone 11 Pro
  físico** (Safari e app instalado).
- **Interface do duelo** com as proporções do app nativo (change OpenSpec `polir-hud-duelo`): métricas derivadas da
  largura (`duel.css`), campo inclinado 22°, zonas M/A da altura das de monstro, um botão de fase só (sem atalho entre fases), **face própria da carta em português** com arte
  recortada, placas de 60 com contagem e "−500" no LP, barra de fases com o narrador (sem balão), botão de fase 64×60,
  menu com Desistir, mão em leque como no nativo. Testes de unidade (Vitest) e `proto/layout-e2e.mjs`.
- **Encenação do duelo** (change OpenSpec `animar-duelo`, arquivada):
  o motor devolve os acontecimentos (beats) e a tela os toca em ordem, inclusive no turno do oponente. Tem:
  - voo das cartas entre os lugares medidos no campo inclinado;
  - pilar de luz ao invocar/equipar, giro 3D ao virar, giro de 90° ao mudar de posição;
  - destaque de ativação com halo na cor do tipo e pilha da corrente (2+ elos);
  - ataque com recuo, avanço, flash e tremida; quebra na destruição; banimento; moeda e dado;
  - abertura (moeda, faixas, "DUELO!"; um toque pula) e fim ("VITÓRIA!"/"DERROTA"/"EMPATE").
  - Ajustes no menu do duelo: animações normal/rápida/desligada e som ligado/desligado (salvos no progresso). Um toque
    durante a encenação acelera. O "reduzir movimento" do sistema troca deslocamento/giro/quebra por fade.
  - **Sons** do Tag Force (via app nativo, `python3 scripts/copy_sounds.py`, fora do git), com Web Audio liberado no
    primeiro toque.
- **Visual base do nativo** (change OpenSpec `visual-base`, arquivada em 16/11/2026): tela de título (logo, "DUEL DAYS" metálico, orbe com o
  leque, Campanha/Continuar, Meu deck), boas-vindas e perfil (nome, 14 avatares genéricos, tratamento ele/ela/neutro,
  vitórias/derrotas/aproveitamento), ajustes; o jogador aparece com o próprio avatar (não mais o Yugi); DP no lugar de
  "moedas"; Chakra Petch nos números e títulos; ícones Phosphor por conceito; moeda e dado desenhados, com "Cara ou
  coroa?", "Você disse cara" e "Acertou!/Errou!"; "DUELO!"/"VITÓRIA!" em serifada itálica com degradê.
  Fundo de colmeia com circuito como o do nativo e brilho ciano no tabuleiro, nas placas e nos retratos; zonas de campo
  ao lado da barra de fases e a arte da Magia de Campo a 50% no tabuleiro (como no Tag Force).
- **Referência do nativo**: `docs/nativo/README.md` (índice; prints fora do git em `docs/nativo/prints/`).
- **Produção**: https://dueldays.pages.dev (Cloudflare Pages atrás do Access, só os e-mails da política "Amigos"); o
  envio é pelo `dist/` local (veja o `CLAUDE.md`).
- **Campanha Duel Monsters, Tier 1** (change OpenSpec `campanha-dm`), portada do app nativo, no lugar da história antiga:
  - 30 dias × manhã/tarde/noite (só o duelo gasta período); mapa de Domino (panorama do Tag Force, rola para os lados,
    tom por período) com Tristan, Tea, Joey, Bakura e o chefe Yugi (depois de vencer os 4);
  - encontro com as falas do nativo (`{nome}` e tratamento), conversa de 4 temas (uma por dia), laços de 4 corações com
    4 eventos por duelista (duelo obrigatório), escolha amizade/romance no 3º, carta do laço no 4º, tela de Laços;
  - economia do nativo: começa com 0 DP, o deck inicial de 40 e 3 LOB; vitória 300 DP + bônus (teto +50%), derrota 60;
    carta do deck do oponente por vitória e a assinatura na 10ª; loja (visual antigo) com LOB/MRD/MRL (dia 11)/PSV (dia 21),
    caixa de 20 e pacotes de personagem (5 vitórias);
  - decks dos oponentes do nativo; epílogo e tela de fim; "duelo interrompido" sem gastar o período;
  - música por tela (8 faixas do nativo, fora do git) com interruptor e volume.
  - O modelo é puro em `src/campaign/` (testes + `proto/story-smoke.ts`); conferência com `?campaign=last-evening|bond|boss`.
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

1. **Teste da campanha no iPhone físico** (uma semana de jogo, um evento de laço, a loja, a música) e arquivar o
   change `campanha-dm`.
2. **Loja e editor de deck** no padrão do nativo (balconista com falas do `dialogue.json`, detalhes do pacote, rasgar o
   pacote, deck em cima e maleta embaixo).
3. **CPU mais esperta** (heurísticas do WindBot sobre o ocgcore): os decks dos oponentes já são os do nativo.
4. **Encenações longas**: o `duel-e2e` com os decks da campanha mediu trechos contínuos de encenação de 9–12 s (turnos
   com muitas ações da CPU); o `monkey` também alerta turnos de mais de 15 s.
5. **Prompts que travam ou são automáticos**: auditar os pedidos do motor como o da Troca (carta anunciada, soma de
   ritual, escolha de zona).
6. **Offline completo**: botão "baixar toda a arte" (hoje a arte é guardada conforme vista).
7. PvP via relay (cada aparelho roda o próprio ocgcore com a mesma semente; só trafegam respostas).

## Limitações conhecidas

- ~0,4% dos turnos do oponente passam de 15 s de encenação na velocidade normal (máx. ~26 s); o toque para acelerar e a
  velocidade "rápida" cobrem. O `proto/monkey.ts` mede e avisa.
- ~0,5% dos duelos simulados ainda podem ter resposta rejeitada em casos raros; a UI reenvia o pedido ("Jogada inválida").
- No Safari (fora do app instalado), a barra flutuante cobre parte da mão; instalado na tela inicial fica em tela cheia.
- A folha da carta (zoom), o deck builder e a loja ainda usam a imagem oficial em inglês; o duelo usa a face própria em
  português. Arte recortada: `.venv/bin/python scripts/fetch_card_art.py cropped`.
