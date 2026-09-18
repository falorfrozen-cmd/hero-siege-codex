import type { Item } from './catalog';

export type CatalogFilters = {
  category: string;
  focus: string;
  effect: string;
  loreOnly: boolean;
};
export const EMPTY_FILTERS: CatalogFilters = {
  category: 'All categories',
  focus: 'Any focus',
  effect: 'Any effect',
  loreOnly: false,
};
export type ReaderPosition = {
  rarity: string;
  filters: CatalogFilters;
  cursor: number;
};
export type SavedItem = Pick<Item, 'id' | 'key' | 'name' | 'rarity' | 'type'>;
export const BOOKMARK_KEY = 'hs-codex:bookmarks:v1';
export const POSITION_KEY = 'hs-codex:position:v1';

// Facets use recorded positive properties, not item names or a guessed power score.
const focusPatterns: Record<string, RegExp> = {
  Physical:
    /^(?:to physical (?:damage|skills)|extra physical damage|.*bleed damage|.*open wounds bleeding)/i,
  'Weapon damage': /^(?:enhanced damage|attack damage|to attack damage)/i,
  Fire: /(?:additive fire damage|fire skill damage|to fire skills)/i,
  Cold: /(?:additive cold damage|cold skill damage|to cold skills)/i,
  Lightning:
    /(?:additive lightning damage|lightning skill damage|to lightning skills)/i,
  Poison:
    /(?:additive poison damage|poison skill damage|to poison skills|poisoned damage)/i,
  Arcane: /(?:additive arcane damage|arcane skill damage|to arcane skills)/i,
  Magic: /magic skill damage/i,
  Summons: /summon.*(?:skills|damage|attack speed|life|duration|amount)/i,
  Sentries: /sentr.*(?:skills|damage|attack speed|life|duration|amount)/i,
};
export const FOCUS_OPTIONS = Object.keys(focusPatterns);
export const EFFECT_OPTIONS = [
  { value: 'special', label: 'Any special effect', keys: [] },
  { value: 'attack', label: 'Cast when attacking', keys: [115] },
  { value: 'strike', label: 'Cast when striking', keys: [118] },
  { value: 'cast', label: 'Cast when casting', keys: [127] },
  { value: 'kill', label: 'Cast after a kill', keys: [124] },
  { value: 'struck', label: 'Cast when struck', keys: [187] },
  { value: 'block', label: 'Cast after blocking', keys: [190] },
  { value: 'cleave', label: 'Attacks hit multiple enemies', keys: [292] },
  { value: 'freeze', label: 'Cannot be frozen', keys: [288] },
  { value: 'mirror', label: 'Mirrors the other ring', keys: [293] },
  { value: 'phasing', label: 'Movement phasing', keys: [26] },
  { value: 'fork', label: 'Projectiles fork', keys: [415] },
  { value: 'return', label: 'Projectiles return', keys: [416] },
];
export function supportsFocus(item: Item, focus: string) {
  if (focus === 'Any focus') return true;
  const pattern = focusPatterns[focus];
  return (
    !!pattern &&
    item.stats.some(
      (s) =>
        !s.rolled && Number.parseFloat(s.value) > 0 && pattern.test(s.label),
    )
  );
}
export function hasEffect(item: Item, effect: string) {
  if (effect === 'Any effect') return true;
  if (effect === 'special') return item.effects.length > 0;
  const option = EFFECT_OPTIONS.find((o) => o.value === effect);
  return (
    !!option &&
    item.effects.some((e) => e.key !== undefined && option.keys.includes(e.key))
  );
}
export function applyFilters(items: Item[], filters: CatalogFilters) {
  return items.filter(
    (item) =>
      (filters.category === 'All categories' ||
        item.category === filters.category) &&
      supportsFocus(item, filters.focus) &&
      hasEffect(item, filters.effect) &&
      (!filters.loreOnly || item.lore?.kind === 'Lore'),
  );
}
export function filterCount(filters: CatalogFilters) {
  return (
    Number(filters.category !== 'All categories') +
    Number(filters.focus !== 'Any focus') +
    Number(filters.effect !== 'Any effect') +
    Number(filters.loreOnly)
  );
}
export function parseBookmarks(raw: string | null): SavedItem[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? 'null');
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<number>();
    return parsed
      .filter((row): row is SavedItem => {
        if (
          !row ||
          !Number.isInteger(row.id) ||
          seen.has(row.id) ||
          !['key', 'name', 'rarity', 'type'].every(
            (k) =>
              typeof row[k] === 'string' &&
              row[k].length > 0 &&
              row[k].length < 300,
          )
        )
          return false;
        seen.add(row.id);
        return true;
      })
      .slice(0, 2500)
      .map(({ id, key, name, rarity, type }) => ({
        id,
        key,
        name,
        rarity,
        type,
      }));
  } catch {
    return [];
  }
}
export function parsePosition(
  raw: string | null,
  rarities: string[],
  categories: string[],
): ReaderPosition | null {
  try {
    const row = JSON.parse(raw ?? 'null');
    if (
      !row ||
      !rarities.includes(row.rarity) ||
      !Number.isInteger(row.cursor) ||
      row.cursor < 0
    )
      return null;
    const f = row.filters ?? {};
    return {
      rarity: row.rarity,
      cursor: Math.min(row.cursor, 10000),
      filters: {
        category: categories.includes(f.category)
          ? f.category
          : 'All categories',
        focus: FOCUS_OPTIONS.includes(f.focus) ? f.focus : 'Any focus',
        effect: EFFECT_OPTIONS.some((e) => e.value === f.effect)
          ? f.effect
          : 'Any effect',
        loreOnly: f.loreOnly === true,
      },
    };
  } catch {
    return null;
  }
}
export function toggleSaved(items: SavedItem[], item: Item): SavedItem[] {
  if (items.some((s) => s.id === item.id))
    return items.filter((s) => s.id !== item.id);
  const { id, key, name, rarity, type } = item;
  return [...items, { id, key, name, rarity, type }];
}
