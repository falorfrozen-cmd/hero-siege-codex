'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  searchCodex,
  searchKinds,
  type SearchRecord,
} from '@/lib/codex-search';
import manifest from '@/lib/codex-search-manifest.json';
let request: Promise<SearchRecord[]> | null = null;
function loadIndex() {
  return (request ??= fetch(manifest.path)
    .then(async (response) => {
      if (!response.ok) throw new Error('Search is temporarily unavailable.');
      const rows = await response.json();
      if (
        !Array.isArray(rows) ||
        rows.length !== manifest.total ||
        rows.some(
          (row) =>
            typeof row.name !== 'string' ||
            typeof row.terms !== 'string' ||
            typeof row.detail !== 'string' ||
            !searchKinds.includes(row.kind) ||
            typeof row.href !== 'string' ||
            !/^\/(?:\?|[a-z-]+\?)/.test(row.href),
        )
      )
        throw new Error('The search index could not be read.');
      return rows as SearchRecord[];
    })
    .catch((error) => {
      request = null;
      throw error;
    }));
}
export default function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('All');
  const [rows, setRows] = useState<SearchRecord[]>([]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [limit, setLimit] = useState(40);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLElement>(null);
  function navigateResults(event: KeyboardEvent) {
    if (event.key === 'Enter' && event.target === input.current) {
      event.preventDefault();
      list.current?.querySelector<HTMLButtonElement>('button')?.click();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const buttons = Array.from(
      list.current?.querySelectorAll<HTMLButtonElement>('button') ?? [],
    );
    if (!buttons.length) return;
    event.preventDefault();
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = index + (event.key === 'ArrowDown' ? 1 : -1);
    if (index < 0)
      buttons[event.key === 'ArrowDown' ? 0 : buttons.length - 1].focus();
    else if (next < 0 || next >= buttons.length) input.current?.focus();
    else buttons[next].focus();
  }
  useEffect(() => {
    if (!open || rows.length) return;
    let active = true;
    loadIndex()
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((reason) => {
        if (active) setError(reason.message);
      });
    return () => {
      active = false;
    };
  }, [open, rows.length, attempt]);
  const results = useMemo(
    () => searchCodex(rows, query.slice(0, 120), kind),
    [rows, query, kind],
  );
  function choose(row: SearchRecord) {
    const target = new URL(row.href, location.origin);
    if (row.kind === 'Items') {
      const current = new URLSearchParams(location.search);
      for (const key of ['creator', 'mark', 'markVariant'])
        if (current.has(key)) target.searchParams.set(key, current.get(key)!);
    }
    location.assign(target.pathname + target.search);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="scholar-search-dialog" initialFocus={input}>
        <DialogHeader>
          <DialogTitle>Search the Codex</DialogTitle>
          <DialogDescription>
            Items, stats, classes, skills, creatures, relics and world records.
          </DialogDescription>
        </DialogHeader>
        <div data-slot="command">
          <Input
            ref={input}
            data-slot="command-input"
            onKeyDown={navigateResults}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(40);
            }}
            placeholder="Search a name, ability or game term…"
            aria-label="Search the whole Codex"
            maxLength={120}
          />
          <div className="scholar-search-kinds" aria-label="Search categories">
            {['All', ...searchKinds].map((label) => (
              <button
                type="button"
                key={label}
                aria-pressed={kind === label}
                onClick={() => {
                  setKind(label);
                  setLimit(40);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <output className="scholar-search-count">
            {error
              ? 'Search unavailable'
              : !rows.length
                ? 'Loading the archive index…'
                : query.trim()
                  ? `${results.length} matching records`
                  : `${manifest.total.toLocaleString('en-US')} records across six archives`}
          </output>
          <section
            ref={list}
            data-slot="command-list"
            aria-label="Codex search results"
          >
            {error ? (
              <div className="scholar-search-message">
                <p role="alert">{error}</p>
                <Button
                  onClick={() => {
                    setError('');
                    setAttempt((n) => n + 1);
                  }}
                >
                  Try again
                </Button>
              </div>
            ) : !query.trim() ? (
              <div className="scholar-search-message">
                <Search size={30} strokeWidth={1} />
                <p>What would you like to find?</p>
                <small>Try “Mika”, “Supernova” or “critical strike”.</small>
              </div>
            ) : rows.length > 0 && results.length === 0 ? (
              <div className="scholar-search-message">
                <p>No matching records.</p>
                <small>Try a shorter name or select another category.</small>
              </div>
            ) : (
              searchKinds
                .filter((group) => kind === 'All' || kind === group)
                .map((group) => {
                  const matches = results.filter((row) => row.kind === group);
                  if (!matches.length) return null;
                  return (
                    <section
                      key={group}
                      data-slot="command-group"
                      aria-label={group}
                    >
                      <h3 className="scholar-search-group-title">
                        {group} · {matches.length}
                      </h3>
                      {matches
                        .slice(0, kind === 'All' ? 5 : limit)
                        .map((row) => (
                          <button
                            type="button"
                            data-slot="command-item"
                            onKeyDown={navigateResults}
                            key={row.href}
                            onClick={() => choose(row)}
                          >
                            <span>
                              <strong>{row.name}</strong>
                              <small>{row.detail}</small>
                            </span>
                            <ArrowUpRight size={16} />
                          </button>
                        ))}
                      {kind === 'All' && matches.length > 5 && (
                        <button
                          type="button"
                          data-slot="command-item"
                          onKeyDown={navigateResults}
                          onClick={() => {
                            setKind(group);
                            setLimit(40);
                            input.current?.focus();
                          }}
                        >
                          View all {matches.length} {group.toLowerCase()}
                        </button>
                      )}
                    </section>
                  );
                })
            )}
            {kind !== 'All' && results.length > limit && (
              <button
                type="button"
                data-slot="command-item"
                onKeyDown={navigateResults}
                onClick={() => setLimit((n) => n + 40)}
              >
                Show more results
              </button>
            )}
          </section>
        </div>
        <div className="scholar-search-hint">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> Navigate
          </span>
          <span>
            <kbd>Enter</kbd> Open
          </span>
          <span>
            <kbd>Esc</kbd> Close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
