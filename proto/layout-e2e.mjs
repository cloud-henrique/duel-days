// Medidas do HUD do duelo no WebKit (spec duel-hud, change tabuleiro-plano): zonas, pilhas, faixa central, placa, mão,
// chips, respiro e overflow. Também a tela larga (change layout-desktop): 3 colunas em desktop e tablet deitado, e o
// celular deitado continua no retrato.
// Uso: node proto/layout-e2e.mjs [url=http://127.0.0.1:5181/]   (sai com código 1 se alguma medida falhar)
import { webkit } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:5181/';
const VIEWPORTS = [[360, 780], [390, 844], [390, 709], [430, 932], [375, 667]];
const TOL = 2; // px de tolerância
// Tela larga (WIDE_QUERY: paisagem ≥ 900×600) e um celular deitado, que fica no retrato.
const WIDE_VIEWPORTS = [[1440, 900], [1280, 650], [1024, 768]];
const PHONE_LANDSCAPE = [844, 390];

// Medidas da change speed-duel (spec duel-hud): campo plano do Duel Links, 3 zonas por fileira com as pilhas nas pontas,
// zonas na proporção da carta e placa fina.
const CARD_RATIO = 0.686, GAP = 6, CENTER_GAP = 38, PLATE_H = 48, SIDE_MARGIN = 12, MIN_HAND_CARD = 60;
const MIN_FIELD_CARD = 46, FIELD_CARD_390 = 60, HAND_CARD_MAX = 132, FIELD_EDGE = 4;

