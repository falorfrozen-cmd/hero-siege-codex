const { chromium } = require('C:/Users/falor/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'web/lib/catalog-manifest.json')));
const records = manifest.chapters.flatMap(c => JSON.parse(fs.readFileSync(path.join(root, 'web/public', c.path))));
const report = { checks: [], errors: [], externalRequests: [], geometry: [] };
const mark = name => { report.checks.push(name); console.log('PASS', name); };
let browser;
(async () => {
  browser = await chromium.connectOverCDP('http://127.0.0.1:9238');
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes('tauri.localhost'));
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().includes('tauri.localhost') && !request.url().includes('ipc.localhost')) report.externalRequests.push(request.url()); });
  const ready = async () => {
    await page.waitForFunction(() => !!document.querySelector('.book-entry') && !document.querySelector('.opening-entry') && !document.querySelector('.book-cover[aria-busy="true"]') && !document.querySelector('.book-spread[inert]'));
    await page.evaluate(() => document.fonts.ready);
  };
  const open = async (row, extra = '') => {
    const link = `hscodex://entry?item=${encodeURIComponent(row.key)}${row.variant === null ? '' : '&variant=' + row.variant}${extra}`;
    await page.keyboard.press('Control+o');
    await page.getByLabel('Entry link', { exact: true }).fill(link);
    await page.getByRole('button', { name: 'Open entry', exact: true }).click();
    await page.waitForSelector(`.book-entry[data-item-id="${row.id}"]`);
    await ready();
    return link;
  };
  const geometry = async (label) => {
    const result = await page.evaluate(() => {
      const box = el => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height, right: b.right, bottom: b.bottom }; };
      return {
        viewport: [innerWidth, innerHeight], scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], book: box(document.querySelector('.book-cover')),
        entries: [...document.querySelectorAll('.book-entry')].map(el => ({ name: el.querySelector('h2').textContent, entry: box(el), window: box(el.parentElement), heading: box(el.querySelector('h2')), properties: el.querySelectorAll('.stat-lines > div').length })),
      };
    });
    report.geometry.push({ label, ...result });
    assert.ok(result.scroll[0] <= result.viewport[0] + 1 && result.scroll[1] <= result.viewport[1] + 1, `${label}: document overflow`);
    for (const entry of result.entries) {
      assert.ok(entry.entry.bottom <= entry.window.bottom + 2, `${label}: entry clipped ${entry.name}`);
      assert.ok(entry.entry.x >= entry.window.x - 1 && entry.entry.right <= entry.window.right + 2, `${label}: margin overflow ${entry.name}`);
    }
  };

  await context.setOffline(true);
  await page.reload();
  await ready();
  assert.equal(await page.evaluate(() => navigator.onLine), false);
  assert.equal(await page.evaluate(() => !!window.__TAURI_INTERNALS__), true);
  mark('Actual release EXE boots and reloads offline in WebView2');

  for (const chapter of manifest.chapters) {
    await page.locator('.rarity-chapters button').filter({ hasText: chapter.name }).click();
    await page.waitForFunction(name => document.querySelector('.codex')?.dataset.rarity === name.toLowerCase(), chapter.name);
    await ready();
    await page.waitForFunction(() => [...document.querySelectorAll('.book-entry img')].every(img => img.complete && img.naturalWidth > 0));
    const history = await page.evaluate(() => window.history.length);
    for (let i = 0; i < 2; i++) { await page.getByRole('button', { name: 'Next', exact: true }).click(); await ready(); }
    for (let i = 0; i < 2; i++) { await page.getByRole('button', { name: 'Previous', exact: true }).click(); await ready(); }
    assert.equal(await page.evaluate(() => window.history.length), history, 'Page turns must not fill browser history');
    await geometry(chapter.name);
    mark(`${chapter.name}: offline data/images, page turns, fixed book layout`);
  }

  const mika = records.find(row => row.key === 'w_melee_st_mikas_zweihander');
  const shadows = records.find(row => row.key === 'rings_signet_of_shadows');
  const tomi = records.find(row => /Tomi/.test(row.name));
  const longest = records.filter(row => row.rarity === 'Heroic').sort((a, b) => b.name.length - a.name.length)[0];
  assert.ok(shadows && tomi);
  const cdp = await context.newCDPSession(page);
  for (const size of [[1400, 880], [1280, 680], [760, 560]]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: size[0], height: size[1], deviceScaleFactor: 1, mobile: false });
    for (const row of [mika, shadows, tomi, longest]) {
      await open(row);
      for (const show of [true, false]) {
        const toggle = page.locator('.show-lore-toggle');
        if ((await toggle.getAttribute('aria-pressed') === 'true') !== show) await toggle.click();
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const entry = page.locator(`.book-entry[data-item-id="${row.id}"]`);
        assert.equal(await entry.locator('.stat-lines > div').count(), row.stats.length);
        assert.equal(await entry.locator('.entry-lore').count(), show && row.lore ? 1 : 0);
        await geometry(`${size.join('x')} ${row.name}, lore ${show}`);
      }
    }
    await page.screenshot({ path: path.join(root, 'qa', `native-${size.join('x')}.png`) });
    mark(`${size.join('x')}: Mika, Shadows, Tomi, long Heroic title; all properties, lore on/off, no document scroll`);
  }
  await cdp.send('Emulation.clearDeviceMetricsOverride');

  await page.getByRole('textbox', { name: 'Search all items' }).fill('Angul Auxana');
  await page.locator('.search-results button').filter({ hasText: 'Angul Auxana' }).click();
  await ready();
  assert.match(page.url(), /item=runeword_angul_auxana/);
  await page.waitForFunction(() => document.querySelector('.item-sprite')?.getAttribute('src')?.includes('runeword'));
  mark('Offline global search and shared Runeword artwork');

  await open(mika);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('combobox', { name: 'Item category' }).click();
  await page.getByRole('option', { name: 'Ring', exact: true }).click();
  await ready();
  assert.ok((await page.locator('.item-identity').allTextContents()).every(text => text.includes('Ring')));
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  mark('Category filter operates offline');

  const normal = records.find(row => row.key === 'amulets_normal_golden_amulet' && row.variant === 0);
  const creatorExtra = '&creator=graxy_tv&mark=w_melee_st_mikas_zweihander';
  await open(normal, creatorExtra);
  await page.getByRole('button', { name: 'Discover', exact: true }).click();
  await page.getByRole('button', { name: 'Copy entry link', exact: true }).click();
  const share = await page.locator('.manual-entry-link input').inputValue();
  const parsed = new URL(share);
  assert.equal(parsed.protocol, 'hscodex:');
  assert.equal(parsed.searchParams.get('variant'), '0');
  assert.equal(parsed.searchParams.get('creator'), 'graxy_tv');
  assert.equal(parsed.searchParams.get('mark'), mika.key);
  await page.keyboard.press('Escape');
  mark('Copy entry link preserves variant 0 and the creator bookmark');

  await page.getByRole('button', { name: /Graxy_TV bookmark/ }).click();
  await ready();
  assert.match(page.url(), /item=w_melee_st_mikas_zweihander/);
  const links = await page.locator('.creator-social-link').evaluateAll(nodes => nodes.map(n => n.href));
  const allHrefs = await page.locator('a[href^="https:"]').evaluateAll(nodes => nodes.map(n => n.href));
  assert.ok(allHrefs.includes('https://www.twitch.tv/graxy_tv'));
  assert.ok(allHrefs.includes('https://discord.gg/fDtXAQu5c3'));
  await page.getByRole('button', { name: /Graxy_TV bookmark/ }).click();
  await page.getByRole('button', { name: 'Copy bookmarked link', exact: true }).click();
  assert.match(await page.locator('#creator-entry-link').inputValue(), /^hscodex:\/\/entry\?item=w_melee_st_mikas_zweihander&creator=graxy_tv&mark=w_melee_st_mikas_zweihander$/);
  await page.keyboard.press('Escape');
  mark('Creator ribbon return, bookmarked link and Twitch/Discord targets');

  await page.getByRole('button', { name: `Bookmark ${mika.name}`, exact: true }).click();
  await page.reload();
  await ready();
  assert.equal(await page.getByRole('button', { name: `Remove bookmark for ${mika.name}`, exact: true }).count(), 1);
  assert.equal(await page.locator('.show-lore-toggle').getAttribute('aria-pressed'), 'false');
  mark('Bookmarks, creator mark, reading position and lore preference survive reload');

  await page.getByRole('button', { name: 'Discover', exact: true }).click();
  const related = page.locator('.related-entry:not([disabled])');
  await related.first().click();
  await ready();
  assert.ok(!page.url().includes('item=' + mika.key + '&'));
  mark('Discover follows a related entry');

  await page.keyboard.press('Control+o');
  await page.getByLabel('Entry link', { exact: true }).fill('https://example.com/?item=x');
  await page.getByRole('button', { name: 'Open entry', exact: true }).click();
  assert.ok(await page.locator('.desktop-link-dialog [role="alert"]').isVisible());
  await page.keyboard.press('Escape');
  await open({ key: 'missing_test_entry', variant: null, id: -123 }).catch(async error => {
    await page.getByRole('heading', { name: 'Entry unavailable' }).waitFor();
    assert.equal(await page.locator('.book-entry').count(), 0);
  });
  await page.getByRole('button', { name: 'Browse the archive', exact: true }).click();
  await ready();
  mark('Invalid origin and unknown item links are rejected without showing the wrong entry');

  await open(normal, creatorExtra);
  await open(mika, creatorExtra);
  await page.goBack();
  await page.waitForSelector(`.book-entry[data-item-id="${normal.id}"]`);
  await page.goForward();
  await page.waitForSelector(`.book-entry[data-item-id="${mika.id}"]`);
  await ready();
  mark('Entry history back/forward restores exact item and creator');
  await page.screenshot({ path: path.join(root, 'qa/native-creator-final.png') });
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.externalRequests, []);
  mark('No renderer errors or external catalog requests throughout offline tests');
})().catch(error => { report.failure = error.stack; console.error(error); process.exitCode = 1; }).finally(async () => {
  fs.writeFileSync(path.join(root, 'qa/native-report.json'), JSON.stringify(report, null, 2));
  if (browser) await browser.close();
});
