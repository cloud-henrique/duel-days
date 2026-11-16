# Proposal

## Why

O jogo agora se chama **Duel Days** (produção em `dueldays.pages.dev`, Access "Duel Days"), mas o código, a tela inicial, o
manifest e a documentação ainda dizem "YGO Story". O PWA passa a ser a versão oficial no lugar do app nativo, então o nome
precisa ser o mesmo em todo lugar que o usuário ou o desenvolvedor vê.

## What Changes

- Nome visível: `<title>`, `apple-mobile-web-app-title` (novo), `name`/`short_name` do manifest e o título da tela inicial passam a "Duel Days".
- Pacote: `package.json` e `package-lock.json` passam a `duel-days`.
- Banco local (Dexie/IndexedDB) de `ygo-story` para `duel-days`. **BREAKING** para saves locais de teste: não há migração
  (a produção acabou de subir e não tem saves).
- Arquivo de log de diagnóstico `/tmp/ygo-device.log` passa a `/tmp/duel-days-device.log`.
- Documentação: `README.md` (título; fim do "nome provisório"), `docs/HANDOFF.md` e `CLAUDE.md` atualizados; a menção ao app
  nativo "Duel Days" no HANDOFF vira "app nativo original".
- Repositório: criar o repositório privado `duel-days` no GitHub (conta do usuário), configurar o `origin` e subir a branch.
  A pasta local não é renomeada pelo agente (fica para o usuário, com instruções).
- Novo build e deploy em `dueldays.pages.dev`.

## Capabilities

### New Capabilities
- `app-identity`: nome do produto ("Duel Days") exibido na interface, no manifest, no título da aba, no nome do atalho
  instalado e no nome do pacote.

### Modified Capabilities

(nenhuma; `pwa-app-icons` ainda não foi arquivado e não muda de comportamento)

## Impact

- `index.html`, `vite.config.ts`, `src/App.tsx`, `src/story/progress.ts`, `src/debug/remote.ts`, `package.json`, `package-lock.json`,
  `README.md`, `docs/HANDOFF.md`, `CLAUDE.md`.
- Produção: novo deploy; quem instalou o atalho como "YGO Story" precisa remover e adicionar de novo (o iOS guarda o nome na instalação).
- Fora do escopo: `openspec/changes/archive/`, referências a "YGOPRODeck" (fonte das cartas) e a pasta local do projeto.
