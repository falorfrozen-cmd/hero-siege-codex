'use client';
import { useState } from 'react';
import Image from 'next/image';
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Copy,
  MessagesSquare,
  TvMinimalPlay,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CREATORS, type CreatorId } from '@/lib/creators';
import { sharedEntryHref as entryHref } from '@desktop/links';
import { type CreatorMark } from '@/lib/entry-links';
import type { IndexItem, Item } from '@/lib/catalog';

function RibbonArtwork({ creatorId }: { creatorId: CreatorId }) {
  const creator = CREATORS[creatorId];
  return (
    <>
      <Image
        unoptimized
        src={creator.artwork}
        alt=""
        width={136}
        height={876}
      />
      <span className="creator-ribbon-name">{creator.name}</span>
    </>
  );
}

function CreatorSocialLinks({
  creatorId,
  compact = false,
}: {
  creatorId: CreatorId;
  compact?: boolean;
}) {
  const creator = CREATORS[creatorId];
  const links = [
    { name: 'Twitch', href: creator.channel, Icon: TvMinimalPlay },
    ...(creator.discord
      ? [{ name: 'Discord', href: creator.discord, Icon: MessagesSquare }]
      : []),
  ];
  return (
    <nav
      className={compact ? 'creator-ribbon-links' : 'creator-social-links'}
      aria-label={`${creator.name} community links`}
    >
      {links.map(({ name, href, Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${creator.name} on ${name} (opens in a new tab)`}
          title={`${creator.name} · ${name}`}
        >
          <Icon size={20} aria-hidden="true" />
          {!compact ? <span>{name}</span> : null}
        </a>
      ))}
    </nav>
  );
}

export function CreatorRibbon({
  mark,
  onOpen,
  placed,
}: {
  mark: CreatorMark;
  onOpen: () => void;
  placed: boolean;
}) {
  return (
    <div className="creator-ribbon">
      <button
        className="creator-ribbon-open"
        onClick={onOpen}
        aria-label={`${CREATORS[mark.creatorId].name} bookmark${placed ? ' on this page' : ': return to marked entry'}`}
        title={`${CREATORS[mark.creatorId].name} · ${placed ? 'Bookmarked entry' : 'Return to marked entry'}`}
      >
        <RibbonArtwork creatorId={mark.creatorId} />
        <span className="creator-clasp" aria-hidden="true">
          <Image
            unoptimized
            src="/frames/archive-frame.webp"
            alt=""
            width={1000}
            height={249}
          />
          <span className="creator-clasp-monogram">
            {CREATORS[mark.creatorId].name.charAt(0)}
          </span>
          <span className="creator-clasp-name">
            {CREATORS[mark.creatorId].name}
          </span>
        </span>
      </button>
      <CreatorSocialLinks creatorId={mark.creatorId} compact />
    </div>
  );
}

function ShareBookmark({ mark }: { mark: CreatorMark }) {
  const [href, setHref] = useState('');
  const [copied, setCopied] = useState(false);
  return (
    <div className="creator-share">
      <Button
        variant="outline"
        onClick={async () => {
          const link = entryHref(mark.entry, window.location.href, mark);
          setHref(link);
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Link copied' : 'Copy bookmarked link'}
      </Button>
      <output className="sr-only" aria-live="polite">
        {copied ? 'Bookmarked entry link copied.' : ''}
      </output>
      {href ? (
        <label className="manual-entry-link" htmlFor="creator-entry-link">
          Entry and creator bookmark
          <Input
            id="creator-entry-link"
            readOnly
            value={href}
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      ) : null}
      <p className="creator-access-note">
        Sharing a link does not change who can access the codex.
      </p>
    </div>
  );
}

export function CreatorBookmarkPanel({
  items,
  focusedId,
  mark,
  markedEntry,
  onPlace,
  onReturn,
  onRemove,
}: {
  items: Item[];
  focusedId: number | null;
  mark: CreatorMark | null;
  markedEntry: IndexItem | null;
  onPlace: (item: Item) => void;
  onReturn: () => void;
  onRemove: () => void;
}) {
  const [selectedId, setSelectedId] = useState(focusedId ?? items[0]?.id);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const creator = CREATORS.graxy_tv;
  const alreadyHere = !!selected && selected.id === markedEntry?.id;
  return (
    <section className="creator-bookmark-panel" aria-label="Creator bookmark">
      <div className="creator-profile">
        <div className="creator-preview" aria-hidden="true">
          <RibbonArtwork creatorId="graxy_tv" />
        </div>
        <div>
          <span className="small-label">CREATOR BOOKMARK</span>
          <h3>{creator.name}</h3>
          <p>Mark an entry. Share your place in the archive.</p>
          <CreatorSocialLinks creatorId="graxy_tv" />
        </div>
      </div>
      {items.length > 1 ? (
        <div className="discovery-selection" aria-label="Entry to bookmark">
          {items.map((item) => (
            <button
              key={item.id}
              aria-pressed={selected?.id === item.id}
              onClick={() => setSelectedId(item.id)}
            >
              {item.name}
              {item.variant !== null ? (
                <small>Base variant {item.variant}</small>
              ) : null}
            </button>
          ))}
        </div>
      ) : selected ? (
        <p className="creator-current-entry">
          {selected.name}
          {selected.variant !== null ? (
            <small>Base variant {selected.variant}</small>
          ) : null}
        </p>
      ) : null}
      {selected ? (
        <Button
          className="place-creator-bookmark"
          variant="outline"
          disabled={alreadyHere}
          onClick={() => onPlace(selected)}
        >
          {alreadyHere ? <Check size={16} /> : <Bookmark size={16} />}
          {alreadyHere
            ? 'Bookmark placed here'
            : mark
              ? 'Move bookmark here'
              : 'Place bookmark here'}
        </Button>
      ) : (
        <p>Open an entry to place this bookmark.</p>
      )}
      {mark && markedEntry ? (
        <div className="creator-marked-entry">
          <span className="small-label">MARKED ENTRY</span>
          <button className="creator-return" onClick={onReturn}>
            <span>
              {markedEntry.name}
              {markedEntry.variant !== null ? (
                <small>Base variant {markedEntry.variant}</small>
              ) : null}
            </span>
            <ArrowUpRight size={15} />
          </button>
          <ShareBookmark
            key={`${mark.creatorId}:${mark.entry.key}:${mark.entry.variant}`}
            mark={mark}
          />
          <button className="remove-creator-bookmark" onClick={onRemove}>
            Remove creator bookmark
          </button>
        </div>
      ) : null}
    </section>
  );
}
