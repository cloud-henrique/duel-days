# Tasks

## 1. Entrada só esmaecendo

- [x] 1.1 Trocar o `@keyframes actor-in` do `src/screens/campaign/campaign.css` para só opacidade (sem `translate`), com a
  mesma duração; conferir no navegador (viewport de celular, `?campaign=bond`) que o duelista aparece no lugar final
  esmaecendo, sem subir, e que o vovô da loja (`?campaign=shop`) também só esmaece

## 2. Memória do palco por encontro

- [x] 2.1 Criar o contexto `StageMemory` (um `Set` de ids de sprite) no `Dialogue.tsx`, com o padrão "sem memória =
  sempre entra"; no `Sprite`, decidir `enter` no inicializador do `useState`, registrar o id num efeito quando fica
  pronto e só aplicar a animação de entrada com `enter` (classe no `.actor`; `actor-in` sai do `.actor` base). Teste em
  `campaign.test.tsx`: dentro de um provedor, um segundo `Sprite` do mesmo personagem montado depois não tem a classe
  de entrada; sem provedor, sempre tem
- [x] 2.2 Envolver as fases do encontro num provedor criado uma vez por encontro (no `App.tsx`, em volta do
  `EncounterScreen`, com a `key` dele), e a cena avulsa do `App.tsx` (`screen.v === 'scene'`) num provedor próprio. Teste em `campaign.test.tsx`: da saudação para a conversa, o duelista
  não ganha a classe de entrada outra vez
- [x] 2.3 Rodar `npx tsc --noEmit` e `npm test`, sem falhas

## 3. Conferência integrada

- [x] 3.1 No navegador (viewport de celular), num encontro com laço: saudação → Conversar → menu → Duelar. Conferir que o
  duelista entra esmaecendo uma vez só, que a troca de expressão muda só o rosto, que o jogador aparece esmaecendo na
  primeira fala dele e que o duelista ainda desliza para o lado
- [x] 3.2 Repetir o fluxo da 3.1 no simulador de iOS (Safari real), pelo preview
