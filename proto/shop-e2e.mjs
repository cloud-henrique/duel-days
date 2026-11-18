// E2E da loja no WebKit (change loja-nativa): pacote ganho → vitrine → detalhe → comprar 1 → rasgar → revelar tudo →
// pronto (saldo novo) → caixa com confirmação → "Abrir todos" → resumo com 100 cartas, Ultras primeiro.
// Uso: node proto/shop-e2e.mjs [url=http://127.0.0.1:5180/] [--reduzir]   (o dev server, por causa do ?campaign=shop)
import { webkit, devices } from 'playwright';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
const url = args[0] ?? 'http://127.0.0.1:5180/';
const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: flags.has('--reduzir') ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const btn = (t) => page.locator('button', { hasText: t }).first();
const balance = () => page.locator('.shopcounter .balance').getAttribute('aria-label');
const check = (ok, msg) => { if (!ok) throw new Error(msg); console.log('ok:', msg); };
let failed = false;
try {
  // Cria o save (boas-vindas) e reabre com o preset da loja.
  await page.goto(url);
  await page.fill('input[placeholder="Seu nome"]', 'WebKit');
  await btn('Começar').click();
  await page.goto(`${url}?campaign=shop`);
  await page.locator('.titleplay').click();
  await btn('Loja').click();
  check(await page.locator('.shopcounter .speech').count() === 1, 'o vovô dá as boas-vindas');
  check((await balance()) === '6000 DP', 'saldo 6000 DP no balcão');

  // Pacote ganho: abre aqui mesmo.
  await btn('Abrir pacote grátis').click();
  await page.getByRole('button', { name: 'Abrir o pacote' }).click();
  await btn('Revelar tudo').click();
  check(await page.locator('.revealcard.flipped').count() === 5, 'pacote ganho: 5 cartas viradas');
  await btn('Pronto').click();
  check(await page.getByText('2 pacotes esperando por você.').count() === 1, 'sobram 2 pacotes ganhos');

  // Bloqueado: só balança.
  await page.getByRole('button', { name: /^Labyrinth of Nightmare/ }).click();
  check((await page.getByRole('status').innerText()).includes('Tier 2'), 'bloqueado mostra o motivo');

  // Detalhe e compra de 1.
  await page.getByRole('button', { name: /^Metal Raiders/ }).click();
  check(/de \d+ cartas/.test(await page.locator('.packdetail .owned').innerText()), 'detalhe mostra "X de Y cartas"');
  await page.getByRole('button', { name: /Comprar 1 pacote/ }).click();
  await page.getByRole('button', { name: 'Abrir o pacote' }).click();
  await page.waitForTimeout(500);
  await page.locator('.revealcard .flipper').first().click();
  await btn('Revelar tudo').click();
  await btn('Pronto').click();
  await page.waitForTimeout(900);
  check((await balance()) === '5800 DP', 'saldo 5800 DP depois de 1 MRD');

  // Caixa: cancelar não gasta; comprar abre pacote a pacote.
  await page.getByRole('button', { name: /Caixa · 20 pacotes/ }).click();
  await btn('Cancelar').click();
  check((await balance()) === '5800 DP', 'cancelar a caixa não gasta');
  await page.getByRole('button', { name: /Caixa · 20 pacotes/ }).click();
  await btn('Comprar a caixa').click();
  check((await page.locator('.opening .topbar').innerText()).includes('Pacote 1 de 20'), 'caixa: "Pacote 1 de 20"');
  await btn('Abrir todos').click();
  const cells = page.locator('.summarygrid .cell');
  check(await cells.count() === 100, 'resumo com 100 cartas');
  const first = await cells.first().getAttribute('class');
  const last = await cells.last().getAttribute('class');
  check(/r-(UR|SR|R)/.test(first) && /r-N/.test(last), `resumo da raridade alta para a comum (${first} … ${last})`);
  await btn('Pronto').click();
  await page.waitForTimeout(900);
  check((await balance()) === '2200 DP', 'saldo 2200 DP depois da caixa (3600)');
  check(await page.locator('.shopcounter .speech').count() === 1, 'o vovô comenta a caixa');
  if (errors.length) throw new Error(`erros na página: ${errors.join(' | ')}`);
  console.log(`\nFLUXO DA LOJA OK${flags.has('--reduzir') ? ' (reduzir movimento)' : ''}`);
} catch (e) {
  failed = true;
  console.log('FALHOU:', e.message);
  await page.screenshot({ path: '/tmp/shop-e2e-fail.png' }).catch(() => {});
} finally {
  await browser.close();
  process.exit(failed ? 1 : 0);
}
