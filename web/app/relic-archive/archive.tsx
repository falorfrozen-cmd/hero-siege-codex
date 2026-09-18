'use client';
import EntryContents from '../scholar/entry-contents';
import { useIndexWindow } from '../scholar/use-index-window';
import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import { Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ScholarShell, {
  ArchiveSearch,
  CopyEntry,
  EntryNavigation,
  EntryState,
  IndexEntry,
  IndexPagination,
} from '../scholar/shell';
import { useRecord } from '../scholar/use-record';
import {
  readRelicLink,
  relicHref,
  type RelicEntry,
  type RelicIndexEntry,
} from '@/lib/relic-archive';
const getKey = (entry: RelicEntry) => entry.key;
const valid = (entry: RelicEntry) =>
  typeof entry.name === 'string' && typeof entry.description === 'string';
export default function Archive({
  initial,
  entries,
}: {
  initial: RelicEntry;
  entries: RelicIndexEntry[];
}) {
  const [query, setQuery] = useState('');
  const readKey = useCallback(
    (params: URLSearchParams) => readRelicLink(params, entries),
    [entries],
  );
  const reader = useRecord({
    initial,
    initialKey: initial.key,
    records: entries,
    getKey,
    href: relicHref,
    readKey,
    valid,
  });
  const { entry, selected, navigate } = reader;
  const results = useMemo(
    () =>
      entries.filter((e) =>
        query
          .trim()
          .toLowerCase()
          .split(/\s+/)
          .every((t) => `${e.name} ${e.ability}`.toLowerCase().includes(t)),
      ),
    [entries, query],
  );
  const position = entries.findIndex((e) => e.key === selected);
  const windowed = useIndexWindow(
    results,
    selected,
    results.findIndex((e) => e.key === selected),
  );
  return (
    <ScholarShell
      active="relics"
      resetKey={selected}
      title="Relic Archive"
      browse={{ label: 'relics', count: results.length }}
      count={`${entries.length} curiosities & strange powers`}
      index={
        <>
          <ArchiveSearch
            value={query}
            onChange={(v) => {
              setQuery(v);
              windowed.setPage(null);
            }}
            label="Find a relic or ability"
          />
          <p className="scholar-eyebrow">{results.length} relics</p>
          {windowed.entries.map((e) => (
            <IndexEntry
              key={e.key}
              active={e.key === selected}
              image={e.image ?? null}
              onClick={() => navigate(e.key)}
            >
              <span>
                {e.name}
                <small>{e.ability}</small>
              </span>
            </IndexEntry>
          ))}
          {!results.length && <p>No relics match your search.</p>}
          <IndexPagination
            page={windowed.page}
            total={windowed.total}
            onPage={windowed.setPage}
          />
        </>
      }
    >
      {reader.error || reader.loading ? (
        <EntryState
          title={reader.error ? 'Entry unavailable' : 'Loading relic…'}
        >
          <p>{reader.error}</p>
          {reader.error && <Button onClick={reader.retry}>Try again</Button>}
        </EntryState>
      ) : (
        <article className="scholar-relic-record scholar-compact-record">
          <EntryContents entryKey={selected} />
          <p className="scholar-breadcrumb">
            <span>Items</span>
            <span>Relics</span>
          </p>
          <header className="scholar-record-head">
            <div>
              <p className="scholar-eyebrow">The Reliquary</p>
              <h1>{entry.name}</h1>
            </div>
            <CopyEntry
              key={entry.key}
              name={entry.name}
              href={relicHref(entry.key)}
            />
          </header>
          <div className="scholar-relic-hero">
            <div className="scholar-relic-art">
              {entry.image ? (
                <Image
                  unoptimized
                  src={entry.image}
                  width={entry.width}
                  height={entry.height}
                  alt={entry.name}
                />
              ) : (
                <Gem size={64} strokeWidth={1} />
              )}
            </div>
            <div>
              <p className="scholar-eyebrow">Original game text</p>
              <blockquote>{entry.description}</blockquote>
            </div>
          </div>
          <section className="scholar-section">
            <h2>Associated ability</h2>
            {entry.ability ? (
              <>
                <h3>{entry.ability.name}</h3>
                <p>{entry.ability.description}</p>
              </>
            ) : (
              <p>No associated ability is recorded for this relic.</p>
            )}
          </section>
          <EntryNavigation
            previous={entries[position - 1]?.name}
            next={entries[position + 1]?.name}
            onPrevious={() => navigate(entries[position - 1].key, false)}
            onNext={() => navigate(entries[position + 1].key, false)}
            position={`${position + 1} / ${entries.length}`}
          />
        </article>
      )}
    </ScholarShell>
  );
}
