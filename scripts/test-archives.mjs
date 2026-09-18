import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { desktopEntryPath, sharedArchiveHref } from '../src/links.ts';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, 'web', file), 'utf8'));
let links = 0;
function roundtrip(route) {
  const shared = sharedArchiveHref('http://tauri.localhost' + route);
  assert.equal(desktopEntryPath(shared), route);
  assert.equal(desktopEntryPath('https://hero-siege-item-codex.falorfrozen.chatgpt.site' + route), route);
  links++;
}
function record(file, key, expected) {
  const value = read('public' + file);
  assert.equal(value[key], expected);
}
for (const entry of read('app/stat-archive/entries.json').entries) roundtrip('/stat-archive?stat=' + encodeURIComponent(entry.slug));
const classes = read('app/class-study/studies.json');
assert.equal(classes.length, 24);
for (const entry of classes) {
  roundtrip('/class-study?class=' + entry.slug);
  for (const skill of entry.skills) roundtrip('/class-study?class=' + entry.slug + '&skill=' + encodeURIComponent(skill.sourceKey.replace(/^talent_desc_/, '')));
}
for (const entry of read('app/creature-archive/index.json').entries) {
  roundtrip('/creature-archive?creature=' + entry.slug);
  record(entry.file, 'slug', entry.slug);
}
for (const entry of read('app/relic-archive/index.json')) {
  roundtrip('/relic-archive?relic=' + encodeURIComponent(entry.key));
  record(entry.file, 'key', entry.key);
}
const world = read('app/world-archive/index.json');
assert.equal(world.ether.entries.length, 217);
assert.equal(world.quests.entries.length, 200);
for (const kind of ['ether', 'quests']) for (const entry of world[kind].entries) {
  roundtrip('/world-archive?volume=' + kind + '&entry=' + encodeURIComponent(entry.key));
  record(entry.file, 'key', entry.key);
}
for (const value of [
  'hscodex://archive/unknown', 'hscodex://archive/stat-archive?stat=a&stat=b',
  'hscodex://archive/world-archive?volume=', 'hscodex://archive/class-study?class=',
  'https://evil.test/stat-archive?stat=life', 'hscodex://user@archive/creature-archive',
]) assert.throws(() => desktopEntryPath(value));
// Every local asset referenced in the archive's structured data must be bundled.
let assets = 0;
const checked = new Set();
function scan(value) {
  if (typeof value === 'string' && /^\/(?:classes|creatures|relics|world|emblems|textures|creators)\/.+\.(?:webp|png|svg|json)$/.test(value) && !checked.has(value)) {
    checked.add(value);
    assert.ok(fs.existsSync(path.join(root, 'web/public', value)), value);
    assets++;
  } else if (Array.isArray(value)) value.forEach(scan);
  else if (value && typeof value === 'object') Object.values(value).forEach(scan);
}
for (const folder of ['class-study','stat-archive','creature-archive','relic-archive','world-archive']) {
  for (const file of fs.readdirSync(path.join(root,'web/app',folder))) if(file.endsWith('.json')) scan(read('app/'+folder+'/'+file));
}
console.log(`PASS: ${links} non-item desktop/website links, all record files, ${assets} local asset references and invalid archive links.`);
