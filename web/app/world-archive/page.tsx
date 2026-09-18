import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Archive from './archive';
import records from './entries.json';
import index from './index.json';
import {
  readWorldLink,
  type WorldEntry,
  type WorldKind,
  type WorldVolume,
} from '@/lib/world-archive';

export const metadata: Metadata = {
  title: 'The World Archive — Hero Siege Codex',
  description:
    'Explore Hero Siege Ether node effects, quest descriptions and objectives from original game records.',
};
export default async function WorldArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const link = new URLSearchParams();
  for (const name of ['volume', 'entry']) {
    const values = params[name];
    for (const value of typeof values === 'string' ? [values] : (values ?? []))
      link.append(name, value);
  }
  const volumes = index as Record<WorldKind, WorldVolume>;
  let position;
  try {
    position = readWorldLink(link, volumes);
  } catch {
    notFound();
  }
  const initial = records.find(
    (entry) => entry.key === position.key,
  ) as WorldEntry;
  return (
    <Archive
      key={position.kind}
      initial={initial}
      volume={volumes[position.kind]}
    />
  );
}
