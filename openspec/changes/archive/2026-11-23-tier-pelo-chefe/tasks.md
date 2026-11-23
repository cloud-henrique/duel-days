# Tasks

## 1. Regra

- [x] 1.1 `tierCleared` e `isTierOpen` sem o prazo; `tierOpenDay` pelo dia do chefe (`src/campaign/tiers.ts`)
- [x] 1.2 `awaitsNextUpdate` pelo tier vencido (`src/campaign/calendar.ts`)

## 2. Telas

- [x] 2.1 Lock da vitrine com o chefe (`packs.ts`, `ShopScreen.tsx`)
- [x] 2.2 Status: "Tier N · vença <chefe>" (`StatusScreen.tsx`)

## 3. Depuração e testes

- [x] 3.1 Presets `tier2`, `pegasus`, `tier3`, `kaiba`, `bond-late` vencem os tiers anteriores (`debug.ts`)
- [x] 3.2 Testes reescritos sem o prazo (`openTo` em `src/campaign/__testing__/tiers.ts`), com o caso da tela: dia 20,
  T3 vencido, sem o Pegasus → Tier 2, nada do Kaiba
- [x] 3.3 `proto/story-smoke.ts`: invariante a cada período e modelo que corre atrás do progresso
