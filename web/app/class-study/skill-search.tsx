'use client';

/* oxlint-disable next/no-html-link-for-pages */
import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  classEntryHref,
  searchClassSkills,
  type SkillSearchEntry,
} from '../../lib/class-reader';
import archive from '../../lib/class-archive-manifest.json';

let indexRequest: Promise<SkillSearchEntry[]> | undefined;
function loadIndex() {
  if (!indexRequest) {
    indexRequest = fetch(archive.index)
      .then(async (response) => {
        if (!response.ok) throw new Error('Unavailable');
        const data: unknown = await response.json();
        if (
          !Array.isArray(data) ||
          data.length > 1000 ||
          !data.every(
            (row) =>
              row &&
              typeof row.name === 'string' &&
              typeof row.className === 'string' &&
              typeof row.key === 'string' &&
              /^[a-zA-Z0-9]+$/.test(row.key) &&
              typeof row.classSlug === 'string' &&
              /^[a-z0-9-]+$/.test(row.classSlug),
          )
        ) {
          throw new Error('Invalid index');
        }
        return data as SkillSearchEntry[];
      })
      .catch((error) => {
        indexRequest = undefined;
        throw error;
      });
  }
  return indexRequest;
}

export default function SkillSearch({
  currentClass,
  onSelect,
}: {
  currentClass: string;
  onSelect: (key: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<SkillSearchEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  );
  const alive = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function prepare() {
    if (status === 'loading' || status === 'ready') return;
    setStatus('loading');
    try {
      const records = await loadIndex();
      if (alive.current) {
        setRows(records);
        setStatus('ready');
      }
    } catch {
      if (alive.current) setStatus('error');
    }
  }
  const results = searchClassSkills(rows, query);
  const active = query.trim().length > 0;
  function select(key: string) {
    if (panel.current) panel.current.open = false;
    setQuery('');
    onSelect(key);
  }
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Delegate Escape from the disclosure controls and result links.
    <details
      className="skill-search study-tools"
      ref={panel}
      onToggle={(event) => {
        if (event.currentTarget.open) input.current?.focus();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          if (panel.current) panel.current.open = false;
          panel.current?.querySelector('summary')?.focus();
        }
      }}
    >
      <summary>
        <Search size={17} aria-hidden="true" />
        <span>Find a skill</span>
        <span className="skill-search-count">24 classes</span>
      </summary>
      <search className="skill-search-panel">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (status !== 'ready' || !active || !results.length) return;
            const first = results[0];
            if (first.classSlug === currentClass) select(first.key);
            else
              window.location.assign(
                classEntryHref(first.classSlug, first.key),
              );
          }}
        >
          <label htmlFor="class-skill-search">
            Search by skill or class name
          </label>
          <div className="skill-search-input">
            <Search size={18} aria-hidden="true" />
            <input
              id="class-skill-search"
              ref={input}
              type="search"
              maxLength={120}
              autoComplete="off"
              placeholder="Meteor, Viking, Charged Bolts…"
              value={query}
              onFocus={prepare}
              onChange={(event) => {
                setQuery(event.target.value);
                void prepare();
              }}
            />
            {query && (
              <button
                type="button"
                aria-label="Clear skill search"
                onClick={() => {
                  setQuery('');
                  input.current?.focus();
                }}
              >
                <X size={17} aria-hidden="true" />
              </button>
            )}
          </div>
        </form>
        <output className="skill-search-status">
          {status === 'loading'
            ? 'Loading the skill index…'
            : status === 'error'
              ? 'The skill index could not be loaded.'
              : active && status === 'ready'
                ? results.length
                  ? `${results.length} ${results.length === 1 ? 'skill' : 'skills'} found${results.length > 8 ? ' · Showing 8. Refine your search for more.' : ''}`
                  : 'No matching skills. Try another skill or class name.'
                : 'Find a technique across all 24 classes.'}
        </output>
        {status === 'error' && (
          <button type="button" className="study-retry" onClick={prepare}>
            Try again
          </button>
        )}
        {active && status === 'ready' && (
          <ul className="skill-search-results">
            {results.slice(0, 8).map((row) => (
              <li key={`${row.classSlug}:${row.key}`}>
                <a
                  href={classEntryHref(row.classSlug, row.key)}
                  onClick={(event) => {
                    if (
                      row.classSlug === currentClass &&
                      !event.ctrlKey &&
                      !event.metaKey &&
                      !event.shiftKey &&
                      !event.altKey &&
                      event.button === 0
                    ) {
                      event.preventDefault();
                      select(row.key);
                    }
                  }}
                >
                  <span>{row.name}</span>
                  <small>{row.className}</small>
                </a>
              </li>
            ))}
          </ul>
        )}
      </search>
    </details>
  );
}
