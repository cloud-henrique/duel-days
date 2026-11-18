// Duelo inteiro no WebKit (Playwright), na velocidade normal das animações: o jogador invoca/baixa o que puder, ataca
// quando pode e passa o turno; responde "Não" às correntes. Mede se o jogo fica preso numa encenação (maior tempo
// contínuo com a fila tocando) e se a página dá erro. Uso: node proto/duel-e2e.mjs [url=http://127.0.0.1:5181/] [--reduzir]
import { webkit, devices } from 'playwright';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const url = args[0] ?? 'http://127.0.0.1:5181/';
/** Acima disto com a fila tocando sem parar, o jogo está preso. */
const STUCK_MS = 30_000;
const MAX_MINUTES = 12;
/** Sem mudança no narrador nem no turno por este tempo (fora da encenação), o roteiro para e mostra a tela. */
const STALL_MS = 60_000;

const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: process.argv.includes('--reduzir') ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const btn = (t) => page.locator('button', { hasText: t }).first();
const has = async (sel) => (await page.locator(sel).count()) > 0;

let maxStaging = 0, stagingSince = 0, actions = 0, lastSeen = '', lastChange = Date.now();
const snapshot = () => page.evaluate(() => ({
  narrador: document.querySelector('.phasebar')?.textContent?.slice(0, 80),
  painel: [...document.querySelectorAll('.scrim .sheet')].pop()?.textContent?.slice(0, 160) ?? null,
  botoesPainel: [...document.querySelectorAll('.scrim.uphand:not(.gone) .panel button')].map((b) => b.textContent),
  escolha: document.querySelector('.choicebar')?.textContent?.slice(0, 120) ?? null,
  lado: [...document.querySelectorAll('.sidebtns button')].map((b) => b.textContent),
  brilho: document.querySelectorAll('.hl').length,
}));
const t0 = Date.now();
try {
  await page.goto(url);
  await page.fill('input[placeholder="Seu nome"]', 'WebKit');
  // Boas-vindas (nome; avatar e tratamento padrão) → título → Campanha → uma cabeça no mapa → Duelar.
  await btn('Começar').click();
  await page.locator('.titleplay').click();
  await page.locator('.pinhead:not(.boss)').first().evaluate((el) => el.click()); // fora da tela no panorama: o clique forçado acertava outro ponto
  await btn('Pular').click();
  await page.locator('.scene-menu button', { hasText: /^\s*Duelar\s*$/ }).click();
  await btn('Pular').click();
  while (Date.now() - t0 < MAX_MINUTES * 60_000) {
    await page.waitForTimeout(250);
    if (await has('.outro')) break;
    if (await has('.intro')) continue;
    const staging = await has('.duel.staging');
    if (staging) {
      stagingSince ||= Date.now();
      maxStaging = Math.max(maxStaging, Date.now() - stagingSince);
      if (Date.now() - stagingSince > STUCK_MS) throw new Error(`preso na encenação há ${STUCK_MS / 1000}s`);
      continue;
    }
    stagingSince = 0;
    const seen = JSON.stringify(await snapshot());
    if (seen !== lastSeen) { lastSeen = seen; lastChange = Date.now(); }
    else if (Date.now() - lastChange > STALL_MS) { console.log('SEM PROGRESSO há 60s:', seen); break; }
    // Escolha no tabuleiro (ex.: descarte, alvo): toca a primeira carta que brilha e confirma, se houver botão.
    if (await has('.choicebar')) {
      await page.locator('.handfan .slot.hl, .zone.hl').first().click({ force: true }).catch(() => {});
      await page.locator('.choicebar button.primary').first().click({ timeout: 500 }).catch(() => {});
      continue;
    }
    const panel = page.locator('.scrim.uphand:not(.gone) .panel');
    if (await panel.count()) {
      // Recusa quando pode ("Não", "Passar"); corrente obrigatória ou outra escolha: a primeira opção.
      const no = panel.locator('button', { hasText: /^(Não|Passar)$/ });
      const first = panel.locator('button.primary, .acts button, button:not(.wide)').first();
      await ((await no.count()) ? no.first() : first).click({ timeout: 1000 }).catch(() => {});
      continue;
    }
    const side = page.locator('.sidebtns button');
    if (!(await side.count())) continue;
    // Uma ação por vez: invocar/baixar da mão, atacar com o que brilha no campo; senão, seguir de fase.
    let acted = false;
    for (const sel of ['.handfan .slot.hl', '.field .zone.hl']) {
      const cards = page.locator(sel);
      for (let i = 0; i < Math.min(await cards.count(), 4) && !acted; i++) {
        await cards.nth(i).click({ timeout: 1000 }).catch(() => {});
        for (const label of [/^Invocar$/, /^Baixar$/, /^Atacar$/, /^Ataque direto$/]) {
          const b = page.locator('.sheet .acts button', { hasText: label });
          if (await b.count()) { await b.first().click(); acted = true; actions++; break; }
        }
        // Sem ação conhecida: fecha a folha pelo X dela (o fundo fica coberto pela própria folha).
        if (!acted) await page.locator('.scrim button.close').first().click({ timeout: 1000 }).catch(() => {});
      }
      if (acted) break;
    }
    if (!acted) await side.filter({ hasText: /BATALHA|FIM DO TURNO|MAIN 2/ }).last().click({ timeout: 1000 }).catch(() => {});
  }
  const end = (await has('.outro')) ? await page.locator('.outro h2').innerText() : 'SEM FIM (tempo esgotado)';
  const turn = await page.evaluate(() => document.querySelector('.phasebar')?.textContent?.match(/T(\d+)/)?.[1]);
  console.log(`fim: ${end} | turno ${turn} | ${actions} ações | ${Math.round((Date.now() - t0) / 1000)}s | maior encenação contínua: ${(maxStaging / 1000).toFixed(1)}s`);
  // Campanha: Continuar → fala de depois → mapa no período seguinte, com o DP do duelo.
  if (await has('.outro')) {
    await page.locator('.outro button', { hasText: 'Continuar' }).click();
    await btn('Pular').click();
    await page.locator('.camphead').waitFor({ timeout: 5000 });
    const head = (await page.locator('.camphead').innerText()).replace(/\s+/g, ' ');
    console.log('mapa depois do duelo:', head.slice(0, 40));
    if (!/Tarde/.test(head) || !/[1-9]\d* DP/.test(head)) throw new Error(`o período ou o DP não mudou: ${head}`);
  }
} catch (e) { console.log('FALHA:', e.message); }
console.log(errors.length ? `erros na página (${errors.length}): ${errors.slice(0, 5).join(' | ')}` : 'sem erros na página');
await browser.close();
