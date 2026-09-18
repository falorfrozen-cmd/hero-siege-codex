const { chromium } = require('C:/Users/falor/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9238');
  const pages = browser.contexts().flatMap(context => context.pages());
  console.log('Pages:', pages.map(page => page.url()));
  const page = pages.find(page => page.url().includes('tauri.localhost'));
  if (!page) throw new Error('Native catalog page not found');
  await page.waitForSelector('.book-entry', { timeout: 30000 });
  await page.screenshot({ path: path.resolve(__dirname, '../qa/native-first-open.png') });
  console.log(JSON.stringify(await page.evaluate(() => ({
    url: location.href, title: document.title, native: !!window.__TAURI_INTERNALS__,
    viewport: [innerWidth, innerHeight], scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
    entries: [...document.querySelectorAll('.book-entry h2')].map(el => el.textContent),
    images: [...document.images].map(img => ({ src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0 })),
    buttons: [...document.querySelectorAll('button')].map(el => el.getAttribute('aria-label') || el.textContent),
  })), null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
