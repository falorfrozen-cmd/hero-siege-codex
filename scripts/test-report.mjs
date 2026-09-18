import assert from 'node:assert/strict';
import { CODEX_UI_RELEASE, reportEntryLink, issueReport } from '../src/issue-report.ts';
import { desktopEntryPath } from '../src/links.ts';

const route = '/?item=amulets_normal_golden_amulet&variant=0&creator=graxy_tv&mark=w_melee_st_mikas_zweihander';
const link = reportEntryLink('http://tauri.localhost' + route + '&token=discard#unused');
assert.equal(desktopEntryPath(link), route);
assert(!link.includes('token'));
for (const path of ['/stat-archive?stat=strength', '/class-study?class=exo&skill=supernova', '/creature-archive?creature=gurag', '/relic-archive?relic=vadjra', '/world-archive?volume=quests&entry=1302']) {
  assert.equal(desktopEntryPath(reportEntryLink('http://tauri.localhost' + path)), path);
}
assert.equal(reportEntryLink('http://tauri.localhost/unknown'), 'https://hero-siege-item-codex.falorfrozen.chatgpt.site/unknown');
const report = issueReport({ archive: 'Items', entry: 'Golden Amulet', link }, '  Text overlaps.  ');
assert(report.includes('Desktop release: 0.5.0 (Windows x64)'));
assert(report.includes('UI release: 2026.09.18-r3'));
assert(report.includes('Text overlaps.'));
assert(report.includes(link));
assert(CODEX_UI_RELEASE.endsWith('Desktop 0.5.0'));
console.log('PASS: desktop issue report identity, release, variants, creator links and malformed-route recovery.');
