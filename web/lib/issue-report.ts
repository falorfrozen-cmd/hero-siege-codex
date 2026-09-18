export const CODEX_UI_RELEASE = '2026.09.18-r3';
const site = 'https://hero-siege-item-codex.falorfrozen.chatgpt.site';
const entryParameters = [
  'item',
  'variant',
  'creator',
  'mark',
  'markVariant',
  'stat',
  'class',
  'skill',
  'creature',
  'relic',
  'volume',
  'entry',
];

/** Share record identity without local origins, tracking parameters or session data. */
export function reportEntryLink(href: string) {
  const current = new URL(href, site);
  const link = new URL(site);
  link.pathname = current.pathname;
  for (const key of entryParameters)
    for (const value of current.searchParams.getAll(key))
      link.searchParams.append(key, value);
  return link.href;
}

export type IssueContext = { archive: string; entry: string; link: string };
export function issueReport(context: IssueContext, details: string) {
  return [
    'Hero Siege Codex — Issue report',
    `UI release: ${CODEX_UI_RELEASE}`,
    `Archive: ${context.archive}`,
    `Entry: ${context.entry}`,
    `Entry link: ${context.link}`,
    '',
    'What happened / expected behavior:',
    details.trim() || '[Describe the issue here]',
  ].join('\n');
}
