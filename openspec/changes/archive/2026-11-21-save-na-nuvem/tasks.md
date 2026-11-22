# Tasks

## 1. Infra do servidor (D1 e Pages Functions)

- [x] 1.1 Criar o banco D1 `dueldays-saves` na conta do `dueldays` (`npx wrangler d1 create dueldays-saves`) e um
  `wrangler.toml` na raiz com `pages_build_output_dir = "dist"` e o `[[d1_databases]]` (binding `DB`); verificar com
  `npx wrangler d1 list` que o banco aparece
- [x] 1.2 Escrever a migração `migrations/0001_saves.sql` com as tabelas `saves` (email PK, rev, version, data nulo para
  lápide, device, updated_at) e `save_history` (PK email+rev), aplicar local e remoto (`wrangler d1 migrations apply`) e
  verificar as tabelas com `wrangler d1 execute --command "select name from sqlite_master"`
- [x] 1.3 Gravar o `aud` da aplicação "Duel Days" (`cf zero-trust access applications list`) e o domínio da equipe
  (`auth_domain` do `cf zero-trust organization get`) como variáveis do projeto do Pages (`ACCESS_AUD`, `ACCESS_TEAM`);
  verificar com `npx wrangler pages project list`/painel que estão no ambiente de produção
- [x] 1.4 Instalar `jose` como dependência e confirmar que `npx tsc --noEmit` segue passando, com `server/` e
  `functions/` no `tsconfig` da raiz (o contrato do D1 é uma interface própria em `server/d1.ts`, sem os tipos do Workers)

## 2. A função `/api/save`

- [x] 2.1 Validar a identidade em `functions/api/_auth.ts`: JWT do `Cf-Access-Jwt-Assertion` contra o JWKS da equipe e o
  `aud`, e-mail em minúsculas; `DEV_EMAIL` aceito só com `localhost`. Testes: token válido, assinatura errada, `aud`
  errado, sem token (401), `DEV_EMAIL` recusado fora de `localhost`
- [x] 2.2 Implementar `GET /api/save` (200 com rev, version, data, device, updatedAt; 404 sem linha) e verificar por
  teste com um D1 em memória que cada e-mail só lê a própria linha
- [x] 2.3 Implementar `PUT /api/save` com gravação condicional por `baseRev` (200 com a nova `rev`; 409 com a cópia do
  servidor), cópia da linha anterior para o `save_history` mantendo as 10 últimas, e 413 acima de 1 MB; testes: primeiro
  envio com baseRev 0, envio em sequência, dois envios com a mesma baseRev (o segundo recebe 409), histórico podado em 10
- [x] 2.4 Implementar `DELETE /api/save` como lápide (data nulo, rev nova, anterior no histórico, 409 com baseRev
  velha) e verificar por teste que um `GET` depois devolve a lápide
- [x] 2.5 Garantir `Cache-Control: no-store` em toda resposta da função e verificar no teste

## 3. Estado local da sincronização

- [x] 3.1 Em `src/story/progress.ts`, guardar junto do registro do Dexie o `baseRev`, o `dirty` e o `seq` (campos sem
  índice, então sem versão nova do schema: registros antigos leem como baseRev 0 e pendente); `writeProgress` marca
  `dirty`; o rótulo do aparelho sai do `userAgent` a cada envio (sem `deviceId`, que nada usava); testes em
  `localSave.test.ts` de que um save antigo abre com esses padrões e de que gravar marca `dirty`
- [x] 3.2 Fazer o `migrate` não descartar uma campanha de `CAMPAIGN_VERSION` maior que a do app (só a de versão menor) e
  cobrir com teste nos dois sentidos, atualizando o requisito "Save da campanha" já coberto pela spec
- [x] 3.3 Rótulo do aparelho a partir do `navigator.userAgent` ("iPhone", "iPad", "Android", "Mac", "Windows", outro) com
  teste das strings de cada um

## 4. Reconciliação pura

- [x] 4.1 Escrever `reconcile(local, remoto, appVersion)` em `src/story/sync.ts` devolvendo enviar, puxar, nada,
  conflito, apagar local ou parar (versão nova), conforme a árvore do design; testes de cada caso, incluindo sem local,
  remoto 404, lápide com local limpo e com local `dirty`, e versão remota maior
- [x] 4.2 Escrever o resumo de um lado do conflito (dia e período, DP, vitórias, tamanho da coleção, aparelho e hora) como
  função pura sobre o `Progress`, com teste usando um save de campanha real do `debug.ts`

## 5. Cliente da sincronização

- [x] 5.1 Escrever o cliente HTTP (`get`, `put`, `delete`) com `credentials: 'include'`, `redirect: 'manual'` e
  `cache: 'no-store'`, mapeando rede fora → pendente, `opaqueredirect`/401 → sessão vencida, 404 de rota em dev → local;
  testes com `fetch` falso para cada mapeamento
