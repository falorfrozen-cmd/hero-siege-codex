import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { desktopEntrySearch, sharedEntryHref, desktopEntryPath, sharedArchiveHref } from '../src/links.ts';
import { readEntryLocator, readCreatorMark } from '../web/lib/entry-links.ts';

const json = relative => JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const manifest = json('../web/lib/catalog-manifest.json');
const records = manifest.chapters.flatMap(chapter => {
  const rows = json('../web/public' + chapter.path);
  assert.equal(rows.length, chapter.count);
  return rows;
});
assert.equal(records.length, 1990);
const identities = new Set(records.map(row => `${row.key}\0${row.variant}`));
assert.equal(identities.size, records.length);
const index = json('../web/public' + manifest.index);
assert.equal(index.length, records.length);
const creator = { creatorId: 'graxy_tv', entry: { key: 'amulets_normal_golden_amulet', variant: 0 } };
for (const row of records) {
  const item = { key: row.key, variant: row.variant };
  const link = sharedEntryHref(item, 'http://tauri.localhost/', creator);
  assert.ok(link.startsWith('hscodex://entry?'));
  const search = desktopEntrySearch(link);
  assert.deepEqual(readEntryLocator(search), item);
  assert.deepEqual(readCreatorMark(search), creator);
  assert.ok(index.some(entry => entry.key === row.key && entry.variant === row.variant));
  if (row.image) assert.ok(existsSync(new URL('../web/public' + row.image, import.meta.url)), row.image);
}
const inherited = sharedEntryHref({ key: 'runeword_angul_auxana', variant: null },
  'http://tauri.localhost/?item=x&creator=graxy_tv&mark=w_melee_st_mikas_zweihander');
assert.equal(readCreatorMark(desktopEntrySearch(inherited)).entry.key, 'w_melee_st_mikas_zweihander');
const website = 'https://hero-siege-item-codex.falorfrozen.chatgpt.site/?item=amulets_normal_golden_amulet&variant=0&tracking=discard#fragment';
assert.equal(desktopEntrySearch(website), '?item=amulets_normal_golden_amulet&variant=0');
for (const invalid of [
  'https://example.com/?item=x', 'file:///C:/Windows/?item=x', 'javascript:alert(1)',
  'hscodex://other?item=x', 'hscodex://entry/other?item=x', 'hscodex://user@entry?item=x',
  'hscodex://entry:1234?item=x', 'hscodex://entry', 'hscodex://entry?item=',
  'hscodex://entry?item=a&item=b', 'hscodex://entry?item=a&variant=-1',
  'hscodex://entry?item=a&variant=0&variant=1', 'hscodex://entry?item=a&variant=1.2',
  'hscodex://entry?item=a&creator=unknown', 'hscodex://entry?item=a&creator=graxy_tv&markVariant=-1',
  'https://hero-siege-item-codex.falorfrozen.chatgpt.site.evil.test/?item=a', 'a'.repeat(4097),
]) assert.throws(() => desktopEntrySearch(invalid), invalid.slice(0, 120));
console.log(`PASS: ${records.length} unique entries, all bundled item images, index, desktop/website links, variant 0, creator marks, and invalid link rejection.`);
