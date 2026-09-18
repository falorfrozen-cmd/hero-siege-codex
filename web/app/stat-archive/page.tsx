import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Archive from './archive';
import data from './entries.json';
import { readStatLink } from '@/lib/stat-archive';

export const metadata: Metadata = {
  title: 'The Stat Archive — Hero Siege Codex',
  description:
    'Browse 89 original Hero Siege game descriptions, from core attributes to combat, recovery and professions.',
};

export default async function StatArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const link = new URLSearchParams();
  for (const value of typeof params.stat === 'string'
    ? [params.stat]
    : (params.stat ?? [])) {
    link.append('stat', value);
  }
  let initial: string | null;
  try {
    initial = readStatLink(link, data.entries);
  } catch {
    notFound();
  }
  return (
    <Archive
      entries={data.entries}
      categories={data.categories}
      initial={initial}
    />
  );
}