async function enterDuel(page) {
  const btn = (t) => page.locator('button', { hasText: t }).first();
  await page.goto(url);
  await page.fill('input[placeholder="Seu nome"]', 'Layout');
  // Boas-vindas (nome; avatar e tratamento padrão) → tela de título → Jogar.
  await btn('Começar').click();
  await page.locator('.titleplay').evaluate((el) => el.click()); // no celular deitado o logo do título cobre o botão
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
  const rows = qa('.field .row');
  const zm = (i) => rows[i].querySelector(':scope > .zone');
  const locs = (el) => [...el.querySelectorAll('[data-loc]')].map((e) => e.dataset.loc).join('+');
  return {
    zoneFoe: [r(zm(1)).width, r(zm(1)).height], zoneMe: [r(zm(2)).width, r(zm(2)).height],
    zoneS: r(zm(0)).height,
    mid: q('.midrow').offsetHeight,
    zonesPerRow: rows.map((row) => row.querySelectorAll(':scope > .zone').length),
    sides: rows.map((row) => [locs(row.firstElementChild), locs(row.lastElementChild)]),
    sidesInside: rows.every((row) => [row.firstElementChild, row.lastElementChild].every((s) => {
      const b = r(s); return [...s.children].every((c) => r(c).top >= b.top - 1 && r(c).bottom <= b.bottom + 1 && r(c).right <= b.right + 1);
    })),
    fieldInside: (() => { const f = r(q('.fieldwrap')); return f.left >= -1 && f.right <= innerWidth + 1; })(),
    handCard: q('.handfan .slot')?.offsetWidth ?? 0,
    handBottom: Math.max(...qa('.handfan .slot').map((e) => r(e).bottom)),
    handTops: qa('.handfan .slot:not(.lift)').map((e) => r(e).top),
    fieldX: [r(q('.fieldwrap')).left, r(q('.fieldwrap')).right],
    pileVsZone: [r(q('.field .row .side')).width, r(q('.field .row > .zone')).width],
    chipsInside: qa('.phasebar .chip').every((c) => r(c).left >= r(bar).left - 1 && r(c).right <= r(bar).right + 1 && c.scrollWidth <= c.clientWidth + 1),
    overflowX: document.documentElement.scrollWidth - innerWidth,
    overflowY: document.documentElement.scrollHeight - innerHeight,
    platesX: plates.map((p) => [r(p).left, r(p).right]),
    plateH: plates.map((p) => r(p).height),
    menu: (() => { const m = q('.menubtn'), p = plates[0]; return m ? [r(m).top - r(p).top, r(m).bottom - r(p).bottom] : [0, 0]; })(),
    gapPlateHand: r(hand).top - r(mybar).bottom,
    gapFoeHandField: r(q('.fieldwrap')).top - r(q('.foehand')).bottom,
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
    const card = m.zoneMe[1] * CARD_RATIO; // a carta ocupa a altura da zona
    near('zonas iguais (largura)', m.zoneFoe[0], m.zoneMe[0]);
    near('zonas iguais (altura)', m.zoneFoe[1], m.zoneMe[1]);
    near('zona M/A (altura)', m.zoneS, m.zoneMe[1]);
    check('zona na proporção da carta', m.zoneMe[0] >= card - 1 && m.zoneMe[0] <= card + 2 * 3 + TOL, `${m.zoneMe[0].toFixed(1)} para carta de ${card.toFixed(1)}`);
    check('carta do campo (mínimo)', card >= MIN_FIELD_CARD - 0.5, `${card.toFixed(1)}px`);
    if (w === 390 && h === 844) check('carta do campo em 390×844', card >= FIELD_CARD_390, `${card.toFixed(1)}px`);
    near('faixa central', m.mid, CENTER_GAP);
    check('3 zonas por fileira', m.zonesPerRow.every((n) => n === 3), JSON.stringify(m.zonesPerRow));
    check('pilhas nas pontas', JSON.stringify(m.sides) === JSON.stringify([['1:deck', '1:extra'], ['1:grave+1:removed', '1:szone:5'], ['0:szone:5', '0:removed+0:grave'], ['0:extra', '0:deck']]), JSON.stringify(m.sides));
    check('pilhas dentro da ponta', m.sidesInside, 'alguma pilha passa da altura da fileira');
    check('campo dentro da tela', m.fieldInside, 'o campo sai pela lateral');
    check('mão reta', Math.max(...m.handTops) - Math.min(...m.handTops) <= 1, JSON.stringify(m.handTops.map(Math.round)));
    check('pontas não mais largas que as zonas', m.pileVsZone[0] <= m.pileVsZone[1] + 1, JSON.stringify(m.pileVsZone));
    // Enquanto as pontas não chegam à largura de uma zona, o campo vai de borda a borda (spec "Campo na largura da tela").
    if (m.pileVsZone[0] < m.pileVsZone[1] - 1) check('campo de borda a borda', m.fieldX[0] <= FIELD_EDGE + TOL && m.fieldX[1] >= m.vw - FIELD_EDGE - TOL, JSON.stringify(m.fieldX.map(Math.round)));
    check('carta da mão', m.handCard >= MIN_HAND_CARD - 0.5 && m.handCard <= HAND_CARD_MAX + 0.5, `${m.handCard}px`);
    check('mão cortada', m.handBottom <= m.vh + TOL, `base em ${m.handBottom.toFixed(0)} de ${m.vh}`);
    check('chips', m.chipsInside, 'algum chip sai da barra ou está cortado');
    check('overflow horizontal', m.overflowX <= 0, `${m.overflowX}px`);
    check('overflow vertical', m.overflowY <= 0, `${m.overflowY}px`);
    for (const [l, rt] of m.platesX) check('margem lateral das placas', l >= SIDE_MARGIN - 1 && rt <= m.vw - SIDE_MARGIN + 1, `${l.toFixed(0)}..${rt.toFixed(0)}`);
    m.plateH.forEach((ph) => near('altura da placa', ph, PLATE_H));
    check('menu da altura da placa', Math.abs(m.menu[0]) <= 1 && Math.abs(m.menu[1]) <= 1, JSON.stringify(m.menu));
    check('campo logo abaixo dos versos', Math.abs(m.gapFoeHandField - GAP) <= TOL, `${m.gapFoeHandField.toFixed(0)}px`);
    if (h >= 844) check('respiro entre placa e mão', m.gapPlateHand >= GAP, `${m.gapPlateHand.toFixed(0)}px`);
    console.log(`  carta do campo ${card.toFixed(1)} · mão ${m.handCard} · campo ${m.fieldX.map(Math.round).join('–')} de ${m.vw}`);
  } catch (err) { fails.push(`roteiro: ${err.message}`); }
  console.log(`${w}x${h}: ${fails.length ? 'FALHOU' : 'ok'}`);
  fails.forEach((f) => console.log('  -', f));
  failures += fails.length;
  await ctx.close();
}

