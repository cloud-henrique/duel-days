# Design

## Context

- O save é um registro só no IndexedDB (Dexie, tabela `progress`, id `main`) com o `Progress` inteiro: perfil,
  estatísticas, `settings` e `campaign`. Ele é gravado pelo `save()` do `App.tsx` a cada mudança e lido uma vez, na
  abertura, pelo `loadProgress` (que passa pelo `migrate`). Um registro só, e não muitas tabelas, é o que deixa a
  sincronização ser "documento inteiro".
- O site está no Cloudflare Pages (`dueldays`) atrás do Cloudflare Access (política "Amigos", código por e-mail). Todo
  pedido que chega ao domínio já passou pelo Access e leva o JWT `Cf-Access-Jwt-Assertion` com o e-mail.
- O deploy é só pelo `wrangler pages deploy dist` (o projeto não tem Git ligado). Uma pasta `functions/` na raiz entra no
  mesmo deploy.
- O PWA usa o Workbox (`vite-plugin-pwa`) com `navigateFallback`; nada hoje passa por `/api/`.
- O `migrate` descarta uma campanha de outra `CAMPAIGN_VERSION`. Hoje isso só acontece depois de uma atualização do app;
  com a nuvem, um aparelho com o app velho poderia baixar uma campanha nova e descartá-la.
- As campanhas de depuração (`?campaign=…`, `src/campaign/debug.ts`) gravam um estado falso no save.

## Goals / Non-Goals

**Goals:**

- Uma gravação nunca espera a rede: o jogo continua igual offline e com a sessão do Access vencida.
- Um save que avançou num aparelho nunca é sobrescrito calado pelo de outro.
- O servidor é pequeno: um arquivo de função, duas tabelas, sem sessão própria.

**Non-Goals:**

- Mesclar campanhas (juntar a coleção de um com o dia do outro). Conflito é sempre escolher um lado inteiro.
- Retomar um duelo no meio em outro aparelho: o duelo continua fora do save ("duelo interrompido" como hoje).
- Tempo real entre aparelhos abertos ao mesmo tempo (sem WebSocket nem polling contínuo).
- Tela para o jogador navegar nas versões antigas: a restauração é do administrador, pelo `wrangler d1`.
- Login fora do Access (Google, senha, link mágico próprio).

## Decisions

### 1. Identidade pelo Cloudflare Access, não pelo Google

A função lê o `Cf-Access-Jwt-Assertion`, valida a assinatura com as chaves públicas da equipe
(`https://<equipe>.cloudflareaccess.com/cdn-cgi/access/certs`, pelo `jose` com `createRemoteJWKSet`) e confere o `aud`
da aplicação. O `email` do token é a chave do save, sempre em minúsculas. Sem token válido, a função responde 401.

- **Por que não confiar só no cabeçalho**: o Access protege o domínio, mas validar custa pouco e evita que uma rota
  esquecida (um domínio de preview, uma mudança na política) aceite um e-mail inventado.
- **Alternativa: Google (Firebase Auth/Supabase)**: um segundo login em cima do Access, outro provedor e o OAuth em
  janela, que é onde o PWA instalado no iOS mais falha. Rejeitada.
- **Alternativa: código de exportar/importar**: não é automático. Rejeitada para o caso principal.

### 2. D1, não KV

```
saves                                save_history
+------------+---------------+       +------------+---------------+
| email  PK  | text          |       | id PK auto | integer       |
| rev        | integer       |       | email      | text          |
| version    | integer       |       | rev        | integer       |
| data       | text | null   |       | version    | integer       |
| device     | text          |       | data       | text | null   |
| updated_at | integer (ms)  |       | device     | text          |
+------------+---------------+       | updated_at | integer       |
                                     | reason     | text          |
                                     +------------+---------------+
                                       guarda as 10 últimas de cada e-mail
```

- `rev` cresce de 1 em 1 a cada gravação aceita. `version` é a `CAMPAIGN_VERSION` com que o save foi gravado. `data`
  nulo é a lápide de um "Apagar progresso". `device` é o rótulo do aparelho que gravou ("iPhone", "Mac"...).
- **Por que D1**: a gravação condicional (`UPDATE … WHERE email = ? AND rev = ?`) é atômica e a leitura logo depois
  é consistente. O KV é eventual (até ~60 s entre regiões): o celular grava, o notebook abre e lê o save velho, que é
  justamente o caso que a change quer resolver.
- **Alternativa: Durable Objects**: consistentes também, mas exigem um Worker à parte e são demais para 4 jogadores.
- Tamanho: o save é JSON de dezenas de KB. A função recusa mais de 1 MB (413), bem abaixo do limite de linha do D1.

