// Sonda: para cada ação do menu principal do jogador 0 (turno 1), a resposta é aceita pelo motor?
// Uso: npx tsx proto/idle-probe.ts [sementes=60]
import { readFileSync } from 'node:fs';
import { OcgMessageType, OcgProcessResult, OcgResponseType, SelectIdleCMDAction, type OcgMessage } from 'ocgcore-wasm';
import { randomRespond, freePlaces, isSelect, makeRng } from '../src/engine/cpu';
import { randomDeck } from '../src/game/decks';
import { openCore, startDuel, type CardRecord } from '../src/engine/session';

const N = Number(process.argv[2] ?? 60);
const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')) as Record<string, CardRecord>;
const scripts = JSON.parse(readFileSync('public/scripts.json', 'utf8')) as Record<string, string>;
const poolIds = Object.keys(JSON.parse(readFileSync('public/data/pool.json', 'utf8'))).map(Number);
const core = await openCore();
const ok: Record<string, number> = {}, bad: Record<string, string[]> = {};

const mk = (seed: number) => startDuel(core, { cards, script: (n) => scripts[n] ?? null }, [randomDeck(cards, poolIds, seed), randomDeck(cards, poolIds, seed + 1000)], { seed: BigInt(seed) });
/** Avança até o primeiro IDLECMD do jogador 0 no turno 1. */
function toIdle(s: ReturnType<typeof mk>, rng: () => number) {
  for (let i = 0; i < 100; i++) {
    const { status, messages } = s.step();
    if (status === OcgProcessResult.END) return null;
    const sel = [...messages].reverse().find(isSelect);
    if (!sel) return null;
    if ((sel as { player: number }).player === 0 && sel.type === OcgMessageType.SELECT_IDLECMD) return sel;
    const r = randomRespond(sel, rng); if (!r) return null; s.respond(r);
  }
  return null;
}
const ACTIONS: [string, SelectIdleCMDAction, (m: Extract<OcgMessage, { type: OcgMessageType.SELECT_IDLECMD }>) => unknown[]][] = [
  ['invocar', SelectIdleCMDAction.SELECT_SUMMON, (m) => m.summons], ['baixar monstro', SelectIdleCMDAction.SELECT_MONSTER_SET, (m) => m.monster_sets],
  ['baixar magia/armadilha', SelectIdleCMDAction.SELECT_SPELL_SET, (m) => m.spell_sets], ['ativar', SelectIdleCMDAction.SELECT_ACTIVATE, (m) => m.activates],
];
for (let seed = 1; seed <= N; seed++) {
  for (const [label, action, pick] of ACTIONS) {
    const probe = mk(seed); const rng = makeRng(seed);
    const idle = toIdle(probe, rng); probe.destroy();
    if (!idle) continue;
    const n = pick(idle).length;
    for (let idx = 0; idx < n; idx++) {
      const s = mk(seed); const r2 = makeRng(seed);
      const m = toIdle(s, r2) as Extract<OcgMessage, { type: OcgMessageType.SELECT_IDLECMD }>;
      s.respond({ type: OcgResponseType.SELECT_IDLECMD, action, index: idx });
      // responde zona/posição/etc. como o app faz e olha o que vem em seguida
      let verdict = 'ok', detail = '';
      for (let k = 0; k < 12; k++) {
        const { messages } = s.step();
        const sel = [...messages].reverse().find(isSelect);
        if (messages.some((x) => x.type === OcgMessageType.RETRY) && !sel) { verdict = 'RETRY'; detail = `seed ${seed} idx ${idx} ${JSON.stringify((pick(m) as { code: number }[])[idx])}`; break; }
        if (!sel) { verdict = 'sem prompt'; detail = `seed ${seed} idx ${idx} msgs ${messages.map((x) => OcgMessageType[x.type]).join(',')}`; break; }
        if (sel.type === OcgMessageType.SELECT_IDLECMD || sel.type === OcgMessageType.SELECT_CHAIN) break;
        if (sel.type === OcgMessageType.SELECT_PLACE || sel.type === OcgMessageType.SELECT_DISFIELD) { s.respond({ type: sel.type === OcgMessageType.SELECT_PLACE ? OcgResponseType.SELECT_PLACE : OcgResponseType.SELECT_DISFIELD, places: freePlaces(sel.field_mask, sel.player, sel.count) }); continue; }
        const r = randomRespond(sel, rng); if (!r) { verdict = `prompt sem resposta ${OcgMessageType[sel.type]}`; break; } s.respond(r);
      }
      s.destroy();
      if (verdict === 'ok') ok[label] = (ok[label] ?? 0) + 1; else (bad[`${label}: ${verdict}`] ??= []).push(detail);
    }
  }
}
console.log('aceitas:', ok);
for (const [k, v] of Object.entries(bad)) console.log('FALHA', k, v.length, v.slice(0, 3));
