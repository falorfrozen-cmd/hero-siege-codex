import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { desktopEntryPath, sharedArchiveHref } from '../src/links.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = value => createHash('sha256').update(value).digest('hex');
const source = path.join(root, 'web/public');
const dist = path.join(root, 'dist');
let count = 0;
function inspect(folder) {
  for (const file of fs.readdirSync(folder, { withFileTypes: true })) {
    const original = path.join(folder, file.name);
    if (file.isDirectory()) inspect(original);
    else {
      const relative = path.relative(source, original);
      const bundled = path.join(dist, relative);
      assert(fs.existsSync(bundled), `Missing packaged asset: ${relative}`);
      assert.equal(hash(fs.readFileSync(original)), hash(fs.readFileSync(bundled)), `Asset differs: ${relative}`);
      count++;
    }
  }
}
inspect(source);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'web/lib/codex-search-manifest.json')));
const entries = JSON.parse(fs.readFileSync(path.join(dist, manifest.path)));
assert.equal(entries.length, manifest.total);
for (const entry of entries) {
  assert.equal(desktopEntryPath(sharedArchiveHref('http://tauri.localhost' + entry.href)), entry.href);
}
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
assert(html.includes('Test 0.5.0'));
assert(html.includes('name="color-scheme" content="light"'));
for (const match of html.matchAll(/(?:src|href)="(\/[^\"]+)"/g)) {
  assert(fs.existsSync(path.join(dist, match[1])), `Missing entry asset: ${match[1]}`);
}
assert(!fs.existsSync(path.join(dist, '.openai')), 'Hosting state must not be packaged.');
console.log(`PASS: ${count} bundled public files match source, ${entries.length} search destinations round-trip, boot assets and release identity verified.`);