### 3. Protocolo: documento inteiro com revisão (concorrência otimista)

```
GET    /api/save                    -> 200 { rev, version, data, device, updatedAt } | 404 (nunca gravou)
PUT    /api/save { baseRev, version, data, device }
                                    -> 200 { rev }                  (baseRev == rev do servidor)
                                    -> 409 { rev, version, data, device, updatedAt }   (o servidor andou)
DELETE /api/save { baseRev, device }-> 200 { rev }   (vira lápide)  | 409 como no PUT
POST   /api/save { version, data, device } -> 204   (guarda o lado descartado num conflito)
```

O `reason` do histórico diz de onde veio a versão: `replaced` (um envio por cima), `erased` (um "Apagar progresso") ou
`discarded` (o lado que perdeu um conflito, mandado pelo `POST`). Por isso o histórico tem um `id` próprio, e não
(email, rev): o lado descartado tem a mesma `rev` de base que a versão atual.

Cada gravação aceita copia a linha anterior para o `save_history` e apaga o que passar das 10 últimas.

No aparelho, junto do `Progress`, o registro do Dexie passa a guardar o **estado da sincronização**:

- `baseRev`: a revisão da nuvem da qual este save descende (0 = nunca sincronizou);
- `dirty`: há mudança local que a nuvem não tem;
- `deviceId` e `device` (rótulo), gerados uma vez por aparelho.

O `writeProgress` continua síncrono com o jogo (grava no IndexedDB e marca `dirty`); o envio é outro passo.

### 4. A reconciliação: uma função pura, quatro casos

`reconcile(local, remoto)` em `src/story/sync.ts`, pura e testada; a parte com `fetch` só a chama.

```
                         remoto.rev == local.baseRev ?
                        /                            \
                      sim                             não (a nuvem andou)
                      /                                 \
            local.dirty ?                          local.dirty ?
            /         \                            /           \
         sim           não                       sim            não
          |             |                         |              |
        ENVIAR       NADA A FAZER            CONFLITO         PUXAR
     (PUT baseRev)                       (perguntar qual)  (troca o local)

 sem save local + remoto existe   -> PUXAR (pula as boas-vindas)
 local existe + remoto 404        -> ENVIAR com baseRev 0
 remoto é lápide, local limpo     -> APAGAR o local (volta às boas-vindas)
 remoto é lápide, local dirty     -> CONFLITO ("apagado em outro aparelho" x este)
 remoto.version > a do app        -> PARAR (não puxa nem envia; "atualize o app")
```

Um 409 no envio é o mesmo caso "a nuvem andou": refaz a reconciliação com o que o 409 trouxe.

**Por que não "o mais avançado vence"**: progresso não é linear (um lado pode ter mais dias e o outro um pacote raro
aberto). Você escolheu perguntar; a pergunta só aparece quando os dois jogaram offline sem sincronizar, que é raro.

### 5. Quando sincronizar

| Momento | O que faz |
|---|---|
| Abrir o app | Lê o local e reconcilia **antes** de liberar o "Continuar": espera a nuvem por até 3 s ("Sincronizando…" no botão). Offline ou sem resposta, segue com o local. |
| Depois de cada `save()` | Envio com espera de 2 s (várias gravações seguidas viram um envio só). |
| Ir para o segundo plano (`visibilitychange` → `hidden`) | Envio imediato com `fetch(..., { keepalive: true })`. |
| Voltar do segundo plano / evento `online` | Reconcilia. |

Espera de 3 s na abertura: sem ela, o jogador toca em "Continuar" antes do save do outro aparelho chegar, joga um
período e cria um conflito que não precisava existir.

**Puxar com o app aberto** (voltou do segundo plano e a nuvem andou, local limpo): fora do duelo, o app troca o save e
volta ao título com o aviso "Progresso atualizado de outro aparelho". Dentro do duelo, espera o duelo acabar. O
resultado gravado deixa o local `dirty` e cai no conflito, que é o certo: houve jogo nos dois lados.

Sem Background Sync: o iOS não tem. Os quatro gatilhos acima cobrem o uso real.

### 6. Sessão do Access vencida

A sessão do Access expira (a aplicação "Duel Days" está com 720h, 30 dias, e `auto_redirect_to_identity` ligado: o
redirecionamento vai direto para o pedido do código). O pedido a `/api/save` passa a ser redirecionado
para o login. O cliente pede com `redirect: 'manual'`: uma resposta `opaqueredirect` (ou um 401) vira o estado
**"sessão vencida"**. O jogo segue com `dirty`, e o indicador oferece "Entrar", que recarrega a página para o Access
pedir o código. Só com o toque do jogador, nunca sozinho, para não tirar ninguém de um duelo.

