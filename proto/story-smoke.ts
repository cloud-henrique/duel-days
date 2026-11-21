// Percorre a campanha (changes `campanha-dm`, `campanha-tiers` e `tier3-batalha-da-cidade`) pelo modelo puro, sem tela: muitas campanhas de 30 dias com resultados
// sorteados, conversas, eventos de laço e as duas rotas. Confere que toda cena sai com falas, que todos os eventos e
// rotas de todos os duelistas são alcançados, que o chefe aparece e é vencido e que a campanha termina no dia 30. Conta
// também os tiers abertos (pelo chefe ou pelo prazo), os chefes de cada tier vencidos, os pacotes-prêmio, quem de cada
// tier novo apareceu e o DP médio no fim da janela de cada tier.
// Uso: npx tsx proto/story-smoke.ts [campanhas=200]
import { BALANCE } from '../src/campaign/balance';
import {
  bondChoiceScene, canTalk, choosePick, chooseRoute, conversationScene, epilogue, isChoicePending, pendingPick, pickScene, playableEvent, talk, TOPICS,
} from '../src/campaign/bond';
import type { Scene } from '../src/campaign/data/types';
import { greetingScene, preDuelScene } from '../src/campaign/encounter';
import { beginDuel, meet } from '../src/campaign/flow';
import { present } from '../src/campaign/map';
import { openUnopened, buy, canBuy, collectionPacks } from '../src/campaign/packs';
import { applyDuel, type DuelOutcome } from '../src/campaign/rewards';
import { generator, pick, randInt } from '../src/campaign/rng';
import { newCampaign, type CampaignState, type Route } from '../src/campaign/state';
import { DIALOGUE, TIERS } from '../src/campaign/data/types';
import { currentTier, tierOf, tierOpenDay } from '../src/campaign/tiers';
import { fillText } from '../src/campaign/text';

const N = Number(process.argv[2] ?? 200);
const seen = new Set<string>();
let scenes = 0, bossWins = 0, ended = 0, epilogues = 0, prizes = 0, withMemories = 0;
/** Os tiers com duelistas além do primeiro; a campanha termina no último deles. */
const LATER = TIERS.slice(1).filter((t) => t.duelists.length);
const LAST = LATER[LATER.length - 1]?.number ?? 1;
const opened = Object.fromEntries(LATER.map((t) => [t.number, { chefe: 0, prazo: 0, nunca: 0 }]));
const dpAtEnd: Record<number, number[]> = {};
const bossByTier: Record<number, number> = {};
const metLater = new Set<string>();
const fail = (msg: string) => { throw new Error(msg); };
const check = (scene: Scene, where: string) => {
  if (!scene.length) fail(`cena vazia: ${where}`);
  for (const l of scene) if (/[{}]/.test(fillText(l.text, 'Ana', 'she'))) fail(`marcação sobrando em ${where}: ${l.text}`);
  scenes++;
};

