# Tasks

## 1. Deuses Egípcios na base e no motor (spike)

- [x] 1.1 `raw/import/incluir.json` com 10000000, 10000010 e 10000020. Depois rodar `import_dm.py` e `export_data.py`.
      Verificar: os três estão no `public/data/cards.json` e no `public/scripts.json`; o `raw/import/report.md` os lista como
      incluídos à mão; nenhum `boosters.json` os contém.
- [x] 1.2 Nome e texto em português dos três no `raw/overrides/text.pt.json` ("Obelisco, o Atormentador", "Slifer, o
      Dragão Celeste", "O Dragão Alado de Rá") e arte pelo `fetch_card_art.py`. Verificar: `?cardfaces` em dev mostra as três
      faces em português, com arte.
- [x] 1.3 `LIMITED` do `src/game/decks.ts` com os três. Verificar: teste de `decks` recusa um segundo Obelisco com o
      motivo de limitada, e teste do sorteio de vitória nunca devolve um Deus.
- [x] 1.4 Quebra-cabeças em `src/engine/__testing__/duel.ts` para cada Deus no formato Speed: invocação com 3 tributos;
      efeito do Obelisk tributando 2; ATK do Slifer pela mão; pagamento de LP do Ra. A CPU (busca) decide em cada um.
      Verificar: os testes passam sem erro de Lua, sem RETRY em laço e dentro do tempo de pensamento.
- [x] 1.5 `npx tsx proto/smoke.ts 300` com os Deuses forçados nos decks aleatórios, corrigindo travas no `alternatives`
      do `cpu.ts` ou na política barata. Verificar: 0 travas, 0 laços e 0 erros de Lua no relatório. Se um Deus não tiver
      saída, parar e consultar o usuário antes de trocá-lo.

## 2. Modelo do duelo final e do último tier

- [x] 2.1 `DuelistData.isFinal` opcional; no `tiers.ts`, `regularsOf` sem o final, `finalOf` e `isFinalAvailable`
      (chefe do tier vencido); `cpuFor` devolve `chefe` para o final. Verificar: testes de `tiers` (o final fora do
      "X/N vencidos" e do `tierCleared`) e de `decks.cpuFor`.
- [x] 2.2 `champion?: { day, scene }` no `CampaignState`, mais `rewards.ts` com assinatura na 1ª vitória do `isFinal` e
      gravação do `champion` na primeira vitória sobre ele. Verificar: testes de `rewards` cobrindo o Slifer na 1ª, nada na
      5ª, e o `champion` gravado uma vez só; um save sem `champion` continua carregando (`progress` / `migrate`).
- [x] 2.3 `calendar.awaitsNextUpdate` sem aviso no último tier, e `map.tierProgress` com "Final · vença Yami Yugi" e
      "Campeão". Verificar: testes de `calendar` e `map` nos três estados (antes do Yami Marik, depois dele, campeão).
- [x] 2.4 `map.present` com o final depois do chefe do tier, e `RING` para quatro anéis valendo só com o tier atual = 4.
      Verificar: teste do pior caso (22 cabeças, várias sementes), com a menor distância ≥ `MIN_GAP` (ou a regra do anel
      externo do design) e os chefes antigos no anel do tier deles; os testes do mapa no T2 e no T3 continuam iguais.

## 3. Dados, falas e cena de campeão

- [x] 3.1 `tiers.json` com o Tier 4: AST no offset 0, SOD no offset 2, `packNames` e os seis duelistas (tabela da
      Decisão 6), com o Yami Yugi `isFinal`. Verificar: `data.test.ts` com o T4 (cenas cujo fundo existe, assinaturas, um
      único `isFinal`).
- [x] 3.2 `dialogue-tier4.json` com as falas dos seis (primeiro encontro, encontros seguintes, antes do duelo, vitória
      e derrota do jogador; `bossIntro`/`bossDefeat` do Yami Marik e do Yami Yugi) e o `champion` com `joey`, `tea`,
      `tristan`, `bakura`, `yugi` e `generic`. Verificar: `data.test.ts` com todos os momentos, as 6 cenas e `{nome}`/`{m|f|n}`
      válidos; a fala de vitória só cita o Slifer no `isFinal`.
- [x] 3.3 `copy_campaign_data.py` juntando o `champion` e falhando se faltar alguma cena; regerar o `campaign.json`.
      Verificar: rodar o script sem o `generic` falha com mensagem clara, e com ele completo passa.
- [x] 3.4 `championScene(s)` em `bond.ts` (pelo `epilogueDuelist`, ou `generic`). Verificar: teste com Joey em primeiro,
      com empate decidido pela afinidade e sem nenhum evento.
- [x] 3.5 `chars.ts` com as seis chaves (sprite e cor de fala). Verificar: o retrato de cada um aparece numa cena em dev,
      e uma expressão ausente cai para a neutra.

## 4. Loja

- [x] 4.1 `packs.json` com AST e SOD (do `boosters.json`), mais `ast`/`sod` a 350 DP no `BALANCE.packPrices`. Verificar:
      testes de `packs` (T4 na vitrine com "depois de vencer Kaiba"; AST no dia de abertura; SOD 2 dias depois) e
      `npx tsx proto/economy-smoke.ts` com as raridades 70/20/10 das duas.
- [x] 4.2 Capas `pack-ast`/`pack-sod` pelo `copy_campaign_assets.py`, se existirem no nativo. Verificar: a vitrine mostra
      a capa ou a reserva desenhada, sem imagem quebrada.

## 5. Decks do Tier 4

- [x] 5.1 `fetch_deck_recipes.py` com os seis personagens e os filtros de nome do design. Verificar: o
      `raw/decks/candidates.json` tem candidatas para os seis; quem não tiver nenhuma com ≥ 85% no pool fica anotado.
- [x] 5.2 Metas no `proto/difficulty-target.ts` (`4: 0.82`, final 0,90) e torneio com o `deck-pick.ts`. Verificar: o
      relatório mostra a taxa de cada candidata e a vencedora de cada um.
- [x] 5.3 `build_decks.py` com o `KEEP` do Deus de cada dono (Marik: Obelisk; Yami Marik: Ra; Yami Yugi: Slifer) e as
      trocas comentadas no `REPLACE`/`TUNE`, gerando o `decks.json`. Verificar: teste de validação de todos os decks
      (formato e Deuses limitados), com a assinatura dentro do deck do dono.
- [x] 5.4 `npx tsx proto/difficulty.ts 40` e `npx tsx proto/tier-balance.ts 12`. Verificar: cada um do T4 a até 10
      pontos da meta; o Yami Marik vence a maioria dos comuns do T4; o Yami Yugi vence a maioria contra o Yami Marik. Se
      algum Deus nunca sair nos duelos medidos, ajustar o `TUNE` (Decisão "três tributos" dos riscos).
      Resultado (4 rodadas de `TUNE`): os seis a até 10 pontos da meta. Dentro do tier, o Yami Marik ficou em 47% contra
      os comuns e o Yami Yugi em 44% contra o Yami Marik (16 duelos por par, ±12 pontos): aceito pelo usuário.
- [x] 5.5 `npx tsx proto/monkey.ts 100` com os decks da campanha. Verificar: 0 travas e 0 erros.

## 6. Telas

- [x] 6.1 Fim do duelo contra o Yami Yugi: fala de derrota e, na primeira vitória, a cena de campeão no `Dialogue` com o
      fundo `arena-torre`, voltando ao mapa no período seguinte. Verificar: com `?campaign=final` em dev, vencer o duelo toca
      a cena do amigo certo; a segunda vitória não toca a cena.
      Resultado: `src/app.test.tsx` percorre o App de verdade (título → mapa → Yami Yugi → vitória → derrota dele → cena
      do Joey → mapa com o título), com o duelo trocado por uma vitória; desligar a cena no App faz o teste falhar.
- [x] 6.2 `StatusScreen` e `CampaignEnd` com o título de campeão (dia) e "Rever cena de campeão" pela `champion.scene`.
      Verificar: teste de tela (o botão só aparece com o `champion`) e, em dev, a versão revista é a mesma que tocou.
- [x] 6.3 `MapScreen` sem o aviso de atualização no T4 e com o progresso do final. Verificar: no viewport de celular, com
      `?campaign=final`, o cabeçalho mostra "4/4 vencidos" e o progresso aponta o Yami Yugi.

## 7. Depuração e fumaça

- [x] 7.1 Presets `?campaign=tier4`, `yamimarik` e `final` no `debug.ts`. Verificar: testes de `debug` com o tier atual,
      quem está liberado e o DP de cada preset.
- [x] 7.2 `story-smoke.ts` contando o T4 aberto, o Yami Marik vencido, o campeão e a distribuição das cenas de campeão.
      Verificar: `npx tsx proto/story-smoke.ts` passa, e as rotas e os epílogos do T1 continuam alcançados.

## 8. Integração

- [x] 8.1 `npx tsc --noEmit`, `npm test` e `npx vite build`. Verificar: tudo verde.
- [x] 8.2 Conferência no navegador (viewport de celular) e no simulador de iOS: mapa cheio no T4 (`?campaign=final`),
      encontro de cada duelista do T4, duelo com um Deus em campo e cena de campeão. Verificar: screenshots sem cabeças
      sobrepostas, retratos corretos e nenhum erro no console.
      Resultado: no Safari do simulador (iPhone 17 Pro), mapa cheio sem sobreposição, encontro e entrada de chefe do Yami
      Yugi, duelo no Worker com o deck dele (6 turnos), derrota e volta ao mapa. Nenhum Deus chegou ao campo nesses turnos:
      os Deuses no motor estão cobertos pelo `gods.test.ts` e pelo `smoke.ts --deuses`.
- [x] 8.3 `openspec validate tier4-finais --strict` e CLAUDE.md atualizado (Tier 4 na arquitetura da campanha, Deuses no
      pool como exceção, presets novos). Verificar: o validador passa.

## Workflow follow-up

- Deploy pelo `wrangler` depois do push (comando do CLAUDE.md), com a base e a arte dos Deuses geradas localmente.
- Arquivar a change depois da conferência no celular.
