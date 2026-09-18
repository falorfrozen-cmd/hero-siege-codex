import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Archive from './archive';
import entries from './entries.json';
import index from './index.json';
import { readRelicLink } from '@/lib/relic-archive';

export const metadata: Metadata = {
  title: 'Relics — Hero Siege Codex',
  description:
    'Hero Siege relics and their original in-game descriptions and abilities.',
};
export default async function RelicArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const link = new URLSearchParams();
  for (const value of typeof params.relic === 'string'
    ? [params.relic]
    : (params.relic ?? []))
    link.append('relic', value);
  let key: string;
  try {
    key = readRelicLink(link, entries);
  } catch {
    notFound();
  }
  return (
    <Archive
      initial={entries.find((entry) => entry.key === key)!}
      entries={index}
    />
  );
}