// Tela larga: jogadores na coluna esquerda (oponente em cima), campo e mão no centro, painel e botão de fase à direita.
const measureWide = (page) => page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  const r = (e) => e.getBoundingClientRect();
  const L = r(q('.wleft')), C = r(q('.wcenter')), R = r(q('.wright')), f = r(q('.fieldwrap'));
  const inside = (b, box) => b.left >= box.left - 1 && b.right <= box.right + 1 && b.top >= box.top - 1 && b.bottom <= box.bottom + 1;
  const plates = qa('.plate').map(r);
  const bar = q('.phasebar');
  return {
    wide: !!q('.duel.wide'),
    platesLeft: plates.every((p) => inside(p, L)), foeOnTop: plates[0].top < plates[1].top,
    fieldCenter: inside(f, C), fieldMid: Math.abs((f.left + f.right) / 2 - (C.left + C.right) / 2),
    panelRight: inside(r(q('.cardpanel')), R), phaseRight: inside(r(q('.sidebtns')), R),
    card: r(q('.field .row > .zone')).height * 0.686,
    handBottom: Math.max(...qa('.handfan .slot').map((e) => r(e).bottom)), handIn: qa('.handfan .slot').every((e) => inside(r(e), C)),
    chipsInside: qa('.phasebar .chip').every((c) => r(c).left >= r(bar).left - 1 && r(c).right <= r(bar).right + 1),
    overflowX: document.documentElement.scrollWidth - innerWidth, overflowY: document.documentElement.scrollHeight - innerHeight,
    vh: innerHeight,
  };
});

for (const [w, h] of WIDE_VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const fails = [];
  const check = (label, ok, detail) => { if (!ok) fails.push(`${label}: ${detail}`); };
  try {
    await enterDuel(page);
    const m = await measureWide(page);
    check('layout de tela larga', m.wide, 'a tela não tem .duel.wide');
    check('placas na coluna esquerda', m.platesLeft, 'alguma placa sai da coluna');
    check('oponente em cima', m.foeOnTop, 'a placa do oponente não está acima');
    check('campo no centro', m.fieldCenter && m.fieldMid <= TOL, `desvio ${m.fieldMid.toFixed(1)}px`);
    check('painel na coluna direita', m.panelRight, 'o painel da carta sai da coluna');
    check('botão de fase na coluna direita', m.phaseRight, 'o botão sai da coluna');
    check('carta do campo (mínimo)', m.card >= MIN_FIELD_CARD - 0.5, `${m.card.toFixed(1)}px`);
    check('mão no centro e inteira', m.handIn && m.handBottom <= m.vh + TOL, `base em ${m.handBottom.toFixed(0)} de ${m.vh}`);
    check('chips', m.chipsInside, 'algum chip sai da barra');
    check('overflow horizontal', m.overflowX <= 0, `${m.overflowX}px`);
    check('overflow vertical', m.overflowY <= 0, `${m.overflowY}px`);
    console.log(`  carta do campo ${m.card.toFixed(1)}`);
  } catch (err) { fails.push(`roteiro: ${err.message}`); }
  console.log(`${w}x${h} (larga): ${fails.length ? 'FALHOU' : 'ok'}`);
  fails.forEach((f) => console.log('  -', f));
  failures += fails.length;
  await ctx.close();
}

{
  const [w, h] = PHONE_LANDSCAPE;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  let fail = null;
  try {
    await enterDuel(page);
    if (await page.locator('.duel.wide').count()) fail = 'o celular deitado entrou na tela larga';
  } catch (err) { fail = `roteiro: ${err.message}`; }
  console.log(`${w}x${h} (celular deitado): ${fail ? 'FALHOU' : 'ok (retrato)'}`);
  if (fail) { console.log('  -', fail); failures++; }
  await ctx.close();
}

await browser.close();
process.exit(failures ? 1 : 0);
