import { entryHref, readCreatorMark, readEntryLocator, type CreatorMark, type EntryLocator } from '../web/lib/entry-links.ts';

const WEBSITE_HOST = 'hero-siege-item-codex.falorfrozen.chatgpt.site';
const fields: Record<string, string[]> = {
  '/stat-archive': ['stat'], '/class-study': ['class', 'skill'],
  '/creature-archive': ['creature'], '/relic-archive': ['relic'],
  '/world-archive': ['volume', 'entry'],
};

function localPath(url: URL) {
  if (url.pathname === '/' || url.pathname === '') {
    const item = readEntryLocator(url.search);
    if (!item) throw new Error('The link does not contain an item.');
    return '/' + new URL(entryHref(item, 'https://local.invalid/', readCreatorMark(url.search))).search;
  }
  const supported = fields[url.pathname];
  if (!supported) throw new Error('This archive is not included in this test build.');
  const params = new URLSearchParams();
  for (const name of supported) {
    const values = url.searchParams.getAll(name);
    if (values.length > 1 || (values.length && (!values[0] || values[0].length > 300)))
      throw new Error('This entry link is invalid.');
    if (values.length) params.set(name, values[0]);
  }
  return url.pathname + (params.size ? '?' + params.toString() : '');
}

export function desktopEntryPath(value: string) {
  if (value.length > 4096) throw new Error('This entry link is too long.');
  const url = new URL(value.trim());
  if (url.username || url.password || url.port) throw new Error('This entry link is invalid.');
  if (url.protocol === 'https:' && url.hostname === WEBSITE_HOST) return localPath(url);
  if (url.protocol === 'hscodex:' && url.hostname === 'entry' && ['', '/'].includes(url.pathname)) {
    url.pathname = '/';
    return localPath(url);
  }
  if (url.protocol === 'hscodex:' && url.hostname === 'archive') return localPath(url);
  throw new Error('Use a Codex desktop link or a link from the catalog website.');
}

export function sharedArchiveHref(value: string) {
  const local = new URL(value);
  const route = localPath(local);
  const result = new URL(route, 'hscodex://archive');
  if (result.pathname === '/') {
    const item = new URL('hscodex://entry');
    item.search = result.search;
    return item.href;
  }
  return result.href;
}

export function sharedEntryHref(item: EntryLocator, base: string, creator?: CreatorMark | null) {
  return sharedArchiveHref(entryHref(item, base, creator));
}

// Kept for the existing exhaustive item-link tests.
export function desktopEntrySearch(value: string) {
  const route = desktopEntryPath(value);
  if (!route.startsWith('/?')) throw new Error('This is not an item link.');
  return route.slice(1);
}