for (let n = 0; n < N; n++) {
  const g = generator(777, n);
  let s: CampaignState = newCampaign(1000 + n);
  // Joga bem ou mal conforme a campanha (metade vence quase sempre, metade perde bastante).
  const skill = n % 2 === 0 ? 0.85 : 0.45;
  while (s.unopenedPacks.length) s = openUnopened(s).state;
  let guard = 0;
  while (!s.concluded) {
    if (++guard > 200) fail(`campanha ${n} não terminou`);
    const here = present(s);
    for (const d of here) metLater.add(d.key);
    for (const t of TIERS) if (s.day === t.lastDay && s.period === 2) (dpAtEnd[t.number] ??= []).push(s.dp);
    if (!here.length) fail(`dia ${s.day} período ${s.period}: ninguém no mapa`);
    // Conversa com todo mundo que der (não gasta período).
    for (const d of here) {
      s = meet(s, d.key);
      check(greetingScene(s, d.key), `saudação ${d.key}`);
      if (isChoicePending(s, d.key)) {
        check(bondChoiceScene(s, d.key) ?? [], `escolha ${d.key}`);
        const route: Route = n % 4 < 2 ? 'romance' : 'friendship';
        const r = chooseRoute(s, d.key, route);
        check(r.then, `continuação ${d.key} ${route}`);
        s = r.state;
        seen.add(`${d.key}:rota:${route}`);
      }
      // Resposta no fim do evento (change lacos-ate-o-fim): uma opção por sorteio.
      for (let e = pendingPick(s, d.key); e !== null; e = pendingPick(s, d.key)) {
        check(pickScene(s, d.key), `resposta ${d.key} ${e}`);
        const r = choosePick(s, d.key, Math.floor(g() * 3) % 2);
        check(r.then, `resposta ${d.key} ${e}`);
        s = r.state;
        seen.add(`${d.key}:resposta:${e}`);
      }
      if (canTalk(s, d.key)) {
        const r = talk(s, d.key, pick(g, TOPICS)!);
        check(conversationScene(d.key, r.result), `conversa ${d.key}`);
        s = r.state;
      }
    }
    // Um duelo por período: o evento aberto primeiro, senão o chefe, senão alguém.
    const withEvent = here.find((d) => playableEvent(s, d.key) !== null);
    const boss = here.find((d) => d.isBoss);
    const foe = withEvent ?? (boss && g() < 0.5 ? boss : here[randInt(g, here.length)]);
    const kind = withEvent ? 'bondEvent' : 'regular';
    if (kind === 'bondEvent') seen.add(`${foe.key}:evento:${playableEvent(s, foe.key)}`);
    s = beginDuel(s, foe.key, kind);
    check(preDuelScene(s, foe.key, kind), `antes ${foe.key} ${kind}`);
    const won = g() < skill;
    const o: DuelOutcome = won ? { result: 'win', turns: 4 + randInt(g, 14), lifePoints: randInt(g, 8001) }
      : { result: pick(g, ['lose', 'lose', 'draw', 'forfeit'] as const)!, turns: 3 + randInt(g, 15), lifePoints: 0 };
    const r = applyDuel(s, foe.key, kind, o);
    check(r.after, `depois ${foe.key} ${o.result}`);
    if (r.reward.defeatedBossForFirstTime) { bossWins++; const t = tierOf(foe.key).number; bossByTier[t] = (bossByTier[t] ?? 0) + 1; }
    if (r.reward.prizePack) prizes++;
    s = r.state;
    if (s.pendingDuel) fail('duelo pendente depois do resultado');
    // Compra o que der.
    for (const p of collectionPacks(s)) if (canBuy(s, p.key) && g() < 0.5) s = buy(s, p.key).state;
  }
  if (s.day !== BALANCE.days || s.period !== 2) fail(`campanha ${n} terminou no dia ${s.day}`);
  ended++;
  for (const t of LATER) {
    const day = tierOpenDay(s, t.number), o = opened[t.number];
    if (day === null) o.nunca++; else if (day < t.firstDay) o.chefe++; else o.prazo++;
  }
  if (currentTier(s).number !== LAST) fail(`campanha ${n} terminou no tier ${currentTier(s).number}`);
  const ep = epilogue(s);
  if (ep) { check(ep.scene, `epílogo ${ep.duelist.key}`); epilogues++; seen.add(`${ep.duelist.key}:epilogo:${ep.route}`); if (ep.scene.length > (DIALOGUE.duelists[ep.duelist.key].epilogue?.[ep.route].length ?? 0)) withMemories++; }
}

const keys = ['tristan', 'tea', 'joey', 'bakura', 'yugi'];
const missing: string[] = [];
for (const k of keys) {
  for (let e = 1; e <= BALANCE.bondEvents; e++) if (!seen.has(`${k}:evento:${e}`)) missing.push(`${k} evento ${e}`);
  for (const r of ['friendship', 'romance']) if (!seen.has(`${k}:rota:${r}`)) missing.push(`${k} rota ${r}`);
  for (const e of [1, 2, 4, 5, 6]) if (!seen.has(`${k}:resposta:${e}`)) missing.push(`${k} resposta ${e}`);
}
console.log(`${ended}/${N} campanhas até o dia 30 | ${scenes} cenas | chefe vencido em ${bossWins} | epílogos ${epilogues} (com lembrança: ${withMemories})`);
for (const t of LATER) {
  const o = opened[t.number];
  console.log(`Tier ${t.number} aberto pelo chefe em ${o.chefe}, pelo prazo em ${o.prazo}, nunca em ${o.nunca}`);
}
console.log('chefes vencidos por tier:', bossByTier, `| pacotes-prêmio ${prizes}`);
const avg = (xs: number[] = []) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : '-');
console.log('DP médio na noite do último dia de cada tier:', Object.fromEntries(TIERS.map((t) => [`T${t.number} (dia ${t.lastDay})`, avg(dpAtEnd[t.number])])));
const absent = LATER.flatMap((t) => t.duelists.map((d) => d.key)).filter((k) => !metLater.has(k));
if (absent.length) { console.log('dos tiers novos, nunca apareceram:', absent.join(', ')); process.exitCode = 1; }
console.log(`eventos e rotas alcançados: ${seen.size}`, missing.length ? `| faltam: ${missing.join(', ')}` : '| todos');
if (missing.length) process.exitCode = 1;
