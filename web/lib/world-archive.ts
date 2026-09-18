export type WorldKind = 'ether' | 'quests';
export type WorldEntry = {
  key: string;
  kind: WorldKind;
  name: string;
  chapter: string;
  chapterLabel: string;
  size: 'large' | 'small' | null;
  text: string;
  objectives: string[];
};
export type WorldIndexEntry = Pick<
  WorldEntry,
  'key' | 'name' | 'chapter' | 'size'
> & { search: string; file: string };
export type WorldChapter = { id: string; label: string; count: number };
export type WorldVolume = {
  chapters: WorldChapter[];
  entries: WorldIndexEntry[];
};
export type WorldPosition = { kind: WorldKind; key: string };

export const worldHref = (kind: WorldKind, key?: string) => {
  const params = new URLSearchParams({ volume: kind });
  if (key) params.set('entry', key);
  return `/world-archive?${params}`;
};
export function readWorldLink(
  params: URLSearchParams,
  volumes: Record<WorldKind, WorldVolume>,
): WorldPosition {
  const kinds = params.getAll('volume');
  const keys = params.getAll('entry');
  if (
    kinds.length > 1 ||
    keys.length > 1 ||
    (kinds.length === 1 && kinds[0] !== 'ether' && kinds[0] !== 'quests')
  ) {
    throw new Error('This world entry could not be found.');
  }
  const kind = (kinds[0] ?? 'ether') as WorldKind;
  const key = keys[0] ?? volumes[kind].entries[0].key;
  if (!volumes[kind].entries.some((entry) => entry.key === key))
    throw new Error('This world entry could not be found.');
  return { kind, key };
}
const normalize = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '');
export function findWorldEntries(
  entries: WorldIndexEntry[],
  query: string,
  chapter: string,
  size: string,
) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return entries.filter(
    (entry) =>
      (chapter === 'all' || entry.chapter === chapter) &&
      (size === 'all' || entry.size === size) &&
      terms.every((term) => normalize(entry.search).includes(term)),
  );
}

// Commands are named rather than assigned invented keyboard bindings. These are
// presentation replacements; untouched source fields remain in the record files.
export const worldInputLabels: Record<string, string> = {
  input_talents: 'Stat & Skills',
  input_inventory: 'Inventory',
  input_pause_menu: 'Pause menu',
  input_jump: 'Jump',
  input_use: 'Interact',
  input_incarnation_remove: 'Close',
  input_incarnation_zoom: 'Assign skill',
  input_left_trigger: 'Left trigger',
  input_right_trigger: 'Right trigger',
};
export function worldTextParts(text: string) {
  return text
    .split(/(\[[^\]]+\])/)
    .filter(Boolean)
    .flatMap<{ kind: 'text' | 'control' | 'variable'; text: string }>(
      (part) => {
        if (!part.startsWith('['))
          return [{ kind: 'text' as const, text: part }];
        const token = part.slice(1, -1);
        if (token.startsWith('c_')) return [];
        if (token === 'nl') return [{ kind: 'text' as const, text: '\n' }];
        if (worldInputLabels[token])
          return [{ kind: 'control' as const, text: worldInputLabels[token] }];
        if (token === 'fortune_item_name')
          return [{ kind: 'variable' as const, text: 'Revealed item' }];
        return [{ kind: 'variable' as const, text: token }];
      },
    );
}
