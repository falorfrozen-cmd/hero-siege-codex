export type CreatureCategory = { id: string; label: string; numeral: string };
export type CreatureEntry = {
  slug: string;
  name: string;
  category: string;
  image: string;
  mobileImage?: string;
  artwork: 'codex-illustration' | 'game-sprite' | 'text-record';
  recordKind?: 'creature' | 'encounter-part' | 'name-record';
  appearanceNote?: string;
  width: number;
  height: number;
  names: { key: string; name: string }[];
  abilities: { key: string; name: string }[];
  location: { name: string; act?: string } | null;
  quest: { name: string; text: string } | null;
  companions: { name: string; image: string; width: number; height: number }[];
  fieldGuide?: {
    regions: { name: string; kind: 'regional' | 'encounter' }[];
    mechanics: { title: string; text: string }[];
    related: { slug: string; name: string; label: string }[];
    drops: { name: string; text: string; itemKey?: string }[];
  };
};

export type CreatureIndexEntry = Pick<
  CreatureEntry,
  'slug' | 'name' | 'category' | 'location'
> & { search: string; file: string; image?: string | null };

export function creatureHref(slug: string) {
  return `/creature-archive?creature=${encodeURIComponent(slug)}`;
}

export function readCreatureLink(
  params: URLSearchParams,
  entries: Pick<CreatureEntry, 'slug'>[],
) {
  const keys = params.getAll('creature');
  if (!keys.length) return null;
  if (keys.length !== 1 || !entries.some((entry) => entry.slug === keys[0])) {
    throw new Error('This creature entry could not be found.');
  }
  return keys[0];
}

export function findCreatures<T extends CreatureEntry | CreatureIndexEntry>(
  entries: T[],
  query: string,
  category: string,
) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return entries.filter(
    (entry) =>
      (category === 'all' || entry.category === category) &&
      terms.every((term) =>
        ('search' in entry
          ? entry.search
          : [
              entry.name,
              ...entry.names.map((name) => name.name),
              ...entry.abilities.map((ability) => ability.name),
              entry.location?.name ?? '',
              entry.location?.act ?? '',
              ...(entry.fieldGuide?.regions.map((region) => region.name) ?? []),
            ]
              .join(' ')
              .toLowerCase()
        ).includes(term),
      ),
  );
}
