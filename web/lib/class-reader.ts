export type SkillIdentity = { sourceKey: string; name: string };
export type SkillSearchEntry = {
  classSlug: string;
  className: string;
  key: string;
  name: string;
};

export const skillKey = (skill: SkillIdentity) =>
  skill.sourceKey.replace(/^talent_desc_/, '');
export const classStorageKey = (slug: string) => `hs-class-reader-v1:${slug}`;

export function resolveSkill(key: string | null, skills: SkillIdentity[]) {
  if (key === null || key === 'portrait') return -1;
  return skills.findIndex((skill) => skillKey(skill) === key);
}

export function readClassPosition(
  raw: string | null,
  skills: SkillIdentity[],
): string | null {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object') return null;
    const record = value as { version?: unknown; skill?: unknown };
    return record.version === 1 &&
      typeof record.skill === 'string' &&
      (record.skill === 'portrait' || resolveSkill(record.skill, skills) >= 0)
      ? record.skill
      : null;
  } catch {
    return null;
  }
}

export function classEntryHref(slug: string, key?: string | null) {
  const params = new URLSearchParams({ class: slug });
  if (key) params.set('skill', key);
  return `/class-study?${params}`;
}

export function readSkillLink(
  params: URLSearchParams,
  skills: SkillIdentity[],
) {
  if (!params.has('skill')) return null;
  const key = params.get('skill');
  if (
    !key ||
    params.getAll('skill').length !== 1 ||
    (key !== 'portrait' && resolveSkill(key, skills) < 0)
  ) {
    throw new Error('This skill link is unavailable.');
  }
  return key;
}

export function classSpread(position: number, mobile: boolean, count: number) {
  // Leave space for original descriptions and the linked game terms at Reading Size.
  const perLeaf = mobile ? 1 : 2;
  const size = mobile ? 1 : 2;
  const cursor = position < 0 ? 0 : 1 + Math.floor(position / perLeaf);
  const leaves = 1 + Math.ceil(count / perLeaf);
  return {
    perLeaf,
    size,
    leaves,
    start: Math.floor(cursor / size) * size,
    lastStart: Math.floor((leaves - 1) / size) * size,
  };
}

const normalize = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function searchClassSkills(rows: SkillSearchEntry[], query: string) {
  const needle = normalize(query).slice(0, 120);
  if (!needle) return [];
  const words = needle.split(/\s+/);
  return rows
    .filter((row) => {
      const text = normalize(`${row.className} ${row.name}`);
      return words.every((word) => text.includes(word));
    })
    .sort((a, b) => {
      const rank = (row: SkillSearchEntry) =>
        normalize(row.name) === needle
          ? 0
          : normalize(row.name).startsWith(needle)
            ? 1
            : 2;
      return (
        rank(a) - rank(b) ||
        a.className.localeCompare(b.className) ||
        a.name.localeCompare(b.name)
      );
    });
}
