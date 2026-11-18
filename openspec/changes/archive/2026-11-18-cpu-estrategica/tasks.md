# Tasks

## 1. Registro e cópia do duelo

- [x] 1.1 Registrar no `DuelDriver` a semente, os decks e todas as respostas enviadas ao motor (jogador, automáticas e CPU) e verificar com um teste que o registro tem uma entrada por `respond`
- [x] 1.2 Criar a cópia por replay (`startDuel` com a mesma semente + reaplicar o registro, destruída num `finally`) e verificar com um teste que o retrato do tabuleiro da cópia é igual ao do duelo original em vários pontos de um duelo do `monkey`
- [x] 1.3 Criar o ajudante de quebra-cabeça para testes (duelo com cartas já no campo, na mão e viradas, pedindo uma decisão) e verificar com um teste que o retrato mostra as cartas nas zonas pedidas

## 2. Política barata

- [x] 2.1 Reescrever o `cpuRespond` como política barata determinística (sem `rng`): invocar/baixar, atacar só quando vence, ataque direto, alvo do lado certo, correntes com gatilho; verificar com quebra-cabeças dos cenários "Ataque que vence", "Não ataca para perder", "Ataque direto" e "Equipamento que fortalece"
- [x] 2.2 Rodar `npx tsx proto/smoke.ts 200` e `npx tsx proto/monkey.ts 20` só com a política barata e verificar zero erros, zero laços e o último retrato batendo

## 3. Avaliação e busca

- [x] 3.1 Criar a avaliação do tabuleiro com os pesos num único objeto e a leitura pública do lado do jogador (perfil comum) ou completa (chefe); verificar com testes que a vitória vale +infinito, que mais LP e mais força dão nota maior e que, no perfil comum, trocar uma virada do jogador por outra carta não muda a nota
- [x] 3.2 Criar a busca de um nível (candidatas pelo prior, cópia, continuação até o fim do turno/corrente, avaliação, orçamento por simulações e por ms, uma opção só responde direto) e verificar com quebra-cabeças os cenários "Mão cheia", "Efeito que destrói" e "Campo já ativo"
- [x] 3.3 Implementar a honestidade dos comuns nas continuações (o jogador nunca responde, prompt obrigatório dele com resposta neutra) e o lado do jogador com a política barata no chefe; verificar com o quebra-cabeça "Mesma jogada com mãos diferentes" (comum) e "Armadilha virada conhecida" (chefe)
- [x] 3.4 Ligar a busca ao `DuelDriver` para o jogador 1, mantendo a política barata nos prompts automáticos do jogador 0, e verificar com `npx tsx proto/monkey.ts 10` (com busca) zero erros e o último retrato batendo depois das buscas

## 4. Perfil e tempo no app

- [x] 4.1 Acrescentar `cpu: 'comum' | 'chefe'` à mensagem `start` (padrão `comum`), passando `chefe` quando o oponente da campanha tem `isBoss`, e verificar com um teste que o duelo contra Yugi e Pegasus começa com o perfil de chefe e um duelo sem campanha com o comum
- [x] 4.2 Tirar o tempo de pensamento do `MAX_MS` do `run()` e ajustar o vigia do `useDuelEngine` ao teto do perfil; verificar com `node proto/duel-e2e.mjs` que um duelo inteiro termina sem erro de laço nem de vigia
- [x] 4.3 Medir no simulador de iOS (e, se possível, no iPhone pelo túnel com `?debug=1`) quantas cópias cabem por decisão e o tempo máximo de uma decisão, e verificar que fica dentro de cerca de 1 s (comum) e 2 s (chefe) com a tela respondendo a toques durante o turno da CPU
- [x] 4.4 Atualizar o `CLAUDE.md` (arquitetura de `src/engine/`: busca, avaliação, política barata, perfil; armadilha do vigia) e verificar que os comandos citados rodam como escritos

## 5. Medida de dificuldade e decks

- [x] 5.1 Criar `proto/difficulty.ts` (cada duelista contra o deck inicial, trocando quem começa, orçamento por simulações, vários processos) com o relatório de taxa, meta do tier e quem está fora por mais de 10 pontos; verificar rodando com poucos duelos e conferindo o relatório
- [x] 5.2 Passar o `proto/deck-pick.ts` para a CPU nova (cada candidata contra o deck inicial, orçamento reduzido) e dar a `smoke`/`monkey`/`tier-balance` a opção de política barata ou busca; verificar rodando cada um com poucos duelos
- [x] 5.3 Refazer o torneio (`npx tsx proto/deck-pick.ts` → `python3 scripts/build_decks.py`), regenerar o `decks.json` e verificar que `npx tsx proto/economy-smoke.ts` continua com os decks válidos
- [x] 5.4 Calibrar os pesos da avaliação e, se preciso, trocar receitas ou ajustar o `REPLACE` do `build_decks.py` até cada duelista ficar a no máximo 10 pontos da meta (T1 ~55%, T2 ~70%, chefes ~85%) e o chefe vencer a maioria contra os comuns do tier (`proto/tier-balance.ts`); guardar o relatório final do `difficulty.ts` no README dos decks

## 6. Integração

- [x] 6.1 Rodar `npx tsc --noEmit`, `npm test`, `npx vite build` e `node proto/webkit-e2e.mjs`, e jogar um duelo contra um comum do Tier 1 e um contra o chefe no simulador de iOS, verificando que a CPU ataca, equipa os próprios monstros e não ativa cartas inúteis

## Workflow follow-up

- Arquivar a change depois de revisada (`/opsx:archive`), sincronizando a spec nova `cpu-do-duelo` e o requisito alterado da `campanha`.
