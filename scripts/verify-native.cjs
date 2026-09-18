const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { connect, readyItem, openLink, itemLink, root, output } = require('./native-qa.cjs');
const manifest = require('../web/lib/catalog-manifest.json');
const chapters = new Map(manifest.chapters.map(chapter => [chapter.name,
  JSON.parse(fs.readFileSync(path.join(root, 'web/public', chapter.path), 'utf8'))]));
const records = [...chapters.values()].flat();
const report = { checks: [], errors: [], externalRequests: [], geometry: [] };
const mark = name => { report.checks.push(name); console.log('PASS', name); };
let browser, context, page, cdp;

(async () => {
  ({ browser, context, page } = await connect());
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  page.on('request', request => {
    const url = new URL(request.url());
    if (['http:', 'https:'].includes(url.protocol) && !['tauri.localhost', 'ipc.localhost'].includes(url.hostname)) {
      report.externalRequests.push(url.href);
    }
  });
  const entry = () => page.locator('.scholar-item-record');
  const open = async (row, extra = '') => {
    await openLink(page, itemLink(row, extra));
    await readyItem(page, row.id);
    assert.equal(await entry().locator('h1').innerText(), row.name);
  };
  const closeDialog = async () => {
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
  };
  const imagesReady = () => page.waitForFunction(() =>
    [...document.querySelectorAll('.scholar-item-record img')].every(img => img.complete && img.naturalWidth > 0));
  const geometry = async label => {
    const result = await page.evaluate(() => {
      const box = el => {
        const b = el.getBoundingClientRect();
        return { x: b.x, y: b.y, width: b.width, height: b.height, right: b.right, bottom: b.bottom };
      };
      const pane = document.querySelector('#archive-content');
      const article = pane.querySelector('.scholar-item-record');
      return {
        viewport: [innerWidth, innerHeight],
        scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
        pane: box(pane), article: box(article),
        readerWidth: [pane.clientWidth, pane.scrollWidth],
        navigation: [...document.querySelectorAll('[aria-label="Entry navigation"] button')].map(box),
        properties: [...article.querySelectorAll('.scholar-properties > div')].map(box),
      };
    });
    report.geometry.push({ label, ...result });
    assert.ok(result.scroll[0] <= result.viewport[0] + 1 && result.scroll[1] <= result.viewport[1] + 1, `${label}: document overflow`);
    assert.ok(result.readerWidth[1] <= result.readerWidth[0] + 1, `${label}: horizontal reader overflow`);
    for (const box of [result.article, ...result.properties]) {
      assert.ok(box.x >= result.pane.x - 1 && box.right <= result.pane.right + 1, `${label}: content escapes reader margins`);
    }
    assert.equal(result.navigation.length, 2);
    for (const box of result.navigation) {
      assert.ok(box.width > 0 && box.height > 0 && box.x >= 0 && box.y >= 0
        && box.right <= result.viewport[0] + 1 && box.bottom <= result.viewport[1] + 1, `${label}: navigation outside viewport`);
    }
    // Scholar's Index scrolls inside its reader; a tall article is intentional.
  };

  await context.setOffline(true);
  await page.reload();
  const mika = records.find(row => row.key === 'w_melee_st_mikas_zweihander');
  const shadows = records.find(row => row.key === 'rings_signet_of_shadows');
  const tomi = records.find(row => /Tomi/.test(row.name));
  const longest = records.filter(row => row.rarity === 'Heroic').sort((a, b) => b.name.length - a.name.length)[0];
  assert.ok(mika && shadows && tomi && longest, 'Required acceptance fixtures exist');
  await open(mika);
  assert.equal(await page.evaluate(() => navigator.onLine), false);
  mark('Actual release EXE reloads and opens a desktop entry offline in WebView2');

  cdp = await context.newCDPSession(page);
  const resize = (width, height) => cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await resize(1400, 880);
  for (const chapter of manifest.chapters) {
    const rows = chapters.get(chapter.name);
    await page.getByRole('combobox', { name: 'Rarity', exact: true }).selectOption(chapter.name);
    await readyItem(page, rows[0].id);
    await imagesReady();
    assert.equal(await entry().getAttribute('data-rarity'), chapter.name.toLowerCase());
    assert.equal(await page.getByRole('button', { name: 'Previous entry', exact: true }).isDisabled(), true);
    const history = await page.evaluate(() => window.history.length);
    for (const [direction, index] of [['Next', 1], ['Next', 2], ['Previous', 1], ['Previous', 0]]) {
      await page.getByRole('button', { name: `${direction} entry`, exact: true }).click();
      await readyItem(page, rows[index].id);
    }
    assert.equal(await page.evaluate(() => window.history.length), history, 'Entry turns must not fill browser history');
    await geometry(chapter.name);
    mark(`${chapter.name}: offline data/artwork, exact next/previous entries, bounded reader`);
  }

  for (const size of [[1400, 880], [1280, 680], [720, 540]]) {
    await resize(...size);
    for (const row of [mika, shadows, tomi, longest]) {
      await open(row);
      await imagesReady();
      for (const show of [true, false]) {
        const toggle = page.getByRole('checkbox', { name: 'Show lore', exact: true });
        const toggleAvailable = row.lore?.kind === 'Lore' && !!row.lore.text.trim();
        assert.equal(await toggle.count(), toggleAvailable ? 1 : 0);
        if (toggleAvailable) await toggle.setChecked(show);
        const loreVisible = !!row.lore && (show || row.lore.kind !== 'Lore');
        await page.waitForFunction(visible => !!document.querySelector('.scholar-lore') === visible, loreVisible);
        const values = await entry().locator('.scholar-properties > div').evaluateAll(nodes => nodes.map(node => ({
          label: node.querySelector('dt').textContent.trim(), value: node.querySelector('dd').textContent.trim(),
        })));
        assert.deepEqual(values, row.stats.map(stat => ({ label: stat.label, value: stat.value })), `${row.name}: every recorded property and value`);
        assert.deepEqual(await entry().locator('.scholar-effects li').allTextContents(), row.effects.map(effect => effect.text));
        if (loreVisible) assert.equal(await entry().locator('.scholar-lore blockquote').textContent(), row.lore.text);
        await geometry(`${size.join('x')} ${row.name}, lore ${show}`);
      }
    }
    await page.screenshot({ path: path.join(output, `native-${size.join('x')}.png`) });
    mark(`${size.join('x')}: Mika, Shadows, Tomi, long Heroic title; exact properties/effects, conditional lore, visible navigation`);
  }
  await resize(1400, 880);

  const runeword = records.find(row => row.key === 'runeword_angul_auxana');
  assert.ok(runeword);
  await page.getByRole('textbox', { name: 'Search all items', exact: true }).fill('Angul Auxana');
  await page.locator('.scholar-index-entry').filter({ hasText: runeword.name }).click();
  await readyItem(page, runeword.id);
  await imagesReady();
  assert.equal(await entry().locator('img').getAttribute('src'), '/emblems/runeword-seal.webp');
  mark('Offline item-index search opens the exact Runeword with shared artwork');

  await page.getByRole('button', { name: 'Search all archives', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search the whole Codex', exact: true }).fill(mika.name);
  await page.getByRole('region', { name: 'Codex search results', exact: true }).getByRole('button').filter({ hasText: mika.name }).click();
  await readyItem(page, mika.id);
  mark('Unified Codex search navigates to the exact item offline');

  await page.getByRole('combobox', { name: 'Category', exact: true }).selectOption('Ring');
  const rings = chapters.get('Angelic').filter(row => row.category === 'Ring');
  await readyItem(page, rings[0].id);
  assert.equal(await page.locator('.scholar-index-entry').count(), rings.length);
  assert.deepEqual(await page.locator('.scholar-index-entry small').allTextContents(), rings.map(row => row.type));
  mark('Category filter limits both index and reader to the matching items');

  const normal = records.find(row => row.key === 'amulets_normal_golden_amulet' && row.variant === 0);
  assert.ok(normal);
  const creatorExtra = '&creator=graxy_tv&mark=w_melee_st_mikas_zweihander';
  await open(normal, creatorExtra);
  // Exercise the manual-copy fallback without changing the OS clipboard.
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async () => { throw new DOMException('QA clipboard disabled', 'NotAllowedError'); },
    } });
  });
  await page.getByRole('button', { name: `Copy link to ${normal.name}`, exact: true }).click();
  const share = new URL(await page.getByRole('textbox', { name: 'Entry link to copy', exact: true }).inputValue());
  assert.equal(share.protocol, 'hscodex:');
  assert.equal(share.searchParams.get('item'), normal.key);
  assert.equal(share.searchParams.get('variant'), '0');
  assert.equal(share.searchParams.get('creator'), 'graxy_tv');
  assert.equal(share.searchParams.get('mark'), mika.key);
  mark('Copy-link fallback preserves variant zero and creator bookmark');

  await page.locator('.scholar-creator').getByRole('button').click();
  await readyItem(page, mika.id);
  assert.equal(await page.locator('.scholar-creator').getByRole('link', { name: 'Twitch', exact: true }).getAttribute('href'), 'https://www.twitch.tv/graxy_tv');
  assert.equal(await page.locator('.scholar-creator').getByRole('link', { name: 'Discord', exact: true }).getAttribute('href'), 'https://discord.gg/fDtXAQu5c3');
  await page.getByRole('button', { name: 'Creator bookmark', exact: true }).click();
  await page.getByRole('button', { name: 'Copy bookmarked link', exact: true }).click();
  assert.equal(await page.getByLabel('Entry and creator bookmark', { exact: true }).inputValue(), itemLink(mika, creatorExtra));
  await closeDialog();
  mark('Creator bar returns to its mark and exposes the correct share/social links');

  const save = entry().getByRole('button', { name: /^(Bookmark |Remove bookmark for )/ });
  if (await save.getAttribute('aria-pressed') !== 'true') await save.click();
  await page.getByRole('checkbox', { name: 'Show lore', exact: true }).setChecked(false);
  await page.reload();
  await readyItem(page, mika.id);
  assert.equal(await entry().getByRole('button', { name: `Remove bookmark for ${mika.name}`, exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByRole('checkbox', { name: 'Show lore', exact: true }).isChecked(), false);
  assert.equal(await page.locator('.scholar-lore').count(), 0);
  assert.equal(new URL(page.url()).searchParams.get('mark'), mika.key);
  await page.getByRole('button', { name: /^Saved entries \(/ }).click();
  await page.locator('.scholar-bookmark-row strong').filter({ hasText: mika.name }).waitFor();
  await closeDialog();
  mark('Saved entry, current item, creator mark and lore preference survive reload');

  await page.getByRole('button', { name: 'Discover', exact: true }).click();
  const related = page.locator('.related-entry:not([disabled])').first();
  await related.waitFor();
  const targetName = await related.locator('strong').innerText();
  const relatedIds = [...(mika.setRecord?.pieces || []), ...mika.related.map(relation => relation.id)];
  const target = records.find(row => row.id !== mika.id && row.name === targetName && relatedIds.includes(row.id));
  assert.ok(target, 'Discover result is a recorded relation');
  await related.click();
  await readyItem(page, target.id);
  mark('Discover opens a recorded related entry');

  await page.keyboard.press('Control+o');
  const dialog = page.getByRole('dialog', { name: 'Open entry link', exact: true });
  await dialog.getByLabel('Entry link', { exact: true }).fill('https://example.com/?item=x');
  await dialog.getByRole('button', { name: 'Open entry', exact: true }).click();
  await dialog.getByRole('alert').waitFor();
  await closeDialog();
  await openLink(page, 'hscodex://entry?item=missing_test_entry');
  await page.getByRole('heading', { name: 'Entry unavailable', exact: true }).waitFor();
  assert.equal(await entry().count(), 0, 'An invalid link must not display another item');
  await page.getByRole('button', { name: 'Open Angelic items', exact: true }).click();
  await readyItem(page, chapters.get('Angelic')[0].id);
  mark('Invalid origin and unknown item links fail explicitly and can recover');

  await open(normal, creatorExtra);
  await open(mika, creatorExtra);
  await page.goBack();
  await readyItem(page, normal.id);
  assert.equal(new URL(page.url()).searchParams.get('variant'), '0');
  assert.equal(new URL(page.url()).searchParams.get('creator'), 'graxy_tv');
  await page.goForward();
  await readyItem(page, mika.id);
  assert.equal(new URL(page.url()).searchParams.get('mark'), mika.key);
  mark('Back/forward restores exact item identities and creator marks');
  await page.screenshot({ path: path.join(output, 'native-creator-final.png') });
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.externalRequests, []);
  mark('No renderer errors or external catalog requests throughout offline checks');
})().catch(error => {
  report.failure = error.stack;
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  // Restore the QA process even on failure. CDP disconnection leaves the EXE
  // running; close-qa.ps1 closes only the explicitly captured QA process ID.
  if (page && report.failure) await page.screenshot({ path: path.join(output, 'native-failure.png') }).catch(() => {});
  if (cdp) await cdp.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
  if (context) await context.setOffline(false).catch(() => {});
  if (browser) await browser.close();
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'native-report.json'), JSON.stringify(report, null, 2));
});
