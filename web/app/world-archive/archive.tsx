'use client';
import EntryContents from '../scholar/entry-contents';
import { useIndexWindow } from '../scholar/use-index-window';
/* oxlint-disable next/no-html-link-for-pages */
import { useCallback, useMemo, useState } from 'react';
import { Compass, Feather } from 'lucide-react';
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
  findWorldEntries,
  worldHref,
  worldTextParts,
  type WorldEntry,
  type WorldVolume,
} from '@/lib/world-archive';
const getKey = (entry: WorldEntry) => entry.key;
const valid = (entry: WorldEntry) =>
  typeof entry.text === 'string' && Array.isArray(entry.objectives);
function GameText({ text }: { text: string }) {
  return (
    <>
      {worldTextParts(text).map((part, i) =>
        part.kind === 'control' ? (
          <kbd key={i}>{part.text}</kbd>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
export default function Archive({
  initial,
  volume,
}: {
  initial: WorldEntry;
  volume: WorldVolume;
}) {
  const [query, setQuery] = useState('');
  const [chapter, setChapter] = useState('all');
  const [size, setSize] = useState('all');
  const isEther = initial.kind === 'ether';
  const href = useCallback(
    (key: string) => worldHref(initial.kind, key),
    [initial.kind],
  );
  const readKey = useCallback(
    (params: URLSearchParams) => {
      const key = params.get('entry') ?? volume.entries[0].key;
      if (
        params.getAll('entry').length > 1 ||
        params.getAll('volume').length > 1 ||
        (params.has('volume') && params.get('volume') !== initial.kind) ||
        !volume.entries.some((e) => e.key === key)
      )
        throw new Error('Entry unavailable');
      return key;
    },
    [initial.kind, volume],
  );
  const reader = useRecord({
    initial,
    initialKey: initial.key,
    records: volume.entries,
    getKey,
    href,
    readKey,
    valid,
  });
  const { entry, selected, navigate } = reader;
  const results = useMemo(
    () => findWorldEntries(volume.entries, query, chapter, size),
    [volume, query, chapter, size],
  );
  const position = results.findIndex((e) => e.key === selected);
  const chapterPeers = volume.entries.filter(
    (e) => e.chapter === entry.chapter && e.key !== entry.key,
  );
  const windowed = useIndexWindow(
    results,
    selected,
    results.findIndex((e) => e.key === selected),
  );
  return (
    <ScholarShell
      active="world"
      resetKey={selected}
      title="World Archive"
      browse={{ label: isEther ? 'nodes' : 'quests', count: results.length }}
      count={
        isEther
          ? '217 Ether nodes · 15 chapters'
          : '200 quest records · 19 chapters'
      }
      index={
        <>
          <nav className="scholar-tabs" aria-label="World collections">
            <a
              href={worldHref('ether')}
              aria-current={isEther ? 'page' : undefined}
            >
              Ether <small>217</small>
            </a>
            <a
              href={worldHref('quests')}
              aria-current={!isEther ? 'page' : undefined}
            >
              Quests <small>200</small>
            </a>
          </nav>
          <ArchiveSearch
            value={query}
            onChange={(v) => {
              setQuery(v);
              windowed.setPage(null);
            }}
            label={
              isEther ? 'Find a node or effect' : 'Find a quest or objective'
            }
          />
          <label>
            Chapter
            <select
              value={chapter}
              onChange={(e) => {
                setChapter(e.target.value);
                windowed.setPage(null);
              }}
            >
              <option value="all">All chapters</option>
              {volume.chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.label} · {ch.count}
                </option>
              ))}
            </select>
          </label>
          {isEther && (
            <label>
              Node size
              <select
                value={size}
                onChange={(e) => {
                  setSize(e.target.value);
                  windowed.setPage(null);
                }}
              >
                <option value="all">All sizes</option>
                <option value="large">Large</option>
                <option value="small">Small</option>
              </select>
            </label>
          )}
          <p className="scholar-eyebrow">{results.length} entries</p>
          {windowed.entries.map((e) => (
            <IndexEntry
              key={e.key}
              active={e.key === selected}
              onClick={() => navigate(e.key)}
            >
              <span>
                {e.name}
                <small>
                  {volume.chapters.find((ch) => ch.id === e.chapter)?.label}
                  {e.size ? ` · ${e.size} node` : ''}
                </small>
              </span>
            </IndexEntry>
          ))}
          {!results.length && <p>No entries match these filters.</p>}
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
          title={reader.error ? 'Entry unavailable' : 'Loading entry…'}
        >
          <p>{reader.error}</p>
          {reader.error && <Button onClick={reader.retry}>Try again</Button>}
        </EntryState>
      ) : (
        <article>
          <EntryContents entryKey={selected} />
          <p className="scholar-breadcrumb">
            <span>World</span>
            <span>{isEther ? 'Ether' : 'Quests'}</span>
            <span>{entry.chapterLabel}</span>
          </p>
          <header className="scholar-record-head">
            <div className="scholar-stat-symbol">
              {isEther ? (
                <Compass size={46} strokeWidth={1} />
              ) : (
                <Feather size={44} strokeWidth={1} />
              )}
            </div>
            <div>
              <p className="scholar-eyebrow">
                {isEther
                  ? `${entry.size} node`
                  : `Quest ${entry.key.replace('quest_', '')}`}
              </p>
              <h1>{entry.name}</h1>
            </div>
            <CopyEntry
              key={entry.key}
              name={entry.name}
              href={href(entry.key)}
            />
          </header>
          <section className="scholar-definition">
            <p className="scholar-eyebrow">
              {isEther ? 'Node effect' : 'Quest description'}
            </p>
            <p className="scholar-game-text">
              <GameText text={entry.text} />
            </p>
          </section>
          {entry.text.includes('[input_') && (
            <p className="scholar-caption">
              Control names are shown in place of your assigned keys.
            </p>
          )}
          {entry.text.includes('[fortune_item_name]') && (
            <p className="scholar-caption">
              The revealed item name is supplied in-game.
            </p>
          )}
          {!isEther && (
            <section className="scholar-section">
              <h2>
                Objectives <small>{entry.objectives.length}</small>
              </h2>
              {entry.objectives.length ? (
                <ol className="scholar-objectives">
                  {entry.objectives.map((objective, i) => (
                    <li key={i}>
                      <span>{String(i + 1).padStart(2, '0')}</span>
                      <p>
                        <GameText text={objective} />
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No objectives are recorded for this quest.</p>
              )}
            </section>
          )}
          {!!chapterPeers.length && (
            <section className="scholar-related">
              <h2>More in {entry.chapterLabel}</h2>
              <div className="scholar-related-grid">
                {chapterPeers.slice(0, 6).map((e) => (
                  <IndexEntry key={e.key} onClick={() => navigate(e.key)}>
                    <span>
                      <strong>{e.name}</strong>
                      {e.size && <small>{e.size} node</small>}
                    </span>
                  </IndexEntry>
                ))}
              </div>
            </section>
          )}
          <EntryNavigation
            previous={position >= 0 ? results[position - 1]?.name : undefined}
            next={position >= 0 ? results[position + 1]?.name : undefined}
            onPrevious={() => navigate(results[position - 1].key, false)}
            onNext={() => navigate(results[position + 1].key, false)}
            position={
              position >= 0
                ? `${position + 1} / ${results.length}`
                : 'Outside current filter'
            }
          />
        </article>
      )}
    </ScholarShell>
  );
}
