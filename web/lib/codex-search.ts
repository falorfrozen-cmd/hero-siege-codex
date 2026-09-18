export type SearchRecord = {
  kind: string;
  name: string;
  detail: string;
  href: string;
  terms: string;
};
export const searchKinds = [
  'Items',
  'Stats',
  'Classes',
  'Skills',
  'Creatures',
  'Relics',
  'World',
];
export function searchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
export function searchCodex(
  records: SearchRecord[],
  query: string,
  kind = 'All',
) {
  const normalized = searchText(query);
  if (!normalized) return [];
  const tokens = normalized.split(' ');
  return records
    .flatMap((record) => {
      if (kind !== 'All' && record.kind !== kind) return [];
      const name = searchText(record.name);
      const haystack = `${name} ${searchText(record.detail)} ${record.terms}`;
      if (!tokens.every((token) => haystack.includes(token))) return [];
      const score =
        name === normalized
          ? 0
          : name.startsWith(normalized)
            ? 1
            : name.includes(normalized)
              ? 2
              : tokens.every((token) => name.includes(token))
                ? 3
                : 4;
      return [{ record, score }];
    })
    .sort(
      (a, b) => a.score - b.score || a.record.name.localeCompare(b.record.name),
    )
    .map((row) => row.record);
}
