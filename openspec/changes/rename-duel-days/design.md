# Design

## Context

Motivação em `proposal.md`; requisitos em `specs/app-identity/spec.md`. O nome antigo aparece em 8 arquivos versionados
(levantamento feito na exploração). A produção (`dueldays.pages.dev`, Cloudflare Pages + Access "Duel Days") já usa o nome novo.

## Goals / Non-Goals

**Goals:** nome único "Duel Days" em tudo que é versionado; repositório `duel-days` no GitHub.

**Non-Goals:** renomear a pasta local pelo agente; migrar saves antigos; mexer em `openspec/changes/archive/` ou nas
menções a YGOPRODeck; mudar o texto "protótipo" da tela inicial.

## Decisions

- **Banco Dexie renomeado sem migração.** Trocar `new Dexie('ygo-story')` por `'duel-days'` faz o app abrir sem os saves antigos.
  A produção está vazia e os saves locais são de teste, então a migração (copiar o banco antigo na primeira abertura) não vale
  o código extra. Alternativa descartada: manter o nome interno antigo, que deixaria o nome velho escondido no código.
- **`apple-mobile-web-app-title` explícito** no `index.html`. Sem ele o iOS usa o `<title>`; declarar evita depender disso.
- **Log de diagnóstico** passa a `/tmp/duel-days-device.log` (vite.config, `src/debug/remote.ts`, CLAUDE.md, HANDOFF).
- **Referência ao app nativo** no HANDOFF vira "app nativo original", para não confundir com o produto, que agora também é Duel Days.
- **Repositório no GitHub:** `gh repo create duel-days --private` na conta autenticada, `origin` por SSH (o `gh` está configurado
  com protocolo SSH), push da branch atual. Ação externa; só ocorre com a confirmação do usuário (já dada para este change).
- **Pasta local fica de fora:** renomeá-la mudaria o diretório de trabalho do agente, invalidaria o `.venv` (shebangs com caminho fixo)
  e o histórico do Claude Code ligado ao caminho, e desligaria o perfil `cf`. Instruções entregues ao usuário no fim.

## Risks / Trade-offs

- [Saves locais de teste somem] → aceito; produção sem saves.
- [Atalhos instalados continuam com o nome antigo no iOS] → remover e adicionar de novo.
- [Service worker antigo serve o app com o nome velho] → `registerSW({ immediate: true })` atualiza sozinho; conferir após o deploy.
- [Repositório privado com material pesado] → a arte da Konami está no `.gitignore`, então não vai ao GitHub (conferir `git ls-files` antes do push).

## Migration Plan

1. Trocar textos, pacote, banco e docs; `npx tsc --noEmit`, `npm test`, `npx vite build`.
2. Conferir no navegador (título, tela inicial, manifest, banco no IndexedDB).
3. Commit, deploy (`wrangler pages deploy`), conferir a URL de produção.
4. Criar o repositório no GitHub e subir. Reversão: a renomeação é só texto; basta reverter o commit.