- [x] 5.2 Escrever o motor da sincronização (estado observável para a UI): envio com espera de 2 s depois de cada
  `writeProgress`, envio imediato com `keepalive` no `visibilitychange` → `hidden`, reconciliação no `online` e na volta
  ao primeiro plano, 409 refaz a reconciliação; testes com relógio falso de que três gravações seguidas viram um envio
- [x] 5.3 Desligar a sincronização com `?sync=off` ou com uma campanha de depuração ativa (`src/campaign/debug.ts`) e
  verificar por teste que nenhum `fetch` acontece nesses casos e o estado é "desligada"
- [x] 5.4 Excluir `/api/` do service worker (`navigateFallbackDenylist` no `vite.config.ts`, nenhuma regra de
  `runtimeCaching`) e verificar no `dist/sw.js` gerado pelo `npx vite build` que `/api/` está na lista de exclusão

## 6. Abertura e troca do save no app

- [x] 6.1 No `App.tsx`, abrir lendo o local e reconciliando antes de liberar a campanha no título, com teto de ~3 s e
  "Sincronizando…" no botão principal; verificado no teste de tela do `TitleScreen` (`syncing` trava e libera) e na
  ponta a ponta local com o `wrangler pages dev` (o título abre com o save da conta)
- [x] 6.2 Aparelho sem save local e conta com save: abrir o título com o save da conta, sem boas-vindas; sem rede, abrir
  as boas-vindas; verificado na ponta a ponta local (IndexedDB apagado, o título abre com o perfil da conta) e no
  `syncEngine.test.ts` (o notebook traz o save na abertura)
- [x] 6.3 Volta do segundo plano com nuvem mais nova e local limpo: fora do duelo, trocar o save e ir ao título com o
  aviso "Progresso atualizado de outro aparelho"; no duelo, esperar o fim; verificado na ponta a ponta local (evento
  `online` com a nuvem gravada por outro aparelho: aviso e "Dia 5 · Tarde" no título) e no `syncEngine.test.ts`
  ("durante o duelo não troca o save")
- [x] 6.4 "Apagar progresso" no perfil: confirmação dizendo que vale para todos os aparelhos, apagar local e mandar a
  lápide (pendente se offline); teste de tela do texto da confirmação e de que a lápide fica pendente sem rede

## 7. Telas de conflito e indicador

- [x] 7.1 Tela de conflito no visual do jogo (`Modal`, `.hud-btn`, `Dp` para o saldo, sem caractere fazendo papel de
  ícone): os dois lados com o resumo, "Ficar com a nuvem" e "Ficar com este aparelho", e o caso "apagado em outro
  aparelho"; testes de tela de cada escolha (a escolhida vira o save; a outra é enviada para o histórico)
- [x] 7.2 Ícone de nuvem e os estados no `GAME_ICONS` (`src/ui/icons.tsx`), um conceito por ícone; verificar no teste dos
  ícones
- [x] 7.3 Indicador no título e no mapa (retrato e tela larga, pelo `useWide`), com texto curto por estado e, ao tocar, o
  estado por extenso, a hora da última sincronização e "Entrar" quando a sessão venceu (recarrega só no toque); testes de
  tela dos estados (`src/screens/sync/sync.test.tsx`) e conferência no navegador em 375×812 e 1440×900
- [x] 7.4 Conferir contraste dos textos do indicador (4,5:1, `--cyan-text` em vez do `--c-cyan`) e rodar o
  `src/ui/palette.test.ts`

## 8. Documentação

- [x] 8.1 Atualizar o CLAUDE.md: a exceção ao "sem backend" (`functions/`, D1, `wrangler.toml`), o deploy que agora leva
  as funções, como testar em dev (`npx vite build && npx wrangler pages dev dist` com `DEV_EMAIL`, `?sync=off`), a
  armadilha das campanhas de depuração e o comando para devolver uma versão do `save_history`; verificar que os comandos
  rodam como escritos

## 9. Integração

- [x] 9.1 Rodar `npx tsc --noEmit`, `npm test` e `npx vite build` sem erros
- [ ] 9.2 Ponta a ponta local com `wrangler pages dev` e dois navegadores (Chromium e WebKit) com o mesmo `DEV_EMAIL`:
  jogar num, abrir o outro e ver o mesmo dia; jogar nos dois offline (rede desligada no DevTools) e ver a escolha;
  apagar num e ver as boas-vindas no outro
- [ ] 9.3 Deploy em produção e conferir com o seu e-mail no iPhone (PWA instalado) e no notebook: progresso indo e
  voltando, modo avião no iPhone jogando normalmente e enviando ao voltar a rede, e a sessão do Access vencida mostrando
  "Entrar"

## Workflow follow-up

- Incluir na política "Amigos" do Access o e-mail de cada amigo que ainda não está lá, para ele entrar e ter save na
  conta.
- Arquivar a change depois da conferência em produção.
