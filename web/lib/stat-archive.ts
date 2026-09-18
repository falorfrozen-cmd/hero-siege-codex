export type StatEntry = {
  slug: string;
  label: string;
  category: string;
  text: string;
  sourceKey: string;
  sourceLine: number;
  labelKey: string;
  statKey: number | null;
};
export type StatCategory = { id: string; label: string; numeral: string };
export type StatLeaf = { category: string; entries: StatEntry[] };

export function statArchiveHref(sourceKey: string) {
  const suffix = sourceKey.replace(/^stat_desc_/, '');
  const slug =
    suffix === 'pointsLeft' ? 'points-left' : suffix.replaceAll('_', '-');
  return `/stat-archive?stat=${encodeURIComponent(slug)}`;
}

export function statLeaves(
  entries: StatEntry[],
  categories: StatCategory[],
  perLeaf = 3,
): StatLeaf[] {
  return categories.flatMap(({ id }) => {
    const chapter = entries.filter((entry) => entry.category === id);
    const leaves: StatLeaf[] = [];
    for (let i = 0; i < chapter.length; i += perLeaf) {
      leaves.push({ category: id, entries: chapter.slice(i, i + perLeaf) });
    }
    return leaves;
  });
}

export function readStatLink(params: URLSearchParams, entries: StatEntry[]) {
  const values = params.getAll('stat');
  if (!values.length) return null;
  if (
    values.length !== 1 ||
    !entries.some((entry) => entry.slug === values[0])
  ) {
    throw new Error('This stat entry could not be found.');
  }
  return values[0];
}

export function searchStatEntries(
  entries: StatEntry[],
  query: string,
  category: string,
) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return entries
    .filter(
      (entry) =>
        (category === 'all' || entry.category === category) &&
        terms.every((term) =>
          `${entry.label} ${entry.text}`.toLowerCase().includes(term),
        ),
    )
    .sort((a, b) => a.label.localeCompare(b.label, 'en'));
}
