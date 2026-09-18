import type { Item } from './catalog';

// Content cost, not a power score. Reserve space for long names, effects and
// unabridged lore before assigning any extra space to the illustration.
export function pageDensity(item?: Item, showLore = true) {
  if (!item) return 'balanced';
  const cost =
    item.stats.length +
    item.effects.reduce(
      (n, effect) => n + Math.ceil(effect.text.length / 65),
      0,
    ) +
    Math.ceil(
      (showLore || item.lore?.kind !== 'Lore'
        ? (item.lore?.text.length ?? 0)
        : 0) / 100,
    ) +
    (item.acquisition.length ? 2 : 1) +
    (item.set ? 1 : 0);
  return cost > 16 ? 'compact' : cost <= 7 ? 'showcase' : 'balanced';
}
