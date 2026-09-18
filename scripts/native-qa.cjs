const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'qa');
const endpoint = process.env.CODEX_QA_CDP || 'http://127.0.0.1:9238';

async function connect() {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.connectOverCDP(endpoint, { timeout: 15000 });
  try {
    const pages = browser.contexts().flatMap(context => context.pages());
    const page = pages.find(candidate => {
      const url = new URL(candidate.url());
      return ['http:', 'https:'].includes(url.protocol) && url.hostname === 'tauri.localhost';
    });
    if (!page) throw new Error('Native Codex page not found. Launch the release EXE with npm run qa:launch first.');
    page.setDefaultTimeout(15000);
    if (!await page.evaluate(() => !!window.__TAURI_INTERNALS__)) {
      throw new Error('Expected the native Tauri application, not a browser preview.');
    }
    return { browser, context: page.context(), page };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function readyItem(page, id = null) {
  await page.waitForFunction(expected => {
    const entry = document.querySelector('.scholar-item-record');
    return document.readyState === 'complete' && entry?.querySelector('h1')?.textContent.trim()
      && (expected === null || entry.dataset.itemId === String(expected))
      && !document.querySelector('.scholar-empty')
      && document.querySelector('[aria-label="Entry navigation"]');
  }, id);
  await page.evaluate(() => document.fonts.ready);
}

async function openLink(page, href) {
  await page.getByRole('button', { name: 'Search all archives', exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.keyboard.press('Control+o');
  const dialog = page.getByRole('dialog', { name: 'Open entry link', exact: true });
  await dialog.getByLabel('Entry link', { exact: true }).fill(href);
  // Ctrl+O performs document navigation, even when reopening the same item.
  // Wait for that document rather than accidentally accepting the old article.
  await Promise.all([
    page.waitForEvent('domcontentloaded'),
    dialog.getByRole('button', { name: 'Open entry', exact: true }).click(),
  ]);
}

function itemLink(row, extra = '') {
  const params = new URLSearchParams({ item: row.key });
  if (row.variant !== null) params.set('variant', String(row.variant));
  return `hscodex://entry?${params}${extra}`;
}

module.exports = { connect, readyItem, openLink, itemLink, root, output };
