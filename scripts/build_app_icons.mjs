// Gera os ícones do PWA a partir de assets/app-icon/*.svg (rasteriza com o Chromium do Playwright).
// Uso: node scripts/build_app_icons.mjs   (precisa de `npx playwright install chromium`)
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (n) => readFileSync(join(root, 'assets/app-icon', n), 'utf8');
const out = join(root, 'public/icons');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }).catch((e) => {
  console.error('Chromium indisponível. Rode: npx playwright install chromium\n', e.message);
  process.exit(1);
});

// opaque: true pinta o fundo #050c1f atrás (sem alfa, como o iOS exige).
async function raster(svgName, size, { opaque = false } = {}) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const bg = opaque ? '#050c1f' : 'transparent';
  await page.setContent(
    `<style>html,body{margin:0;background:${bg}}svg{display:block;width:${size}px;height:${size}px}</style>${src(svgName).replace(/ width="\d+" height="\d+"/, '')}`,
  );
  const png = await page.screenshot({ omitBackground: !opaque, type: 'png' });
  await page.close();
  return png;
}

const save = (name, buf) => { writeFileSync(join(out, name), buf); console.log('✓', name, buf.length, 'B'); };

save('apple-touch-icon.png', await raster('icon.svg', 180, { opaque: true }));
save('icon-192.png', await raster('icon.svg', 192));
save('icon-512.png', await raster('icon.svg', 512));
save('icon-maskable-512.png', await raster('icon-maskable.svg', 512, { opaque: true }));
copyFileSync(join(root, 'assets/app-icon/icon.svg'), join(out, 'icon.svg'));

// favicon.ico: cabeçalho ICONDIR + entradas PNG (16, 32 e 48 px, versão sem placa).
const sizes = [16, 32, 48];
const pngs = [];
for (const s of sizes) pngs.push(await raster('icon-small.svg', s));
const head = Buffer.alloc(6 + 16 * sizes.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let offset = head.length;
sizes.forEach((s, i) => {
  const o = 6 + 16 * i;
  head.writeUInt8(s, o); head.writeUInt8(s, o + 1); head.writeUInt8(0, o + 2); head.writeUInt8(0, o + 3);
  head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
  head.writeUInt32LE(pngs[i].length, o + 8); head.writeUInt32LE(offset, o + 12);
  offset += pngs[i].length;
});
writeFileSync(join(root, 'public/favicon.ico'), Buffer.concat([head, ...pngs]));
console.log('✓ favicon.ico', sizes.join('/'));

await browser.close();
