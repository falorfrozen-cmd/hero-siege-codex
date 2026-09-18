const fs = require('node:fs');
const path = require('node:path');
const { connect, output } = require('./native-qa.cjs');
let browser;
(async () => {
  const session = await connect();
  browser = session.browser;
  const { page } = session;
  // All six archives render their record in this shared Scholar reader pane.
  await page.locator('#archive-content article h1').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(output, 'native-first-open.png') });
  const result = await page.evaluate(() => ({
    url: location.href, title: document.title, native: !!window.__TAURI_INTERNALS__,
    archive: document.querySelector('.scholar')?.dataset.archive,
    viewport: [innerWidth, innerHeight], scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
    entries: [...document.querySelectorAll('#archive-content article h1')].map(el => el.textContent),
    images: [...document.querySelectorAll('#archive-content article img')].map(img => ({ src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0 })),
    buttons: [...document.querySelectorAll('button')].map(el => el.getAttribute('aria-label') || el.textContent),
  }));
  fs.writeFileSync(path.join(output, 'native-probe.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
});