### 7. Service worker não toca em `/api/`

`navigateFallbackDenylist: [/^\/api\//]` e nenhuma regra de `runtimeCaching` para `/api/`: o save nunca sai de um cache
velho. Offline, o `fetch` falha e o estado é "pendente".

### 8. Versão do save

Todo envio leva a `version` (a `CAMPAIGN_VERSION` do app). Se a nuvem tiver uma `version` maior que a do app, o cliente
não puxa nem envia e mostra "Atualize o app para sincronizar". Como o PWA se atualiza sozinho, recarregar resolve. Assim
o `migrate` de um app velho nunca descarta uma campanha nova, nem sobe a versão descartada.

### 9. Apagar progresso

O "Apagar progresso" do perfil manda `DELETE` (lápide com `rev` novo; a versão anterior fica no histórico) e apaga o
local. Os outros aparelhos veem a lápide na próxima reconciliação e voltam às boas-vindas (ou caem no conflito, se
tinham jogo pendente). Offline, a lápide fica pendente como qualquer envio: o local já está apagado, e o próximo
contato com a nuvem manda o `DELETE`.

### 10. Ajustes seguem a conta

Você escolheu tudo na nuvem: `settings` vai no `data` como o resto. Mexer no volume conta como mudança e entra no envio
com espera, como qualquer `save()`.

### 11. Depuração e desenvolvimento

- Com uma campanha de depuração (`?campaign=…`) ativa, a sincronização fica desligada na sessão inteira: um estado falso
  nunca sobe para a conta.
- `?sync=off` desliga a sincronização em qualquer ambiente.
- No `npm run dev` (Vite puro) não há `/api/`: o primeiro pedido dá 404 de rota, e o estado vira "local". Para testar a
  sincronização: `npx vite build && npx wrangler pages dev dist --d1 DB` com a variável `DEV_EMAIL`, que a função aceita
  no lugar do JWT **só** quando a requisição vem de `localhost`.
- Os testes cobrem o `reconcile` (puro) e a função com um D1 em memória (Miniflare/`@cloudflare/vitest-pool-workers`, ou
  um falso do `D1Database`).

## Risks / Trade-offs

- [Dois aparelhos abertos ao mesmo tempo, jogando] → O segundo a enviar recebe 409 e cai no conflito; como pull e push
  são por revisão, ninguém sobrescreve ninguém. É chato, mas seguro.
- [Escolha errada no conflito] → O lado descartado vai para o `save_history`; o administrador o devolve com
  `wrangler d1 execute` (comando no CLAUDE.md).
- [A sessão do Access vence e o jogador nunca entra de novo] → O indicador fica em "sessão vencida" e o progresso fica
  só no aparelho até ele tocar em "Entrar". A sessão da aplicação "Duel Days" dura 720h (30 dias), então isso acontece
  no máximo uma vez por mês por aparelho.
- [O iOS apaga o IndexedDB de um PWA sem uso por semanas] → Com a nuvem, isso deixa de ser perda: o save volta na
  próxima abertura online. Só se perde o que não foi enviado.
- [Envio no `visibilitychange` não completar] → O `keepalive` costuma completar; se não, o `dirty` continua e a próxima
  abertura envia.
- [Relógio do aparelho errado] → A ordem é só pela `rev` do servidor; a hora aparece no resumo do conflito e é a do
  servidor (`updated_at`).
- [Primeiro backend do projeto] → Uma função, sem estado fora do D1, no mesmo deploy. Se cair, o jogo segue local.

## Migration Plan

1. Criar o D1 (`wrangler d1 create dueldays-saves`), aplicar a migração e ligar o banco ao projeto do Pages
   (`wrangler.toml` com `pages_build_output_dir = "dist"` e o `[[d1_databases]]`).
2. Pegar o `aud` da aplicação do Access e o nome da equipe e guardá-los como variáveis do projeto do Pages.
3. Deploy. Cada aparelho que abrir a versão nova com save local e sem save na nuvem envia o seu (baseRev 0). Se você já
   tiver saves diferentes no celular e no notebook, o segundo a abrir cai no conflito e você escolhe.
4. Volta atrás: um deploy anterior simplesmente não chama `/api/` e o IndexedDB continua com o save completo. Nada no
   formato local quebra a versão antiga (os campos novos do registro são ignorados por ela).

## Open Questions

- Onde exatamente fica o indicador na tela larga (título e mapa estão definidos nas specs; o lugar fino se acerta na
  implementação).
