// E2E do editor de deck no WebKit (change editor-nativo): gaveta nas 3 posições → ordenar → zoom (tirar e pôr) →
// arrastar da maleta para o deck e de volta → recusa da 4ª cópia → rolar sem arrastar → trocar o deck em uso → Coleção.
// Uso: node proto/deck-e2e.mjs [url=http://127.0.0.1:5180/] [--reduzir]   (o dev server, por causa do ?campaign=)
import { webkit, devices } from 'playwright';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
const url = args[0] ?? 'http://127.0.0.1:5180/';
const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], hasTouch: false, isMobile: false, reducedMotion: flags.has('--reduzir') ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const btn = (t) => page.locator('button', { hasText: t }).first();
const check = (ok, msg) => { if (!ok) throw new Error(msg); console.log('ok:', msg); };
const mainCount = async () => Number((await page.locator('.deckhead .dcount b').first().innerText()).trim());
const center = async (loc) => { const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
/** Segura a carta, arrasta até o alvo e solta (mouse: os mesmos pointer events do toque). */
async function drag(from, to) {
  const a = await center(from), b = await center(to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.waitForTimeout(450);
  await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 5 });
  await page.mouse.move(b.x, b.y, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(450);
}
let failed = false;
try {
  await page.goto(url);
  await page.fill('input[placeholder="Seu nome"]', 'WebKit');
  await btn('Começar').click();
  await page.goto(`${url}?campaign=shop`);
  await page.locator('.titleplay').click();
  // Pacotes ganhos primeiro: cartas que o deck inicial não tem, para arrastar.
  await btn('Loja').click();
  for (let i = 0; i < 3; i++) {
    await btn('Abrir pacote grátis').click();
    await page.getByRole('button', { name: 'Abrir o pacote' }).click();
    await btn('Revelar tudo').click();
    await btn('Pronto').click();
  }
  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.locator('.mapnav button', { hasText: 'Deck' }).click();
  check((await mainCount()) === 30 && (await page.getByText('PRONTO').count()) === 1, 'editor abre com Main 30 e PRONTO');

  // Gaveta: meio → aberta → recolhida → meio.
  const h = async () => (await page.locator('.deckpanel').boundingBox()).height;
  const mid = await h();
  await page.locator('.drawerhandle').click(); await page.waitForTimeout(400);
  const open = await h();
  await page.locator('.drawerbtn').click(); await page.waitForTimeout(400);
  const closed = await h();
  check(open < mid && closed > mid && (await page.locator('.handlesum').count()) === 1, `gaveta: aberta ${Math.round(open)} < meio ${Math.round(mid)} < recolhida ${Math.round(closed)}`);
  await page.locator('.drawerhandle').click(); await page.waitForTimeout(400);

  // Ordenar por ATK.
  await page.locator('.sortbtn').click();
  await page.getByRole('button', { name: 'ATK', exact: true }).click();
  check((await page.locator('.sortbtn').innerText()).includes('ATK'), 'ordem por ATK');

  // Zoom: tirar e pôr.
  await page.locator('.deckpanel .cell').first().click();
  await btn('Tirar do deck').click();
  check((await mainCount()) === 29, 'zoom: tirar deixa 29');
  await btn('Pôr no deck').click();
  check((await mainCount()) === 30, 'zoom: pôr volta a 30');
  await page.locator('.zoom-foot button').click();

  // Arrastar uma carta do deck para a maleta e uma fora do deck (sem marca) de volta: o deck está cheio (30), então tira
  // antes de pôr. Por Obtenção, as dos pacotes vêm primeiro (a grade é virtual: só as linhas da tela existem).
  await page.locator('.sortbtn').click();
  await page.getByRole('button', { name: 'Obtenção', exact: true }).click();
  await drag(page.locator('.deckpanel .cell').first(), page.locator('.trunkgrid'));
  check((await mainCount()) === 29, 'arrastar do deck para a maleta: 29');
  const free = page.locator('.trunkgrid .cell:not(.indeck)').first();
  await drag(free, page.locator('.deckpanel'));
  check((await mainCount()) === 30, 'arrastar da maleta para o deck: 30');
  check((await page.locator('.cardzoom').count()) === 0, 'o arrastar não abre o zoom');

  // Recusa: uma carta com todas as cópias no deck.
  const full = page.locator('.trunkgrid .cell.indeck').first();
  const name = (await full.getAttribute('aria-label')).replace(', no deck', '');
  const before = await mainCount();
  // procura uma cópia dela sem marca; se todas estão no deck, arrastar a marcada é recusado
  await page.locator('.searchbox input').fill(name);
  await page.waitForTimeout(200);
  const allMarked = (await page.locator('.trunkgrid .cell:not(.indeck)').count()) === 0;
  await drag(page.locator('.trunkgrid .cell').first(), page.locator('.deckpanel'));
  if (allMarked) {
    check((await mainCount()) === before && (await page.locator('.decktoast').count()) === 1, `recusa: "${await page.locator('.decktoast').innerText()}"`);
  } else console.log('(pulado: a carta tinha cópia sobrando)');
  await page.locator('.searchbox input').fill('');

  // Rolar a maleta sem segurar não arrasta.
  const grid = page.locator('.trunkgrid');
  const g = await center(grid);
  const n0 = await mainCount();
  await page.mouse.move(g.x, g.y); await page.mouse.down(); await page.mouse.move(g.x, g.y - 150, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(300);
  check((await mainCount()) === n0 && (await page.locator('.cardzoom').count()) === 0, 'rolar sem segurar não muda o deck nem abre o zoom');

  // Trocar o deck em uso.
  await page.getByRole('button', { name: 'Escolher o deck' }).click();
  await btn('Novo deck').click();
  check((await page.locator('.decklist li').count()) === 2, 'novo deck criado');
  const usar = page.getByRole('button', { name: 'Usar este deck' });
  check(await usar.isDisabled(), 'deck vazio não pode ser usado');
  await btn('Fechar').click();
  await page.getByRole('button', { name: 'Voltar' }).click();

  // Coleção pelo mapa e Status pelas Opções.
  await page.locator('.mapnav button', { hasText: 'Coleção' }).click();
  check((await page.locator('.colltotals').innerText()).includes('Cartas diferentes'), 'Coleção com os totais');
  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByRole('button', { name: 'Menu' }).click();
  await btn('Status da campanha').click();
  check((await page.locator('.app').innerText()).includes('Dia'), 'Status pelas Opções');
  if (errors.length) throw new Error(`erros na página: ${errors.join(' | ')}`);
  console.log(`\nFLUXO DO EDITOR OK${flags.has('--reduzir') ? ' (reduzir movimento)' : ''}`);
} catch (e) {
  failed = true;
  console.log('FALHOU:', e.message);
  await page.screenshot({ path: '/tmp/deck-e2e-fail.png' }).catch(() => {});
} finally {
  await browser.close();
  process.exit(failed ? 1 : 0);
}
