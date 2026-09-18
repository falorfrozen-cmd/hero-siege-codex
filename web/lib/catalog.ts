export type Stat = {
  label: string;
  value: string;
  rolled?: boolean;
  key?: number;
};
export type AcquisitionMethod = {
  kind: 'craft' | 'drop';
  label: string;
  detail: string;
  boss?: string;
  area?: string;
  difficulty?: string;
  evidence: { file: string; key: string; line?: number; sha256: string };
};
export type SetRecord = {
  id: number;
  seal: string;
  pieces: number[];
  bonuses: { required: number; text: string }[];
};
export type Item = {
  id: number;
  key: string;
  name: string;
  rarity: string;
  category: string;
  type: string;
  kind: string;
  tier: string | null;
  level: number | null;
  variant: number | null;
  set: string | null;
  setRecord: SetRecord | null;
  acquisition: AcquisitionMethod[];
  image: string | null;
  summary: string;
  tags: string[];
  highlights: Stat[];
  stats: Stat[];
  effects: { text: string; source: string; key?: number }[];
  lore: {
    text: string;
    kind: string;
    file: string;
    key: string;
    line: number;
  } | null;
  unresolvedStats: number;
  featured: boolean;
  related: { id: number; reason: string }[];
};
export type IndexItem = Pick<
  Item,
  'id' | 'key' | 'variant' | 'name' | 'rarity' | 'category' | 'type'
> & { image?: string | null };
export const CHAPTERS: Record<
  string,
  { numeral: string; subtitle: string; color: string }
> = {
  // Angelic and Heroic accents are sampled from the owner's in-game screenshots.
  Angelic: { numeral: 'I', subtitle: 'Relics of the divine', color: '#f4f392' },
  Unholy: {
    numeral: 'II',
    subtitle: 'Power beyond absolution',
    color: '#c28cff',
  },
  Heroic: {
    numeral: 'III',
    subtitle: 'Arms of the exceptional',
    color: '#01f28d',
  },
  Satanic: {
    numeral: 'IV',
    subtitle: 'Forged in the infernal',
    color: '#ff6268',
  },
  Runeword: {
    numeral: 'V',
    subtitle: 'The language of power',
    color: '#9daeff',
  },
  Normal: {
    numeral: 'VI',
    subtitle: 'The foundations of an arsenal',
    color: '#c5c5bc',
  },
};
export const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '');
export function filterItems(
  items: Item[],
  category: string,
  query: string,
  loreOnly: boolean,
) {
  const term = normalizeSearch(query.trim());
  return items.filter(
    (item) =>
      (category === 'All categories' || item.category === category) &&
      (!loreOnly || item.lore?.kind === 'Lore') &&
      (!term ||
        normalizeSearch(
          `${item.name} ${item.type} ${item.tags.join(' ')}`,
        ).includes(term)),
  );
}
export function pageItems(items: Item[], page: number, count: number) {
  const total = Math.max(1, Math.ceil(items.length / count));
  const safePage = Math.max(0, Math.min(page, total - 1));
  return {
    items: items.slice(safePage * count, (safePage + 1) * count),
    page: safePage,
    total,
  };
}
export function validateChapter(value: unknown): value is Item[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        Number.isInteger(item.id) &&
        typeof item.name === 'string' &&
        typeof item.rarity === 'string' &&
        Array.isArray(item.stats) &&
        Array.isArray(item.tags),
    )
  );
}
