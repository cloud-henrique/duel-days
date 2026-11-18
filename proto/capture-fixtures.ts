// Captura prompts reais do motor (o mesmo DuelDriver do Worker) para os testes de unidade da interface.
// Grava src/screens/duel/__fixtures__/prompts.json: o primeiro prompt "interessante" de cada tipo.
// Uso: npx tsx proto/capture-fixtures.ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { OcgMessageType, type OcgMessage } from 'ocgcore-wasm';
import { randomRespond, makeRng } from '../src/engine/cpu';
import { DuelDriver } from '../src/engine/driver';
import { openCore, type CardRecord } from '../src/engine/session';
import { randomDeck, starterCollection } from '../src/game/decks';

const OUT = 'src/screens/duel/__fixtures__/prompts.json';
const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')) as Record<string, CardRecord>;
const scripts = JSON.parse(readFileSync('public/scripts.json', 'utf8')) as Record<string, string>;
const tiers = JSON.parse(readFileSync('public/data/pool.json', 'utf8')) as Record<string, string>;
const poolIds = Object.keys(tiers).map(Number);

/** Nome da fixture para um prompt, ou null se ele não acrescenta um caso novo. */
function label(m: OcgMessage): string | null {
  switch (m.type) {
    case OcgMessageType.SELECT_IDLECMD:
      if (m.to_bp && m.to_ep && m.summons.length && m.spell_sets.length) return 'idle_bp_ep';
      if (!m.to_bp && m.to_ep) return 'idle_ep_only';
      return null;
    case OcgMessageType.SELECT_BATTLECMD:
      if (m.attacks.some((a) => a.can_direct)) return 'battle_direct';
      if (m.attacks.length && m.to_m2) return 'battle_attack';
      return null;
    case OcgMessageType.SELECT_CHAIN: return m.selects.length ? 'chain' : null;
    case OcgMessageType.SELECT_CARD: return 'select_card';
    case OcgMessageType.SELECT_TRIBUTE: return 'select_tribute';
    case OcgMessageType.SELECT_POSITION: return 'select_position';
    case OcgMessageType.SELECT_EFFECTYN: return 'effect_yn';
    default: return null;
  }
}

const core = await openCore();
const found: Record<string, unknown> = {};
for (let seed = 1; seed <= 60 && Object.keys(found).length < 9; seed++) {
  const col = starterCollection(cards, tiers, seed * 7);
  const mine = { main: Object.entries(col).flatMap(([id, n]) => Array<number>(n).fill(Number(id))), extra: [] };
  const d = new DuelDriver(core, cards, (n) => scripts[n] ?? null, mine, randomDeck(cards, poolIds, seed), seed);
  const rng = makeRng(seed);
  let out = d.run();
  for (let k = 0; k < 400 && out.t === 'prompt'; k++) {
    const name = label(out.msg);
    if (name && !found[name]) found[name] = { msg: out.msg, board: out.board };
    const r = randomRespond(out.msg, rng, {});
    if (!r) break;
    out = d.respond(r);
  }
  d.session.destroy();
}
mkdirSync('src/screens/duel/__fixtures__', { recursive: true });
writeFileSync(OUT, JSON.stringify(found, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 1));
console.log('fixtures:', Object.keys(found).join(', '));
