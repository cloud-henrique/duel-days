// E2E no WebKit (motor do Safari): novo jogo -> cena -> duelo -> invocar -> espera o próximo pedido de jogada.
// Uso: node proto/webkit-e2e.mjs [url=http://127.0.0.1:5181/]
import { webkit, devices } from 'playwright';
const url = process.argv[2] ?? 'http://127.0.0.1:5181/';
const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[page ${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[page error] ${e.message}`));
page.on('worker', (w) => { logs.push(`[worker criado] ${w.url()}`); w.on('console', (m) => logs.push(`[worker ${m.type()}] ${m.text()}`)); w.on('close', () => logs.push('[worker fechado]')); });
const btn = (t) => page.locator('button', { hasText: t }).first();
const state = () => page.evaluate(() => ({
  fase: document.querySelector('.chip.on')?.textContent, turno: document.querySelector('.phasebar .turn')?.textContent,
  side: [...document.querySelectorAll('.sidebtns button')].map((b) => b.textContent),
  painel: [...document.querySelectorAll('.scrim .sheet')].pop()?.innerText.slice(0, 80) ?? null,
  campo: document.querySelectorAll('.field .slot img').length, brilho: document.querySelectorAll('.handfan .slot.hl').length,
}));
try {
  await page.goto(url);
  await page.fill('input[placeholder="Seu nome"]', 'WebKit');
  await btn('Novo jogo').click();
  await page.locator('.charchip').first().click();
  await btn('Pular').click();
  await btn('Aceitar o duelo').click();
  await btn('Pular').click();
  // espera o primeiro pedido e responde correntes com "Não" até chegar ao menu principal
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(800);
    const s = await state();
    if (s.side.length) break;
    if (s.painel?.startsWith('Responder')) await btn('Não').click();
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
} catch (e) { console.log('falha no roteiro:', e.message); }
console.log('--- logs ---\n' + logs.slice(-40).join('\n'));
await browser.close();
