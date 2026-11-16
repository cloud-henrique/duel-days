# Tasks

## 1. Identidade no app

- [x] 1.1 Trocar `<title>` por "Duel Days" e adicionar `apple-mobile-web-app-title` em `index.html`; verificar com `grep` no `dist/index.html` após o build
- [x] 1.2 Trocar `name` e `short_name` do manifest em `vite.config.ts` e o log para `/tmp/duel-days-device.log` (também em `src/debug/remote.ts`); verificar o `dist/manifest.webmanifest`
- [x] 1.3 Trocar o título da tela inicial em `src/App.tsx` e o banco Dexie para `duel-days` em `src/story/progress.ts`; verificar no navegador: título "Duel Days" e banco `duel-days` no IndexedDB, sem `ygo-story`
- [x] 1.4 Trocar o nome em `package.json` e `package-lock.json` (`duel-days`); verificar com `npm ls --depth=0` sem erro

## 2. Documentação

- [x] 2.1 Atualizar `README.md` (título sem "nome provisório"), `docs/HANDOFF.md` (título, log, "app nativo original") e `CLAUDE.md` (log); verificar que o `grep -rniE "ygo[ -]story|ygo-story-pwa"` nos arquivos versionados (exceto `openspec/changes/archive/`) não acha nada

## 3. Verificação e publicação

- [x] 3.1 Rodar `npx tsc --noEmit`, `npm test` e `npx vite build` e conferir no preview a tela inicial e o título; verificar que todos passam
- [ ] 3.2 Commitar, publicar com `wrangler pages deploy` e conferir que `https://dueldays.pages.dev` continua protegido pelo Access
- [ ] 3.3 Criar o repositório privado `duel-days` no GitHub, configurar o `origin` e subir a branch; verificar com `git ls-files` que nada da Konami (cards, characters, data, raw) está versionado e com `git remote -v` e `gh repo view`

## Workflow follow-up

- Mover a pasta local para `/Users/cloudy/duel-days`, recriar o `.venv` e rodar `cf auth activate claudio .` (feito pelo usuário).
- Arquivar o change depois de confirmar o deploy.
