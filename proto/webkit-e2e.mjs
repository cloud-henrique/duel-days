// E2E no WebKit (motor do Safari): novo jogo -> cena -> duelo -> invocar -> espera o próximo pedido de jogada.
// Uso: node proto/webkit-e2e.mjs [url=http://127.0.0.1:5181/] [animações: normal|rápida|desligada] [--reduzir] [--turno]
// --reduzir emula "reduzir movimento"; --turno passa o turno e espera o oponente jogar (efeitos registrados no fim).
import { webkit, devices } from 'playwright';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
const url = args[0] ?? 'http://127.0.0.1:5181/';
const anim = { normal: 'Normal', rapida: 'Rápida', 'rápida': 'Rápida', desligada: 'Desligada', off: 'Desligada' }[args[1] ?? ''] ?? null;
const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: flags.has('--reduzir') ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
// Registro dos efeitos da encenação: classe de cada nó na camada e se a animação dele desloca, gira ou escala.
await page.addInitScript(() => {
  window.__fx = [];
  const moves = (el) => el.getAnimations().some((a) => a.effect.getKeyframes().some((k) => /translate|rotate|scale/.test(k.transform ?? '')));
  new MutationObserver(() => {
    const layer = document.querySelector('.fxlayer');
    if (!layer || layer.__obs) return;
    layer.__obs = new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.className) window.__fx.push({ cls: n.className, move: moves(n) || [...n.children].some(moves) }); });
    layer.__obs.observe(layer, { childList: true });
  }).observe(document, { childList: true, subtree: true });
});
const logs = [];
page.on('console', (m) => logs.push(`[page ${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[page error] ${e.message}`));
page.on('worker', (w) => { logs.push(`[worker criado] ${w.url()}`); w.on('console', (m) => logs.push(`[worker ${m.type()}] ${m.text()}`)); w.on('close', () => logs.push('[worker fechado]')); });
const btn = (t) => page.locator('button', { hasText: t }).first();
const state = () => page.evaluate(() => ({
  fase: document.querySelector('.chip.on')?.textContent, narrador: document.querySelector('.phasebar .narr')?.textContent,
  side: [...document.querySelectorAll('.sidebtns button')].map((b) => b.textContent),
  painel: [...document.querySelectorAll('.scrim .sheet')].pop()?.innerText.slice(0, 80) ?? null,
  campo: document.querySelectorAll('.field .zone .cardface').length, brilho: document.querySelectorAll('.handfan .slot.hl').length,
}));
try {
  await page.goto(url);
  await page.fill('input[placeholder="Seu nome"]', 'WebKit');
  // Boas-vindas (nome; avatar e tratamento padrão) → título → Campanha → um lugar com gente → Encontrar → Duelar.
  await btn('Começar').click();
  await page.locator('.titleplay').click();
  await page.locator('.mappin:not(.empty):not(.shop)').first().click({ force: true });
  await page.locator('.placepanel .person').first().click();
  await btn('Pular').click();
  await page.locator('.scene-menu button', { hasText: /^\s*Duelar\s*$/ }).click();
  await btn('Pular').click();
  // espera o primeiro pedido e responde correntes com "Não" até chegar ao menu principal
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(800);
    const s = await state();
    if (s.side.length) break;
    if (s.painel?.startsWith('Responder')) await btn('Não').click();
  }
  // Velocidade das animações pelo menu do duelo (fica salva para o resto do roteiro).
  if (anim) {
    await page.locator('button[aria-label="Menu"]').click();
    await btn(anim).click();
    await btn('Voltar ao duelo').click();
    console.log('animações:', anim);
  }
  console.log('menu principal:', await state());
  const slots = page.locator('.handfan .slot.hl');
  const n = await slots.count();
  let acted = false;
  for (let i = 0; i < n && !acted; i++) {
    await slots.nth(i).click();
    await page.waitForTimeout(300);
    for (const label of ['Invocar', 'Baixar']) {
      const b = page.locator('.sheet .acts button', { hasText: label });
      if (await b.count()) { console.log('ação:', label, 'em', await page.locator('.cardsheet .nm').innerText()); await b.first().click(); acted = true; break; }
    }
    if (!acted) await page.locator('.scrim').first().click({ position: { x: 10, y: 10 } });
  }
  for (let t = 0; t < 16; t++) { await page.waitForTimeout(1000); const s = await state(); if (s.side.length || s.painel) { console.log(`depois da ação (${t + 1}s):`, s); break; } if (t === 15) console.log('NADA depois de 16s:', s); }
  if (flags.has('--turno')) {
    // Um botão só, fase a fase (BATALHA → MAIN 2 → FIM DO TURNO), até o turno passar ao oponente.
    for (let k = 0; k < 4; k++) {
      const side = page.locator('.sidebtns button:not(.wait)');
      if (!(await side.count())) break;
      const label = await side.first().innerText();
      await side.first().click();
      if (/FIM DO TURNO/.test(label)) break;
      await page.waitForTimeout(1200);
    }
    for (let t = 0; t < 40; t++) {
      await page.waitForTimeout(1000);
      const s = await state();
      if (s.painel?.startsWith('Responder')) { await btn('Não').click(); continue; }
      if (t > 2 && s.side.some((x) => /FIM DO TURNO|BATALHA/.test(x))) { console.log(`turno do oponente encenado (${t + 1}s):`, s); break; }
    }
  }
  const fx = await page.evaluate(() => window.__fx);
  const kinds = [...new Set(fx.map((f) => f.cls))];
  console.log('efeitos:', kinds.join(', ') || '(nenhum)', '| com deslocamento/giro/escala:', fx.filter((f) => f.move).length, 'de', fx.length,
    '| atacantes:', fx.filter((f) => /attacker/.test(f.cls)).length, '| flashes:', fx.filter((f) => /flash/.test(f.cls)).length);
} catch (e) { console.log('falha no roteiro:', e.message); }
console.log('--- logs ---\n' + logs.slice(-40).join('\n'));
await browser.close();
