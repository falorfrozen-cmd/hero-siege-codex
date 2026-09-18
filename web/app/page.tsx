import Catalog from './catalog';
import initialChapter from '@/lib/initial-chapter.json';
import type { Item } from '@/lib/catalog';
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <Catalog
      initialItems={initialChapter as Item[]}
      initialLink={
        params.item !== undefined ||
        params.variant !== undefined ||
        params.creator !== undefined ||
        params.mark !== undefined
      }
    />
  );
}
