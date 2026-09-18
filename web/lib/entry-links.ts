import type { IndexItem } from './catalog';
import { isCreatorId, type CreatorId } from './creators.ts';

export type EntryLocator = { key: string; variant: number | null };
export type CreatorMark = { creatorId: CreatorId; entry: EntryLocator };

export function readCreatorMark(search: string): CreatorMark | null {
  const params = new URLSearchParams(search);
  if (!['creator', 'mark', 'markVariant'].some((key) => params.has(key)))
    return null;
  const creatorId = params.get('creator');
  if (!isCreatorId(creatorId) || params.getAll('creator').length !== 1)
    throw new Error('This creator bookmark is unavailable.');
  const anchor = new URLSearchParams();
  for (const [from, to] of [
    ['mark', 'item'],
    ['markVariant', 'variant'],
  ])
    for (const value of params.getAll(from)) anchor.append(to, value);
  const entry = readEntryLocator(anchor.size ? anchor.toString() : search);
  if (!entry) throw new Error('This creator bookmark has no entry.');
  return { creatorId, entry };
}
export function readEntryLocator(search: string): EntryLocator | null {
  const params = new URLSearchParams(search);
  if (!params.has('item') && !params.has('variant')) return null;
  const key = params.get('item');
  const variant = params.get('variant');
  if (
    !key ||
    key.length > 300 ||
    params.getAll('item').length !== 1 ||
    params.getAll('variant').length > 1 ||
    (variant !== null && !/^\d{1,5}$/.test(variant))
  )
    throw new Error('This entry link is invalid.');
  return { key, variant: variant === null ? null : Number(variant) };
}
export function findLinkedEntry(rows: IndexItem[], target: EntryLocator) {
  return rows.find(
    (row) => row.key === target.key && row.variant === target.variant,
  );
}
export function entryHref(
  item: EntryLocator | Pick<IndexItem, 'key' | 'variant'>,
  base: string,
  creator?: CreatorMark | null,
) {
  const url = new URL(base);
  let mark = creator;
  if (mark === undefined) {
    try {
      mark = readCreatorMark(url.search);
    } catch {
      // Invalid creator data must not break an otherwise valid entry link.
      mark = null;
    }
  }
  url.search = '';
  url.hash = '';
  url.searchParams.set('item', item.key);
  if (item.variant !== null)
    url.searchParams.set('variant', String(item.variant));
  if (mark) {
    url.searchParams.set('creator', mark.creatorId);
    url.searchParams.set('mark', mark.entry.key);
    if (mark.entry.variant !== null)
      url.searchParams.set('markVariant', String(mark.entry.variant));
  }
  return url.href;
}
