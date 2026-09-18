import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Archive from './archive';
import data from './entries.json';
import index from './index.json';
import { readCreatureLink, type CreatureEntry } from '@/lib/creature-archive';

const entries = data.entries as CreatureEntry[];

export const metadata: Metadata = {
  title: 'The Creature Archive — Hero Siege Codex',
  description:
    'Explore Hero Siege creatures, boss ability names and encounter locations drawn from the game.',
};

export default async function CreatureArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const link = new URLSearchParams();
  for (const value of typeof params.creature === 'string'
    ? [params.creature]
    : (params.creature ?? [])) {
    link.append('creature', value);
  }
  let initial: string | null;
  try {
    initial = readCreatureLink(link, entries);
  } catch {
    notFound();
  }
  return (
    <Archive
      entries={index.entries}
      categories={data.categories}
      initial={entries.find((entry) => entry.slug === (initial ?? 'gurag'))!}
      version={data.version}
    />
  );
}
