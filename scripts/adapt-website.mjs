import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function edit(file, transform) {
  const target = path.join(root, 'web', file);
  fs.writeFileSync(target, transform(fs.readFileSync(target, 'utf8')));
}
for (const file of ['app/discover-panel.tsx', 'app/creator-bookmark.tsx']) {
  edit(file, text => {
    if (!text.includes('entryHref(')) throw new Error(`Sharing adapter mismatch: ${file}`);
    return text.replace(/import \{ entryHref(, type CreatorMark)? \} from '@\/lib\/entry-links';/,
      (_, types) => `import { sharedEntryHref as entryHref } from '@desktop/links';${types ? "\nimport { type CreatorMark } from '@/lib/entry-links';" : ''}`)
      .replace('Share this link with your viewers.', 'Open this link in the desktop app.');
  });
}
for (const file of ['app/scholar/shell.tsx']) {
  edit(file, text => {
    let matches = 0;
    text = text.replace(/const url = new URL\(([^;]*?)\)\s*\.href;/g, (_, args) => {
      matches++;
      return `const url = sharedArchiveHref(new URL(${args}).href);`;
    });
    if (matches !== 1) throw new Error(`Sharing adapter mismatch: ${file}, ${matches}`);
    return text.replace("'use client';", "'use client';\nimport { sharedArchiveHref } from '@desktop/links';");
  });
}
edit('app/scholar/issue-report.tsx', text => {
  const original = "from '@/lib/issue-report'";
  if (!text.includes(original)) throw new Error('Issue report adapter mismatch.');
  return text.replace(original, "from '@desktop/issue-report'");
});
console.log('Applied desktop sharing and issue-report adapters.');
