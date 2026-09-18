'use client';
import EntryContents from '../scholar/entry-contents';
/* oxlint-disable next/no-html-link-for-pages */
import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import { MapPin, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ScholarShell, {
  ArchiveSearch,
  CopyEntry,
  EntryNavigation,
  EntryState,
  IndexEntry,
} from '../scholar/shell';
import { useRecord } from '../scholar/use-record';
import {
  creatureHref,
  findCreatures,
  readCreatureLink,
  type CreatureCategory,
  type CreatureEntry,
  type CreatureIndexEntry,
} from '@/lib/creature-archive';
const getKey = (entry: CreatureEntry) => entry.slug;
const valid = (entry: CreatureEntry) =>
  Array.isArray(entry.names) && Array.isArray(entry.abilities);
export default function Archive({
  entries,
  categories,
  initial,
  version,
}: {
  entries: CreatureIndexEntry[];
  categories: CreatureCategory[];
  initial: CreatureEntry;
  version: string;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [limit, setLimit] = useState(40);
  const records = useMemo(
    () => entries.map((e) => ({ key: e.slug, file: e.file })),
    [entries],
  );
  const readKey = useCallback(
    (params: URLSearchParams) => readCreatureLink(params, entries) ?? 'gurag',
    [entries],
  );
  const reader = useRecord({
    initial,
    initialKey: initial.slug,
    records,
    getKey,
    href: creatureHref,
    readKey,
    valid,
  });
  const { entry, selected, navigate } = reader;
  const results = useMemo(
    () => findCreatures(entries, query, filter),
    [entries, query, filter],
  );
  const position = results.findIndex((e) => e.slug === selected);
  const category = categories.find((c) => c.id === entry.category)!;
  const guide = entry.fieldGuide;
  return (
    <ScholarShell
      active="creatures"
      resetKey={selected}
      title="Creature Archive"
      count={`${entries.length} records · Game ${version.replace(/\.0$/, '')}`}
      index={
        <>
          <ArchiveSearch
            value={query}
            onChange={(v) => {
              setQuery(v);
              setLimit(40);
            }}
            label="Search creatures"
          />
          <label>
            Category
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setLimit(40);
              }}
            >
              <option value="all">All creatures</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <p className="scholar-eyebrow">{results.length} records</p>
          {results.slice(0, limit).map((e) => (
            <IndexEntry
              key={e.slug}
              active={e.slug === selected}
              onClick={() => navigate(e.slug)}
            >
              <span>
                {e.name}
                <small>
                  {e.location?.name ??
                    categories.find((c) => c.id === e.category)?.label}
                </small>
              </span>
            </IndexEntry>
          ))}
          {!results.length && <p>No creatures match this search.</p>}
          {results.length > limit && (
            <Button
              className="scholar-load-more"
              variant="outline"
              onClick={() => setLimit((n) => n + 40)}
            >
              Show more creatures
            </Button>
          )}
        </>
      }
    >
      {reader.error || reader.loading ? (
        <EntryState
          title={reader.error ? 'Entry unavailable' : 'Loading creature…'}
        >
          <p>{reader.error}</p>
          {reader.error && <Button onClick={reader.retry}>Try again</Button>}
        </EntryState>
      ) : (
        <article>
          <EntryContents entryKey={selected} />
          <p className="scholar-breadcrumb">
            <span>Creatures</span>
            <span>{category.label}</span>
          </p>
          <header className="scholar-record-head">
            <div>
              <p className="scholar-eyebrow">
                {entry.recordKind === 'encounter-part'
                  ? 'Encounter component'
                  : entry.recordKind === 'name-record'
                    ? 'Preserved name'
                    : category.label}
              </p>
              <h1>{entry.name}</h1>
            </div>
            <CopyEntry
              key={entry.slug}
              href={creatureHref(entry.slug)}
              name={entry.name}
            />
          </header>
          <div className="scholar-creature-profile">
            <figure className="scholar-creature-art">
              {entry.artwork === 'text-record' ? (
                <div className="scholar-empty">
                  <Skull size={48} strokeWidth={1} />
                  <p>Appearance unconfirmed</p>
                </div>
              ) : (
                <picture>
                  {entry.mobileImage && (
                    <source
                      media="(max-width:767px)"
                      srcSet={entry.mobileImage}
                    />
                  )}
                  <Image
                    unoptimized
                    src={entry.image}
                    width={entry.width}
                    height={entry.height}
                    alt={`${entry.name} — Codex illustration`}
                    priority
                  />
                </picture>
              )}
              <figcaption>
                {entry.artwork === 'codex-illustration'
                  ? 'Codex illustration · Artistic interpretation'
                  : entry.artwork === 'game-sprite'
                    ? 'Original game artwork'
                    : 'Preserved name record'}
              </figcaption>
            </figure>
            <div className="scholar-creature-facts">
              {entry.appearanceNote && (
                <p className="scholar-caption">{entry.appearanceNote}</p>
              )}
              {entry.location && (
                <section>
                  <h3>
                    <MapPin size={17} /> Found in
                  </h3>
                  <p>
                    {entry.location.name}
                    {entry.location.act && <small>{entry.location.act}</small>}
                  </p>
                </section>
              )}
              {!!entry.abilities.length && (
                <section>
                  <h3>
                    Named abilities <small>{entry.abilities.length}</small>
                  </h3>
                  <ul className="scholar-abilities">
                    {entry.abilities.map((a) => (
                      <li key={a.key}>{a.name}</li>
                    ))}
                  </ul>
                </section>
              )}
              {entry.quest && (
                <section>
                  <h3>Quest record</h3>
                  <h4>{entry.quest.name}</h4>
                  <p>{entry.quest.text}</p>
                </section>
              )}
              {entry.names.length > 1 && (
                <section>
                  <h3>Recorded names</h3>
                  <ul className="scholar-abilities">
                    {entry.names.map((n) => (
                      <li key={n.key}>{n.name}</li>
                    ))}
                  </ul>
                </section>
              )}
              {!entry.location &&
                !entry.abilities.length &&
                !entry.quest &&
                entry.names.length <= 1 && (
                  <section>
                    <h3>Archive record</h3>
                    <p>
                      {entry.recordKind === 'name-record'
                        ? 'This name is preserved in the game records. Appearance and encounter details are not confirmed.'
                        : 'No named abilities or specific location are recorded for this entry.'}
                    </p>
                  </section>
                )}
            </div>
          </div>
          {!!entry.companions.length && (
            <section className="scholar-section">
              <h2>Encounter companions</h2>
              <div className="scholar-companions">
                {entry.companions.map((c) => (
                  <figure key={c.name}>
                    <Image
                      unoptimized
                      src={c.image}
                      width={c.width}
                      height={c.height}
                      alt={c.name}
                      loading="lazy"
                    />
                    <figcaption>{c.name}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
          {guide && (
            <section className="scholar-section scholar-guide">
              <h2>Encounter guide</h2>
              {!!guide.regions.length && (
                <section>
                  <h3>Recorded regions</h3>
                  <ul className="scholar-chips">
                    {guide.regions.map((r) => (
                      <li key={r.name}>{r.name}</li>
                    ))}
                  </ul>
                  {guide.regions.some((r) => r.kind === 'regional') && (
                    <p className="scholar-caption">
                      Listed among these regions’ possible encounters. Events
                      and special conditions may change which creatures appear.
                    </p>
                  )}
                </section>
              )}
              {!!guide.mechanics.length && (
                <section>
                  <h3>Encounter mechanics</h3>
                  {guide.mechanics.map((note) => (
                    <div key={note.title} className="scholar-guide-note">
                      <h4>{note.title}</h4>
                      <p>{note.text}</p>
                    </div>
                  ))}
                </section>
              )}
              {!!guide.related.length && (
                <section>
                  <h3>Connected encounters</h3>
                  <div className="scholar-related-grid">
                    {guide.related.map((r) => (
                      <IndexEntry key={r.slug} onClick={() => navigate(r.slug)}>
                        <span>
                          <strong>{r.name}</strong>
                          <small>{r.label}</small>
                        </span>
                      </IndexEntry>
                    ))}
                  </div>
                </section>
              )}
              {!!guide.drops.length && (
                <section>
                  <h3>Recorded rewards</h3>
                  {guide.drops.map((d) => (
                    <div key={d.name} className="scholar-guide-note">
                      <h4>
                        {d.itemKey ? (
                          <a href={`/?item=${encodeURIComponent(d.itemKey)}`}>
                            {d.name}
                          </a>
                        ) : (
                          d.name
                        )}
                      </h4>
                      <p>{d.text}</p>
                    </div>
                  ))}
                </section>
              )}
            </section>
          )}
          <EntryNavigation
            previous={position >= 0 ? results[position - 1]?.name : undefined}
            next={position >= 0 ? results[position + 1]?.name : undefined}
            onPrevious={() => navigate(results[position - 1].slug, false)}
            onNext={() => navigate(results[position + 1].slug, false)}
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
