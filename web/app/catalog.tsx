'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  normalizeSearch,
  pageItems,
  validateChapter,
  type Item,
  type IndexItem,
} from '@/lib/catalog';
import {
  applyFilters,
  BOOKMARK_KEY,
  EFFECT_OPTIONS,
  EMPTY_FILTERS,
  filterCount,
  FOCUS_OPTIONS,
  parseBookmarks,
  parsePosition,
  POSITION_KEY,
  toggleSaved,
  type CatalogFilters,
  type ReaderPosition,
  type SavedItem,
} from '@/lib/reader';
import manifest from '@/lib/catalog-manifest.json';
import StatGlossary, { createStatHelpHandle } from './stat-glossary';
import DiscoverPanel from './discover-panel';
import { CreatorBookmarkPanel } from './creator-bookmark';
import { CREATORS } from '@/lib/creators';
import {
  entryHref,
  findLinkedEntry,
  readEntryLocator,
  readCreatorMark,
  type CreatorMark,
} from '@/lib/entry-links';
import ScholarShell, {
  ArchiveSearch,
  EntryNavigation,
  EntryState,
  IndexEntry,
} from './scholar/shell';
import ItemRecord from './scholar/item-record';
type Navigation = {
  position?: ReaderPosition;
  itemId?: number;
  itemKey?: string;
  category?: string;
  scroll?: boolean;
  history?: 'push' | 'replace' | 'none';
  linked?: boolean;
};
const RARITIES = manifest.chapters.map((c) => c.name);
const LORE_PREFERENCE_KEY = 'hs-codex-show-lore-v1';
const initialPosition: ReaderPosition = {
  rarity: 'Angelic',
  filters: EMPTY_FILTERS,
  cursor: 0,
};
export default function Catalog({
  initialItems,
  initialLink = false,
}: {
  initialItems: Item[];
  initialLink?: boolean;
}) {
  const [view, setView] = useState<ReaderPosition>(initialPosition);
  const [statHelpHandle] = useState(createStatHelpHandle);
  const [items, setItems] = useState(initialItems);
  const [showLore, setShowLore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<IndexItem[]>([]);
  const [searchError, setSearchError] = useState(false);
  const [drawer, setDrawer] = useState<
    'contents' | 'bookmarks' | 'discover' | null
  >(null);
  const [discoveryId, setDiscoveryId] = useState<number | null>(null);
  const [openingLink, setOpeningLink] = useState(initialLink);
  const [linkError, setLinkError] = useState('');
  const [bookmarks, setBookmarks] = useState<SavedItem[]>([]);
  const [creatorMark, setCreatorMark] = useState<CreatorMark | null>(null);
  const [markedEntry, setMarkedEntry] = useState<IndexItem | null>(null);
  const [readerReady, setReaderReady] = useState(false);
  const [sessionOnly, setSessionOnly] = useState(false);
  const [notice, setNotice] = useState('');
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [indexPage, setIndexPage] = useState<number | null>(null);
  const cache = useRef(new Map<string, Item[]>([['Angelic', initialItems]]));
  const inflight = useRef(new Map<string, Promise<Item[]>>());
  const requestId = useRef(0);
  const lastNavigation = useRef<{ rarity: string; options: Navigation }>({
    rarity: 'Angelic',
    options: {},
  });
  const searchRequest = useRef<Promise<IndexItem[]> | null>(null);
  const indexCache = useRef<IndexItem[]>([]);
  const linkRequest = useRef(0);
  const rarity = view.rarity;
  const filtered = useMemo(
    () => applyFilters(items, view.filters),
    [items, view.filters],
  );
  const pagination = pageItems(filtered, view.cursor, 1);
  const visible = pagination.items;
  const savedIds = useMemo(
    () => new Set(bookmarks.map((s) => s.id)),
    [bookmarks],
  );
  const activeFilters = filterCount(view.filters);
  const categories = Object.keys(
    manifest.chapters.find((c) => c.name === rarity)!.categories,
  ).sort();
  const searchResults = useMemo(() => {
    const term = normalizeSearch(query.trim());
    return term
      ? index.filter((item) =>
          normalizeSearch(`${item.name} ${item.type}`).includes(term),
        )
      : [];
  }, [index, query]);

  const getChapter = useCallback(async (name: string): Promise<Item[]> => {
    const cached = cache.current.get(name);
    if (cached) {
      cache.current.delete(name);
      cache.current.set(name, cached);
      return cached;
    }
    const pending = inflight.current.get(name);
    if (pending) return pending;
    const source = manifest.chapters.find((c) => c.name === name);
    if (!source) throw new Error('This chapter is unavailable.');
    const request = (async () => {
      const response = await fetch(source.path);
      if (!response.ok) throw new Error('The chapter could not be loaded.');
      const data: unknown = await response.json();
      if (!validateChapter(data))
        throw new Error('The chapter data could not be read.');
      cache.current.set(name, data);
      while (cache.current.size > 3) {
        const oldest = cache.current.keys().next().value;
        if (oldest) cache.current.delete(oldest);
        else break;
      }
      return data;
    })();
    inflight.current.set(name, request);
    try {
      return await request;
    } finally {
      inflight.current.delete(name);
    }
  }, []);
  const getIndex = useCallback(async (): Promise<IndexItem[]> => {
    if (indexCache.current.length) return indexCache.current;
    if (searchRequest.current) return searchRequest.current;
    setSearchError(false);
    const request = fetch(manifest.index).then(async (response) => {
      if (!response.ok)
        throw new Error('The discovery index could not be loaded.');
      const rows: IndexItem[] = await response.json();
      if (
        !Array.isArray(rows) ||
        !rows.length ||
        rows.some(
          (row) => !Number.isInteger(row.id) || typeof row.key !== 'string',
        )
      )
        throw new Error('The discovery index could not be read.');
      indexCache.current = rows;
      setIndex(rows);
      return rows;
    });
    searchRequest.current = request;
    try {
      return await request;
    } catch (cause) {
      setSearchError(true);
      throw cause;
    } finally {
      searchRequest.current = null;
    }
  }, []);
  const navigate = useCallback(
    async (name: string, options: Navigation = {}) => {
      if (!RARITIES.includes(name)) return;
      const revision = ++requestId.current;
      if (!options.linked) {
        linkRequest.current++;
        setOpeningLink(false);
        setLinkError('');
      }
      lastNavigation.current = { rarity: name, options };
      setLoading(true);
      setError('');
      try {
        const records = await getChapter(name);
        if (revision !== requestId.current) return;
        let filters = options.position?.filters ?? {
          ...EMPTY_FILTERS,
          category: options.category ?? 'All categories',
        };
        let cursor = options.position?.cursor ?? 0;
        let focus: number | null = null;
        if (options.itemId !== undefined) {
          const found = records.find(
            (r) =>
              r.id === options.itemId &&
              (!options.itemKey || r.key === options.itemKey),
          );
          if (!found)
            throw new Error(
              'This entry is no longer available in the current catalog.',
            );
          filters = EMPTY_FILTERS;
          cursor = records.indexOf(found);
          focus = found.id;
        }
        const matches = applyFilters(records, filters);
        cursor = Math.max(0, Math.min(cursor, matches.length - 1));
        setItems(records);
        setView({ rarity: name, filters, cursor });
        setFocusedId(focus);
        setDrawer(null);
        setOpeningLink(false);
        setReaderReady(true);
        const target = matches[cursor];
        const mode = options.history ?? 'push';
        if (target && mode !== 'none') {
          const href = entryHref(target, window.location.href);
          if (mode === 'push' && href !== window.location.href)
            window.history.pushState(window.history.state, '', href);
          else window.history.replaceState(window.history.state, '', href);
        }
      } catch (cause) {
        if (revision === requestId.current) {
          if (options.linked) {
            setLinkError(
              cause instanceof Error
                ? cause.message
                : 'The entry could not be opened.',
            );
            setOpeningLink(true);
          } else
            setError(
              cause instanceof Error
                ? cause.message
                : 'The chapter could not be loaded.',
            );
        }
      } finally {
        if (revision === requestId.current) setLoading(false);
      }
    },
    [getChapter],
  );
  const resolveEntryLink = useCallback(async () => {
    const revision = ++linkRequest.current;
    requestId.current++;
    setOpeningLink(true);
    setLinkError('');
    setError('');
    setDrawer(null);
    setCreatorMark(null);
    setMarkedEntry(null);
    try {
      const locator = readEntryLocator(window.location.search);
      let mark: CreatorMark | null = null;
      try {
        mark = readCreatorMark(window.location.search);
      } catch {
        setNotice(
          'This creator bookmark is unavailable. You can still browse the archive.',
        );
      }
      if (!locator) {
        await navigate('Angelic', { history: 'none', linked: true });
        return;
      }
      const rows = await getIndex();
      if (revision !== linkRequest.current) return;
      if (mark) {
        const anchor = findLinkedEntry(rows, mark.entry);
        if (anchor) {
          setCreatorMark(mark);
          setMarkedEntry(anchor);
        } else {
          setNotice('The marked entry is no longer available.');
          const clean = new URL(window.location.href);
          for (const key of ['creator', 'mark', 'markVariant'])
            clean.searchParams.delete(key);
          window.history.replaceState(window.history.state, '', clean.href);
        }
      }
      const found = findLinkedEntry(rows, locator);
      if (!found)
        throw new Error('This entry link does not match the current catalog.');
      await navigate(found.rarity, {
        itemId: found.id,
        itemKey: found.key,
        history: 'none',
        linked: true,
      });
    } catch (cause) {
      if (revision === linkRequest.current) {
        setLinkError(
          cause instanceof Error
            ? cause.message
            : 'The entry could not be opened.',
        );
        setLoading(false);
      }
    } finally {
      if (revision === linkRequest.current) setReaderReady(true);
    }
  }, [getIndex, navigate]);
  function updateFilters(patch: Partial<CatalogFilters>) {
    setView((v) => ({ ...v, filters: { ...v.filters, ...patch }, cursor: 0 }));
    setFocusedId(null);
  }
  function loadIndex() {
    void getIndex().catch(() => {});
  }
  function openDiscovery() {
    setDiscoveryId(
      visible.find((item) => item.id === focusedId)?.id ??
        visible[0]?.id ??
        null,
    );
    setDrawer('discover');
    loadIndex();
  }
  function toggleBookmark(item: Item) {
    const removing = savedIds.has(item.id);
    setBookmarks((current) => toggleSaved(current, item));
    setNotice(
      `${item.name} ${removing ? 'removed from bookmarks.' : 'bookmarked.'}`,
    );
  }
  function placeCreatorBookmark(item: Item) {
    const mark: CreatorMark = {
      creatorId: 'graxy_tv',
      entry: { key: item.key, variant: item.variant },
    };
    setCreatorMark(mark);
    setMarkedEntry(item);
    setFocusedId(item.id);
    setView((v) => ({
      ...v,
      cursor: filtered.findIndex((entry) => entry.id === item.id),
    }));
    window.history.pushState(
      window.history.state,
      '',
      entryHref(item, window.location.href, mark),
    );
    setDrawer(null);
    setNotice(
      `${CREATORS[mark.creatorId].name}'s bookmark placed on ${item.name}.`,
    );
  }
  function returnToCreatorBookmark() {
    if (markedEntry)
      void navigate(markedEntry.rarity, {
        itemId: markedEntry.id,
        itemKey: markedEntry.key,
        scroll: true,
      });
  }
  function removeCreatorBookmark() {
    setCreatorMark(null);
    setMarkedEntry(null);
    const current = readEntryLocator(window.location.search) ?? visible[0];
    if (current)
      window.history.pushState(
        window.history.state,
        '',
        entryHref(current, window.location.href, null),
      );
    setNotice('Creator bookmark removed.');
  }
  useEffect(() => {
    let active = true;
    let position: ReaderPosition | null = null;
    try {
      // Browser storage is an external source unavailable during server render.
      // oxlint-disable-next-line react/react-compiler
      setBookmarks(parseBookmarks(localStorage.getItem(BOOKMARK_KEY)));
      // oxlint-disable-next-line react/react-compiler
      setShowLore(localStorage.getItem(LORE_PREFERENCE_KEY) !== 'hidden');
      position = parsePosition(
        localStorage.getItem(POSITION_KEY),
        RARITIES,
        manifest.categories,
      );
    } catch {
      setSessionOnly(true);
    }
    if (
      new URLSearchParams(window.location.search).has('item') ||
      new URLSearchParams(window.location.search).has('variant') ||
      new URLSearchParams(window.location.search).has('creator') ||
      new URLSearchParams(window.location.search).has('mark')
    ) {
      void resolveEntryLink();
    } else if (position)
      void navigate(position.rarity, {
        position,
        scroll: false,
        history: 'replace',
      }).finally(() => {
        if (active) setReaderReady(true);
      });
    else setReaderReady(true);
    return () => {
      active = false;
    };
  }, [navigate, resolveEntryLink]);
  useEffect(() => {
    const restore = () => {
      void resolveEntryLink();
    };
    window.addEventListener('popstate', restore);
    return () => {
      window.removeEventListener('popstate', restore);
      // This is a request-generation counter, not a mounted DOM ref.
      // oxlint-disable-next-line react-hooks/exhaustive-deps
      linkRequest.current++;
    };
  }, [resolveEntryLink]);
  useEffect(() => {
    if (!readerReady) return;
    try {
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
    } catch {
      // Report an external storage failure once; do not retry writes in a loop.
      // oxlint-disable-next-line react/react-compiler
      setSessionOnly(true);
    }
  }, [bookmarks, readerReady]);
  useEffect(() => {
    if (!readerReady || loading || openingLink) return;
    const position = {
      ...view,
      cursor: Math.max(0, Math.min(view.cursor, filtered.length - 1)),
    };
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    } catch {
      // oxlint-disable-next-line react/react-compiler
      setSessionOnly(true);
    }
    const target = filtered[position.cursor];
    if (target) {
      const href = entryHref(target, window.location.href);
      if (href !== window.location.href)
        window.history.replaceState(window.history.state, '', href);
    }
  }, [view, readerReady, loading, openingLink, filtered]);

  function chooseEntry(item: IndexItem) {
    setQuery('');
    setIndexPage(null);
    void navigate(item.rarity, { itemId: item.id, itemKey: item.key });
  }
  function chooseFromIndex(item: IndexItem) {
    if (query.trim()) {
      chooseEntry(item);
      return;
    }
    if (loading || openingLink) return;
    const cursor = filtered.findIndex((entry) => entry.id === item.id);
    if (cursor < 0) return;
    setView((current) => ({ ...current, cursor }));
    setFocusedId(item.id);
    setIndexPage(null);
    const href = entryHref(item, window.location.href);
    if (href !== window.location.href)
      window.history.pushState(window.history.state, '', href);
  }
  const indexedItems = query.trim() ? searchResults : filtered;
  const maxIndexPage = Math.max(0, Math.ceil(indexedItems.length / 40) - 1);
  const currentIndexPage = Math.min(
    indexPage ?? (query ? 0 : Math.floor(pagination.page / 40)),
    maxIndexPage,
  );
  const indexItems = indexedItems.slice(
    currentIndexPage * 40,
    (currentIndexPage + 1) * 40,
  );
  function turn(delta: number) {
    if (loading || openingLink) return;
    const cursor = pagination.page + delta;
    if (cursor >= 0 && cursor < filtered.length) {
      setView((v) => ({ ...v, cursor }));
      setIndexPage(null);
    }
  }
  useEffect(
    () => () => {
      requestId.current++;
      linkRequest.current++;
    },
    [],
  );
  return (
    <ScholarShell
      active="items"
      resetKey={visible[0]?.id}
      title="Item Archive"
      count="1,990 equipment records"
      browse={{ label: 'items', count: indexedItems.length }}
      tools={
        <Button
          className="scholar-saved-control"
          aria-label={`Saved entries (${bookmarks.length})`}
          variant="outline"
          onClick={() => setDrawer('bookmarks')}
        >
          <Bookmark size={17} />
          <span>Saved</span>
          <small>{bookmarks.length}</small>
        </Button>
      }
      index={
        <>
          <ArchiveSearch
            value={query}
            onChange={(v) => {
              setQuery(v);
              setIndexPage(null);
              if (v.trim()) loadIndex();
            }}
            label="Search all items"
          />
          {!query.trim() && (
            <>
              <label>
                Rarity
                <select
                  value={rarity}
                  onChange={(e) => {
                    setIndexPage(null);
                    void navigate(e.target.value);
                  }}
                >
                  {manifest.chapters.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} · {c.count}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Category
                <select
                  value={view.filters.category}
                  onChange={(e) => {
                    updateFilters({ category: e.target.value });
                    setIndexPage(null);
                  }}
                >
                  <option>All categories</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <details>
                <summary>
                  More filters {activeFilters ? `(${activeFilters})` : ''}
                </summary>
                <label>
                  Combat focus
                  <select
                    value={view.filters.focus}
                    onChange={(e) => {
                      updateFilters({ focus: e.target.value });
                      setIndexPage(null);
                    }}
                  >
                    <option>Any focus</option>
                    {FOCUS_OPTIONS.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Special effect
                  <select
                    value={view.filters.effect}
                    onChange={(e) => {
                      updateFilters({ effect: e.target.value });
                      setIndexPage(null);
                    }}
                  >
                    <option>Any effect</option>
                    {EFFECT_OPTIONS.map((e) => (
                      <option key={e.value} value={e.value}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label
                  className="scholar-checkbox"
                  htmlFor="filter-original-lore"
                >
                  <Checkbox
                    id="filter-original-lore"
                    checked={view.filters.loreOnly}
                    onCheckedChange={(checked) => {
                      updateFilters({ loreOnly: checked === true });
                      setIndexPage(null);
                    }}
                  />
                  Has original lore
                </label>
                {activeFilters > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateFilters(EMPTY_FILTERS);
                      setIndexPage(null);
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </details>
            </>
          )}
          <p className="scholar-eyebrow scholar-index-subtitle">
            {indexedItems.length} {query ? 'search results' : 'entries'}
          </p>
          {query && searchError ? (
            <div>
              <p>Search is unavailable.</p>
              <Button variant="outline" onClick={loadIndex}>
                Try again
              </Button>
            </div>
          ) : (
            indexItems.map((item) => (
              <IndexEntry
                key={item.id}
                active={visible[0]?.id === item.id && !openingLink}
                image={
                  item.rarity === 'Runeword'
                    ? '/emblems/runeword-seal.webp'
                    : (item.image ?? null)
                }
                rarity={item.rarity}
                onClick={() => chooseFromIndex(item)}
              >
                <span>
                  {item.name}
                  <small>
                    {query ? `${item.rarity} · ` : ''}
                    {item.type}
                    {item.variant !== null ? ` · Variant ${item.variant}` : ''}
                  </small>
                </span>
              </IndexEntry>
            ))
          )}
          {!indexedItems.length && !searchError && (
            <p>No items match this selection.</p>
          )}
          {maxIndexPage > 0 && (
            <nav className="scholar-index-pagination" aria-label="Index pages">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndexPage === 0}
                onClick={() => setIndexPage(currentIndexPage - 1)}
              >
                Previous
              </Button>
              <span>
                {currentIndexPage + 1} / {maxIndexPage + 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndexPage === maxIndexPage}
                onClick={() => setIndexPage(currentIndexPage + 1)}
              >
                Next
              </Button>
            </nav>
          )}
        </>
      }
    >
      <StatGlossary
        handle={statHelpHandle}
        resetKey={`${visible[0]?.id}:${loading}:${drawer}:${showLore}`}
      />
      {creatorMark && markedEntry && (
        <div className="scholar-creator">
          <Bookmark size={20} />
          <button onClick={returnToCreatorBookmark}>
            <strong>{CREATORS[creatorMark.creatorId].name}</strong>
            <span>
              {visible[0]?.id === markedEntry.id
                ? 'Marked entry'
                : `Return to ${markedEntry.name}`}
            </span>
          </button>
          <a
            href={CREATORS[creatorMark.creatorId].channel}
            target="_blank"
            rel="noopener noreferrer"
          >
            Twitch
          </a>
          <a
            href={CREATORS[creatorMark.creatorId].discord}
            target="_blank"
            rel="noopener noreferrer"
          >
            Discord
          </a>
        </div>
      )}

      {openingLink || loading || error ? (
        <EntryState
          title={
            linkError || error ? 'Entry unavailable' : 'Opening your entry…'
          }
        >
          <p>{linkError || error || 'Finding its place in the archive.'}</p>
          {(linkError || error) && (
            <>
              <Button
                onClick={() =>
                  linkError
                    ? void resolveEntryLink()
                    : void navigate(
                        lastNavigation.current.rarity,
                        lastNavigation.current.options,
                      )
                }
              >
                Try again
              </Button>
              <Button variant="ghost" onClick={() => void navigate('Angelic')}>
                Open Angelic items
              </Button>
            </>
          )}
        </EntryState>
      ) : visible[0] ? (
        <>
          <ItemRecord
            item={visible[0]}
            saved={savedIds.has(visible[0].id)}
            showLore={showLore}
            onBookmark={toggleBookmark}
            onDiscover={openDiscovery}
            statHelpHandle={statHelpHandle}
            mark={creatorMark}
            tools={
              <div className="scholar-reading-tools">
                {visible[0].lore?.kind === 'Lore' &&
                  !!visible[0].lore.text.trim() && (
                    <label
                      className="scholar-checkbox"
                      htmlFor="show-original-lore"
                    >
                      <Checkbox
                        id="show-original-lore"
                        checked={showLore}
                        onCheckedChange={(checked) => {
                          const show = checked === true;
                          setShowLore(show);
                          try {
                            localStorage.setItem(
                              LORE_PREFERENCE_KEY,
                              show ? 'visible' : 'hidden',
                            );
                          } catch {
                            setSessionOnly(true);
                          }
                        }}
                      />
                      Show lore
                    </label>
                  )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDrawer('bookmarks')}
                >
                  Creator bookmark
                </Button>
              </div>
            }
          />
          <EntryNavigation
            previous={filtered[pagination.page - 1]?.name}
            next={filtered[pagination.page + 1]?.name}
            onPrevious={() => turn(-1)}
            onNext={() => turn(1)}
            position={`${pagination.page + 1} / ${filtered.length}`}
          />
        </>
      ) : (
        <EntryState title="No matching items">
          <p>Try another category or clear the filters.</p>
          <Button onClick={() => updateFilters(EMPTY_FILTERS)}>
            Clear filters
          </Button>
        </EntryState>
      )}
      <output className="sr-only">{notice}</output>
      <Sheet
        open={drawer !== null}
        onOpenChange={(open) => {
          if (!open) setDrawer(null);
        }}
      >
        <SheetContent className="scholar-sheet" side="right">
          <SheetHeader>
            <SheetTitle>
              {drawer === 'discover' ? 'Discover this entry' : 'Saved entries'}
            </SheetTitle>
            <SheetDescription>
              {drawer === 'discover'
                ? 'Related records, set bonuses and acquisition details.'
                : 'Your personal bookmarks and creator bookmark.'}
            </SheetDescription>
          </SheetHeader>
          <div className="scholar-sheet-body">
            {drawer === 'discover' ? (
              <DiscoverPanel
                items={openingLink ? [] : visible}
                selectedId={discoveryId}
                select={setDiscoveryId}
                index={index}
                failed={searchError}
                retry={loadIndex}
                onChoose={chooseEntry}
              />
            ) : (
              <>
                <CreatorBookmarkPanel
                  items={openingLink || loading ? [] : visible}
                  focusedId={focusedId}
                  mark={creatorMark}
                  markedEntry={markedEntry}
                  onPlace={placeCreatorBookmark}
                  onReturn={returnToCreatorBookmark}
                  onRemove={removeCreatorBookmark}
                />
                <h3>Personal bookmarks</h3>
                <p className="scholar-caption">
                  {sessionOnly
                    ? 'Saved for this session. Device storage is unavailable.'
                    : 'Saved on this device.'}
                </p>
                {bookmarks.length ? (
                  bookmarks.map((saved) => (
                    <div key={saved.id} className="scholar-bookmark-row">
                      <button
                        onClick={() =>
                          void navigate(saved.rarity, {
                            itemId: saved.id,
                            itemKey: saved.key,
                          })
                        }
                      >
                        <strong>{saved.name}</strong>
                        <small>
                          {saved.rarity} · {saved.type}
                        </small>
                      </button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Remove bookmark for ${saved.name}`}
                        onClick={() =>
                          setBookmarks((current) =>
                            current.filter((s) => s.id !== saved.id),
                          )
                        }
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p>
                    No saved entries yet. Use Save entry beside an item’s title.
                  </p>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </ScholarShell>
  );
}
