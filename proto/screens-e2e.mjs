// Telas fora do duelo na tela larga (change layout-desktop-telas), no WebKit: boas-vindas, título, editor, mapa,
// Coleção, Laços, loja e detalhe do pacote, em 3 tamanhos de desktop. Confere colunas, larguras máximas e transbordo.
// Uso: node proto/screens-e2e.mjs [url=http://127.0.0.1:5181/]   (sai com código 1 se alguma medida falhar)
import { webkit } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:5181/';
const VIEWPORTS = [[1440, 900], [1280, 650], [1024, 768]];
const COL_MAX = 640, TOL = 2, COVER_MAX = 190;

const browser = await webkit.launch();
let failures = 0;
for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const fails = [];
  let step = 'início';
  const check = (label, ok, detail = '') => { if (!ok) fails.push(`${label}${detail ? `: ${detail}` : ''}`); };
  const btn = (t) => page.locator('button', { hasText: t }).first();
  const back = () => page.locator('button[aria-label="Voltar"]').first().click();
  const width = (sel) => page.locator(sel).first().evaluate((e) => e.getBoundingClientRect().width);
  const noOverflow = async (where) => {
    const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(`${where}: sem rolagem horizontal`, o <= 0, `${o}px`);
  };
  try {
    await page.goto(url);
    // Boas-vindas: coluna central.
    step = 'boas-vindas';
    await page.locator('input[placeholder="Seu nome"]').waitFor();
    check('boas-vindas: botão Começar na coluna', (await width('.screen-foot button')) <= COL_MAX + TOL, `${await width('.screen-foot button')}px`);
    await noOverflow('boas-vindas');
    await page.fill('input[placeholder="Seu nome"]', 'Telas');
    await btn('Começar').click();
    // Título.
    step = 'título';
    await page.locator('.titlebtns').waitFor();
    check('título: botões na coluna', (await width('.titlebtns')) <= COL_MAX + TOL, `${await width('.titlebtns')}px`);
    // O preset de conferência só vale com perfil já criado: recarrega com ele (duelistas conhecidos, eventos de laço).
    await page.goto(`${url}?campaign=bond`);
    await page.locator('.titlebtns').waitFor();
    // Mapa.
    step = 'mapa';
    await page.locator('.titleplay').evaluate((el) => el.click());
    await page.locator('.mapnav').waitFor();
    const nav = await page.locator('.mapnav button').evaluateAll((bs) => { const r = bs.map((b) => b.getBoundingClientRect()); return r[r.length - 1].right - r[0].left; });
    check('mapa: atalhos contidos', nav <= 720 + TOL, `${Math.round(nav)}px`);
    await noOverflow('mapa');
    // Editor: três colunas lado a lado.
    step = 'editor';
    await page.locator('.mapnav button', { hasText: 'Deck' }).click();
    await page.locator('.deckeditor.wide').waitFor();
    const cols = await page.evaluate(() => ['.deckpanel', '.trunk', '.deckside'].map((s) => document.querySelector(s)?.getBoundingClientRect().left ?? -1));
    check('editor: deck | maleta | painel', cols.every((x) => x >= 0) && cols[0] < cols[1] && cols[1] < cols[2], JSON.stringify(cols.map(Math.round)));
    check('editor: sem gaveta', (await page.locator('.drawerhandle').count()) === 0);
    // Tamanho M (padrão, 108px): a carta da maleta fica entre o alvo e menos que o dobro (não cresce com a tela).
    const cell = await width('.trunkgrid .cell');
    check('editor: carta da maleta no tamanho M', cell >= 100 && cell < 2 * 108, `${Math.round(cell)}px`);
    await noOverflow('editor');
    await back();
    // Coleção: grade + painel.
    step = 'Coleção';
    await page.locator('.mapnav button', { hasText: 'Coleção' }).click();
    await page.locator('.collection.wide .deckside').waitFor();
    await noOverflow('Coleção');
    await back();
    // Laços: 2 colunas (os dois primeiros cartões na mesma altura).
    step = 'Laços';
    await page.locator('.mapnav button', { hasText: 'Laços' }).click();
    await page.locator('.bondcard').first().waitFor();
    const tops = await page.locator('.bondcard').evaluateAll((cs) => cs.slice(0, 2).map((c) => Math.round(c.getBoundingClientRect().top)));
    check('Laços: 2 colunas', tops.length < 2 || tops[0] === tops[1], JSON.stringify(tops));
    await back();
    // Loja: capas com teto; detalhe do pacote com a barra contida.
    step = 'loja';
    await page.locator('.mapnav button', { hasText: 'Loja' }).click();
    await page.locator('.shopgrid .packcover').first().waitFor();
    const cover = await width('.shopgrid .packcover');
    check('loja: capa com teto', cover <= COVER_MAX + TOL, `${Math.round(cover)}px`);
    await noOverflow('loja');
    await page.locator('.shopcell:not(.locked)').first().click();
    await page.locator('.packdetail .packcards').waitFor();
    const buy = await width('.buybar .acts');
    check('detalhe: barra de compra contida', buy <= 720 + TOL, `${Math.round(buy)}px`);
    await noOverflow('detalhe do pacote');
  } catch (err) { fails.push(`roteiro (${step}): ${err.message.split('\n')[0]}`); }
  console.log(`${w}x${h}: ${fails.length ? 'FALHOU' : 'ok'}`);
  fails.forEach((f) => console.log('  -', f));
  failures += fails.length;
  await ctx.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
