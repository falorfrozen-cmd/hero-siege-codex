export type RelicEntry = {
  key: string;
  name: string;
  description: string;
  ability: { key: string; name: string; description: string } | null;
  image: string;
  width: number;
  height: number;
};
export type RelicIndexEntry = {
  key: string;
  name: string;
  ability: string;
  file: string;
  image?: string | null;
};
export const relicHref = (key: string) =>
  `/relic-archive?relic=${encodeURIComponent(key)}`;
export function readRelicLink(
  params: URLSearchParams,
  entries: { key: string }[],
) {
  const values = params.getAll('relic');
  if (!values.length) return entries[0].key;
  if (
    values.length !== 1 ||
    !entries.some((entry) => entry.key === values[0])
  ) {
    throw new Error('This relic entry could not be found.');
  }
  return values[0];
}
