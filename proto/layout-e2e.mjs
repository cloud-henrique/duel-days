// Medidas do HUD do duelo no WebKit (spec duel-hud): campo, zonas, faixa central, mão, chips, respiro e overflow.
// Uso: node proto/layout-e2e.mjs [url=http://127.0.0.1:5181/]   (sai com código 1 se alguma medida falhar)
import { webkit } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:5181/';
const VIEWPORTS = [[360, 780], [390, 844], [390, 709], [430, 932]];
const TOL = 2; // px de tolerância

// Fórmulas do BoardMetrics do app nativo (design.md, item 1).
const MAT_INSET = 40, MAT_MAX = 500, MAT_PAD = 10, GAP = 6, ZONE_MAX = 96, ZONE_H_RATIO = 0.1;
const HAND_INSET = 24, HAND_MAX = 520, HAND_CARD_MAX = 96, HAND_CARD_RATIO = 0.25;
const ST_RATIO = 1, CENTER_GAP = 46, SIDE_MARGIN = 12, MIN_HAND_CARD = 60;

const expected = (w, h) => {
  const mat = Math.min(w - MAT_INSET, MAT_MAX);
  const zone = Math.min(ZONE_MAX, (mat - 2 * MAT_PAD - 4 * GAP) / 5, h * ZONE_H_RATIO);
  const hand = Math.min(HAND_CARD_MAX, Math.min(w - HAND_INSET, HAND_MAX) * HAND_CARD_RATIO);
  return { mat, zone, hand };
};

async function enterDuel(page) {
  const btn = (t) => page.locator('button', { hasText: t }).first();
  await page.goto(url);
  await page.fill('input[placeholder="Seu nome"]', 'Layout');
  // Boas-vindas (nome; avatar e tratamento padrão) → tela de título → Jogar.
  await btn('Começar').click();
  await page.locator('.titleplay').click();
  await page.locator('.pinhead:not(.boss)').first().evaluate((el) => el.click()); // fora da tela no panorama: o clique forçado acertava outro ponto
  await btn('Pular').click();
  await page.locator('.scene-menu button', { hasText: /^\s*Duelar\s*$/ }).click();
  await btn('Pular').click();
  await page.locator('.field').waitFor();
  await page.locator('.handfan button').first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(500);
}

const measure = (page) => page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  const r = (e) => e.getBoundingClientRect();
  const bar = q('.phasebar'), plates = qa('.plate'), hand = q('.handfan'), mybar = q('.mybar');
  return {
    field: q('.field').offsetWidth,
    zoneM: [q('.row .zone.m').offsetWidth, q('.row .zone.m').offsetHeight],
    zoneS: q('.row .zone.s').offsetHeight,
    mid: q('.midrow').offsetHeight,
    handCard: q('.handfan .slot')?.offsetWidth ?? 0,
    handBottom: Math.max(...qa('.handfan .slot').map((e) => r(e).bottom)),
    chipsInside: qa('.phasebar .chip').every((c) => r(c).left >= r(bar).left - 1 && r(c).right <= r(bar).right + 1 && c.scrollWidth <= c.clientWidth + 1),
    overflow: document.documentElement.scrollWidth - innerWidth,
    platesX: plates.map((p) => [r(p).left, r(p).right]),
    gapPlateHand: r(hand).top - r(mybar).bottom,
    vw: innerWidth, vh: innerHeight,
  };
});

const browser = await webkit.launch();
let failures = 0;
for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  const fails = [];
  const near = (label, got, want) => { if (Math.abs(got - want) > TOL) fails.push(`${label}: ${got.toFixed(1)} (esperado ${want.toFixed(1)})`); };
  const check = (label, ok, detail) => { if (!ok) fails.push(`${label}: ${detail}`); };
  try {
    await enterDuel(page);
    const m = await measure(page);
    const e = expected(w, h);
    near('campo', m.field, e.mat);
    near('zona monstro (largura)', m.zoneM[0], e.zone);
    near('zona monstro (altura)', m.zoneM[1], e.zone);
    near('zona M/A (altura)', m.zoneS, m.zoneM[1] * ST_RATIO);
    near('faixa central', m.mid, CENTER_GAP);
    if (h >= 780) near('carta da mão', m.handCard, e.hand);
    else check('carta da mão (tela baixa)', m.handCard >= MIN_HAND_CARD, `${m.handCard}px`);
    check('mão cortada', m.handBottom <= m.vh + TOL, `base em ${m.handBottom.toFixed(0)} de ${m.vh}`);
    check('chips', m.chipsInside, 'algum chip sai da barra ou está cortado');
    check('overflow horizontal', m.overflow <= 0, `${m.overflow}px`);
    for (const [l, rt] of m.platesX) check('margem lateral das placas', l >= SIDE_MARGIN - 1 && rt <= m.vw - SIDE_MARGIN + 1, `${l.toFixed(0)}..${rt.toFixed(0)}`);
    if (h >= 844) check('respiro entre placa e mão', m.gapPlateHand >= GAP, `${m.gapPlateHand.toFixed(0)}px`);
  } catch (err) { fails.push(`roteiro: ${err.message}`); }
  console.log(`${w}x${h}: ${fails.length ? 'FALHOU' : 'ok'}`);
  fails.forEach((f) => console.log('  -', f));
  failures += fails.length;
  await ctx.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
