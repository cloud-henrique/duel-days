# Proposal

## Why

O save mora só no IndexedDB de cada aparelho: quem joga no celular e abre o notebook começa do zero, e um cache apagado
pelo iOS ou um celular trocado leva a campanha junto. Os amigos já entram no jogo pelo Cloudflare Access (código por
e-mail), então o jogo já sabe quem é cada um; falta guardar o save numa conta e continuar de qualquer aparelho, sem
perder o jogo offline que é a razão de ser um PWA.

## What Changes

- Cada jogador ganha um **save na nuvem**, ligado ao e-mail com que entra pelo Cloudflare Access. Nenhum login novo,
  nenhuma conta do Google.
- O **aparelho continua sendo a fonte durante o jogo**: tudo grava primeiro no IndexedDB, e o jogo inteiro (campanha,
  duelo, loja, editor) funciona offline como hoje. O envio para a nuvem acontece depois, quando houver rede e sessão.
- Ao abrir o app, ao voltar do segundo plano e ao voltar a ter rede, o app **compara** o save do aparelho com o da
  nuvem: puxa o mais novo, envia o que ficou pendente e, quando os dois andaram separados, **pergunta qual manter**,
  mostrando um resumo de cada um. Nada se perde calado.
- Um aparelho novo, com save na nuvem, **pula as boas-vindas** e abre o título com o perfil e a campanha da conta.
- Um **indicador discreto** mostra o estado: sincronizado, pendente (offline), sessão do Access vencida ("entre de novo
  para sincronizar") ou conflito.
- A nuvem guarda as **últimas versões** do save de cada jogador, para o administrador desfazer uma escolha errada no
  conflito ou um "Apagar progresso" por engano.
- **Tudo vai para a conta**: perfil, estatísticas, campanha e também os **ajustes** (animação, som, música, volume), que
  deixam de ser só do aparelho.
- "Apagar progresso" apaga o save **em todos os aparelhos** (a confirmação diz isso).
- Um aparelho com o app desatualizado **não sobrescreve nem descarta** um save feito por uma versão mais nova.
- **Primeiro backend do projeto**: uma Pages Function (`/api/save`) no mesmo deploy do `wrangler`, com um banco D1. O
  "sem backend" do projeto passa a ter essa única exceção.

## Capabilities

### New Capabilities

- `save-na-nuvem`: a conta do jogador (identidade pelo Cloudflare Access), o save guardado no servidor, a sincronização
  com o save do aparelho (quando envia, quando puxa, conflitos, versões), o funcionamento offline e o indicador de estado.

### Modified Capabilities

- `campanha`: o requisito "Save da campanha" passa a valer também para a nuvem (salvo no aparelho a cada mudança e
  enviado à conta quando possível; uma campanha de versão mais nova não é descartada).
- `perfil-do-jogador`: "Boas-vindas na primeira abertura" passa a olhar também a nuvem: sem save no aparelho, mas com
  save na conta, o app abre o título com esse save em vez das boas-vindas.
- `tela-de-titulo`: "Perfil e ajustes no topo" deixa de dizer que os ajustes são salvos no aparelho: eles seguem a
  conta.

## Impact

- **Código novo**: `functions/api/save.ts` (Pages Function: valida o JWT do Access, lê e grava no D1), migração SQL do D1,
  `wrangler.toml` (ligação do D1), módulo de sincronização no cliente (ex.: `src/story/sync.ts`) e o indicador na UI.
- **Código alterado**: `src/story/progress.ts` (guardar a revisão e o estado de envio junto do save), `src/App.tsx` (carregar comparando com a nuvem, tela de conflito, apagar progresso),
  `src/campaign/debug.ts` (as campanhas de depuração nunca sincronizam),
  `vite.config.ts` (o service worker nunca põe `/api/` em cache).
- **Infra**: banco D1 na conta Cloudflare do `dueldays`; a aplicação do Access precisa cobrir `/api/*` (já cobre o
  domínio). O deploy continua só pelo `wrangler pages deploy`, agora também com a pasta `functions/`.
- **Dependência**: `jose` (validar o JWT do Access na função), só no servidor.
- **Documentação**: CLAUDE.md (a exceção ao "sem backend", o D1 e como testar a sincronização em dev).
