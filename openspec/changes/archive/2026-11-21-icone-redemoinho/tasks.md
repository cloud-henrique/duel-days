# Tasks

## 1. Glifo grande

- [x] 1.1 Reescrever `assets/app-icon/icon.svg`: fundo `#0a1a3a` → `#050c1f` em quadro cheio, `SPIRAL` recortado num disco, degradê branco → ciano, brilho ciano suave, glifo em ~72% no centro óptico; sem carta. Verificar renderizando em 180 e 512 (sem fragmentos nos cantos, nenhum braço cortado de forma estranha)
- [x] 1.2 Reescrever `assets/app-icon/icon-maskable.svg` com o mesmo glifo dentro do círculo seguro de 80%. Verificar sobrepondo o círculo de 80% (r = 40% do quadro) ao render de 512: nada do redemoinho fora dele
- [x] 1.3 Conferir a máscara do iOS: aplicar uma máscara squircle ao render de 180 e checar que sobra margem de fundo em volta do redemoinho

## 2. Glifo pequeno

- [x] 2.1 Desenhar o redemoinho simplificado (~2 voltas, faixas uniformes, mesmo sentido de giro do grande) sobre placa escura em `assets/app-icon/icon-small.svg`. Verificar renderizando em 16, 32 e 48 px: voltas distinguíveis
- [x] 2.2 Conferir o favicon numa aba clara e numa escura (navegador no tema claro e no escuro) e comparar lado a lado com o glifo grande

## 3. Geração e documentação

- [x] 3.1 Ajustar `scripts/build_app_icons.mjs` só no necessário (apple-touch sem `rx`, quadro de referência) e rodar `node scripts/build_app_icons.mjs`. Verificar que `public/icons/*` e `public/favicon.ico` foram regerados e que o `apple-touch-icon.png` não tem alfa (`sips -g hasAlpha`)
- [x] 3.2 Atualizar o CLAUDE.md (trocar "ankh em HUD azul" pela descrição do redemoinho) e o Purpose do `openspec/specs/pwa-app-icons/spec.md` (deixar de citar o ankh)
- [x] 3.3 `npx tsc --noEmit` e `npx vite build` sem erro; abrir o preview e conferir a aba (SVG e ICO) e o manifest no navegador
- [x] 3.4 No simulador de iOS, "Adicionar à Tela de Início" e conferir o ícone na tela de início (fundo cheio, sem cantos duplos)

## Workflow follow-up

- Publicar com `npx vite build && npx wrangler pages deploy dist --project-name dueldays --branch main` e avisar os amigos que, no iPhone, o ícone novo só aparece removendo e adicionando o app de novo.
- Arquivar a change (`/opsx:archive`).
