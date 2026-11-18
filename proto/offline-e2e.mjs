// E2E do cache offline no WebKit (motor do Safari), contra o preview (npx vite build && npx vite preview --port 5181).
// 1) instala (service worker com a pré-carga), começa a campanha e abre os pacotes grátis na loja (faces desenhadas);
// 2) confere os caches (pré-carga, card-thumb; o card-art antigo não existe);
// 3) offline: recarrega e começa o primeiro duelo com o deck inicial; as cartas da mão têm arte;
// 4) apaga todos os caches, volta online e reabre: o save continua e as artes voltam a carregar.
// Uso: node proto/offline-e2e.mjs [url=http://127.0.0.1:5181/]
import { webkit, devices } from 'playwright';
const url = process.argv[2] ?? 'http://127.0.0.1:5181/';
const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const btn = (t) => page.locator('button', { hasText: t }).first();
const ok = (cond, msg) => { console.log(`${cond ? 'OK  ' : 'FALHA'} ${msg}`); if (!cond) process.exitCode = 1; };
/** Imagens de carta carregadas (naturalWidth > 0) e quebradas dentro de `sel`. */
const arts = (sel) => page.evaluate((s) => {
  const imgs = [...document.querySelectorAll(`${s} .cf-art img`)];
  return { total: document.querySelectorAll(`${s} .cardface`).length, loaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length, empty: document.querySelectorAll(`${s} .cf-art.empty`).length };
}, sel);
const caches = () => page.evaluate(async () => Object.fromEntries(await Promise.all((await self.caches.keys()).map(async (k) => [k, (await (await self.caches.open(k)).keys()).length]))));

try {
  // 1. Instalação e loja
  await page.goto(url);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // a página passa a ser controlada pelo service worker
  await page.fill('input[placeholder="Seu nome"]', 'Offline');
  await btn('Começar').click();
  await page.locator('.titleplay').click();
  await page.locator('.mapnav button', { hasText: 'Loja' }).click();
  await btn('Abrir').click();
  await page.waitForTimeout(2500);
  const shop = await arts('.cardgrid');
  ok(shop.total >= 5 && shop.loaded === shop.total, `loja: ${shop.total} faces desenhadas, ${shop.loaded} com arte`);
  const reqOld = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => /cards\/(small|large|cropped)\//.test(e.name)).length);
  ok(reqOld === 0, 'nenhum pedido para as cartas inteiras em inglês');
  await btn('Pronto').click();

  // 2. Caches
  const c1 = await caches();
  const pre = Object.entries(c1).find(([k]) => k.includes('precache'));
  ok(pre && pre[1] > 200, `pré-carga: ${pre?.[1]} entradas`);
  // As cartas do pacote que já são do deck inicial vêm da pré-carga; as outras entram no card-thumb.
  ok((c1['card-thumb'] ?? 0) > 0, `card-thumb: ${c1['card-thumb'] ?? 0} entradas`);
  ok(!('card-art' in c1), 'cache antigo card-art não existe');

  // 3. Offline: primeiro duelo com o deck inicial
  await ctx.setOffline(true);
  await page.reload();
  await page.locator('.titleplay').click();
  await page.locator('.pinhead:not(.boss)').first().evaluate((el) => el.click()); // fora da tela no panorama: o clique forçado acertava outro ponto
  await btn('Pular').click();
  await page.locator('.scene-menu button', { hasText: /^\s*Duelar\s*$/ }).click();
  await btn('Pular').click();
  await page.waitForSelector('.handfan .cardface', { timeout: 30000 });
  await page.waitForTimeout(3000);
  const hand = await arts('.handfan');
  ok(hand.total > 0 && hand.loaded === hand.total, `offline: mão com ${hand.total} cartas, ${hand.loaded} com arte`);
  // Offline, a arte fora do cache (cartas do oponente, fundos da campanha ainda não vistos) e a música falham por rede ("no-response" do service worker):
  // esperado (a face mostra o preenchimento). Qualquer outro erro conta.
  const real = errors.filter((e) => !/no-response|\/cards\/thumb\/|\/music\/|\/campaign\//.test(e));
  ok(real.length === 0, `sem erros na página além das faltas de rede esperadas (${errors.length - real.length} esperadas)`);

  // 4. Caches apagados pelo sistema, de volta online
  await ctx.setOffline(false);
  await page.evaluate(async () => { for (const k of await self.caches.keys()) await self.caches.delete(k); });
  await page.goto(url);
  await page.waitForSelector('.titleplay', { timeout: 30000 });
  const title = await page.locator('.titleplay').innerText();
  ok(/Continuar/.test(title), `save intacto depois de apagar os caches (${title.replace(/\s+/g, ' ').trim()})`);
  await btn('Meu deck').click();
  await page.waitForTimeout(2500);
  const grid = await arts('.cardgrid');
  ok(grid.total > 0 && grid.loaded === grid.total, `editor: ${grid.total} faces, ${grid.loaded} com arte baixada de novo`);
} catch (e) {
  console.log('FALHA', e.message);
  process.exitCode = 1;
} finally {
  const real = errors.filter((e) => !/no-response|\/cards\/thumb\/|\/music\/|\/campaign\//.test(e));
  if (real.length) console.log('erros:', real);
  await browser.close();
}
