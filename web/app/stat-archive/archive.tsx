'use client';
import EntryContents from '../scholar/entry-contents';
import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Compass,
  Feather,
  Heart,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react';
import ScholarShell, {
  ArchiveSearch,
  CopyEntry,
  EntryNavigation,
  EntryState,
  ExploreArchives,
  IndexEntry,
} from '../scholar/shell';
import {
  readStatLink,
  searchStatEntries,
  statArchiveHref,
  type StatCategory,
  type StatEntry,
} from '@/lib/stat-archive';
const symbols = {
  attributes: Sparkles,
  combat: Swords,
  elements: Sparkles,
  defense: Shield,
  recovery: Heart,
  utility: Compass,
  professions: Feather,
};
function GameText({ text }: { text: string }) {
  return (
    <>
      {text.split('[input_attribute_add_multi]').map((part, index) => (
        <span key={index}>
          {index > 0 && (
            <kbd title="Your configured in-game multi-point shortcut">
              Multi-point shortcut
            </kbd>
          )}
          {part}
        </span>
      ))}
    </>
  );
}
export default function Archive({
  entries,
  categories,
  initial,
}: {
  entries: StatEntry[];
  categories: StatCategory[];
  initial: string | null;
}) {
  const [selected, setSelected] = useState(initial ?? entries[0].slug);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const entry = entries.find((e) => e.slug === selected)!;
  const category = categories.find((c) => c.id === entry.category)!;
  const results = useMemo(
    () => searchStatEntries(entries, query, 'all'),
    [entries, query],
  );
  const position = entries.indexOf(entry);
  const Symbol = symbols[entry.category as keyof typeof symbols] ?? BookOpen;
  function navigate(slug: string, push = true) {
    if (!entries.some((e) => e.slug === slug)) return;
    const url = new URL(window.location.href);
    url.searchParams.set('stat', slug);
    window.history[push ? 'pushState' : 'replaceState'](null, '', url);
    setSelected(slug);
    setError('');
  }
  useEffect(() => {
    const pop = () => {
      try {
        setSelected(
          readStatLink(new URLSearchParams(location.search), entries) ??
            entries[0].slug,
        );
        setError('');
      } catch {
        setError(
          'This stat entry could not be found. Choose a description from the index.',
        );
      }
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, [entries]);
  const related = entries
    .filter((e) => e.category === entry.category && e.slug !== entry.slug)
    .slice(0, 2);
  return (
    <ScholarShell
      active="stats"
      resetKey={selected}
      title="Stat Archive"
      browse={{ label: 'stats', count: results.length }}
      count={`${entries.length} original game descriptions`}
      index={
        <>
          <ArchiveSearch
            value={query}
            onChange={setQuery}
            label="Find a stat"
          />
          {query ? (
            <>
              <p className="scholar-eyebrow">{results.length} results</p>
              {results.map((e) => (
                <IndexEntry
                  key={e.slug}
                  active={selected === e.slug}
                  onClick={() => navigate(e.slug)}
                >
                  {e.label}
                </IndexEntry>
              ))}
              {!results.length && <p>No descriptions match your search.</p>}
            </>
          ) : (
            categories.map((c) => (
              <details key={c.id} open={c.id === category.id}>
                <summary>{c.label}</summary>
                {entries
                  .filter((e) => e.category === c.id)
                  .map((e) => (
                    <IndexEntry
                      key={e.slug}
                      active={selected === e.slug}
                      onClick={() => navigate(e.slug)}
                    >
                      {e.label}
                    </IndexEntry>
                  ))}
              </details>
            ))
          )}
        </>
      }
    >
      {error ? (
        <EntryState title="Entry unavailable">
          <p>{error}</p>
        </EntryState>
      ) : (
        <article className="scholar-stat-record scholar-compact-record">
          <EntryContents entryKey={selected} />
          <p className="scholar-breadcrumb">
            <span>Stats</span>
            <span>{category.label}</span>
          </p>
          <div className="scholar-definition-card">
            <header className="scholar-record-head">
              <div className="scholar-stat-symbol">
                <Symbol size={48} strokeWidth={1} />
              </div>
              <div>
                <p className="scholar-eyebrow">{category.label}</p>
                <h1>{entry.label}</h1>
              </div>
              <CopyEntry
                key={entry.slug}
                name={entry.label}
                href={statArchiveHref(entry.sourceKey)}
              />
            </header>
            <section
              className="scholar-definition"
              aria-label="Original game description"
            >
              <p className="scholar-eyebrow">Original game description</p>
              <p>
                <GameText text={entry.text} />
              </p>
            </section>
          </div>
          <section className="scholar-related">
            <h2>Related descriptions</h2>
            <div className="scholar-related-grid">
              {related.map((e) => (
                <IndexEntry key={e.slug} onClick={() => navigate(e.slug)}>
                  <span>
                    <strong>{e.label}</strong>
                    <p>
                      <GameText text={e.text} />
                    </p>
                  </span>
                </IndexEntry>
              ))}
            </div>
          </section>
          <ExploreArchives current="stats" />
          <EntryNavigation
            previous={entries[position - 1]?.label}
            next={entries[position + 1]?.label}
            onPrevious={() => navigate(entries[position - 1].slug, false)}
            onNext={() => navigate(entries[position + 1].slug, false)}
            position={`${position + 1} / ${entries.length}`}
          />
        </article>
      )}
    </ScholarShell>
  );
}
