'use client';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Bookmark, Compass, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Item } from '@/lib/catalog';
import { entryHref, type CreatorMark } from '@/lib/entry-links';
import { StatLabel, type StatHelpHandle } from '../stat-glossary';
import { CopyEntry } from './shell';
import EntryContents from './entry-contents';

export default function ItemRecord({
  item,
  saved,
  showLore,
  onBookmark,
  onDiscover,
  statHelpHandle,
  mark,
  tools,
}: {
  item: Item;
  saved: boolean;
  showLore: boolean;
  onBookmark: (item: Item) => void;
  onDiscover: () => void;
  statHelpHandle: StatHelpHandle;
  mark: CreatorMark | null;
  tools?: ReactNode;
}) {
  const src =
    item.rarity === 'Runeword' ? '/emblems/runeword-seal.webp' : item.image;
  return (
    <article
      className="scholar-item-record"
      data-rarity={item.rarity.toLowerCase()}
      data-item-id={item.id}
    >
      <EntryContents entryKey={`${item.id}:${showLore}`} />
      <p className="scholar-breadcrumb">
        <span>Items</span>
        <span>{item.rarity}</span>
        <span>{item.type}</span>
      </p>
      <div className="scholar-item-hero">
        <figure className="scholar-item-art">
          {src ? (
            <Image
              unoptimized
              src={src}
              width={180}
              height={180}
              alt={item.name}
              priority
            />
          ) : (
            <Shield size={60} strokeWidth={1} />
          )}
        </figure>
        <div>
          <div className="scholar-item-kicker">
            <span className="scholar-rarity">{item.rarity}</span>
            {tools}
          </div>
          <h1>{item.name}</h1>
          <div className="scholar-meta">
            <span>{item.type}</span>
            {item.tier && <span>Tier {item.tier}</span>}
            {item.level !== null && <span>Level {item.level}</span>}
            {item.variant !== null && <span>Base variant {item.variant}</span>}
          </div>
          <div className="scholar-item-actions">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBookmark(item)}
              aria-label={`${saved ? 'Remove bookmark for' : 'Bookmark'} ${item.name}`}
              aria-pressed={saved}
            >
              <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
              {saved ? 'Saved' : 'Save'}
            </Button>
            <CopyEntry
              key={`${item.id}:${mark?.entry.key}`}
              name={item.name}
              href={entryHref(item, 'https://local.invalid/', mark).replace(
                'https://local.invalid',
                '',
              )}
            />
            <Button size="sm" variant="outline" onClick={onDiscover}>
              <Compass size={16} />
              Discover
            </Button>
          </div>
        </div>
      </div>
      <p className="scholar-item-summary">{item.summary}</p>
      {!!item.tags.length && (
        <ul className="scholar-chips">
          {item.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}
      {item.set && (
        <button className="scholar-set" onClick={onDiscover}>
          <Shield size={20} />
          <span>
            {item.set}
            <small>
              {item.setRecord?.pieces.length ?? 0} recorded pieces · View set
            </small>
          </span>
        </button>
      )}
      <section
        className="scholar-section"
        aria-label={`All recorded properties of ${item.name}`}
      >
        <h2>
          Recorded properties <small>{item.stats.length}</small>
        </h2>
        {item.stats.length ? (
          <dl className="scholar-properties">
            {item.stats.map((s, i) => (
              <div key={`${s.label}-${i}`}>
                <dt>
                  <StatLabel stat={s} handle={statHelpHandle} />
                </dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>No fixed numeric properties are recorded for this entry.</p>
        )}
      </section>
      {!!item.effects.length && (
        <section
          className="scholar-section"
          aria-label={`Special effects of ${item.name}`}
        >
          <h2>
            Special effects <small>{item.effects.length}</small>
          </h2>
          <ul className="scholar-effects">
            {item.effects.map((e, i) => (
              <li key={i}>{e.text}</li>
            ))}
          </ul>
        </section>
      )}
      {item.lore && (showLore || item.lore.kind !== 'Lore') && (
        <section className="scholar-section scholar-lore">
          <h2>{item.lore.kind}</h2>
          <blockquote>{item.lore.text}</blockquote>
        </section>
      )}
      <section className="scholar-section">
        <h2>Obtained from</h2>
        {item.acquisition.length ? (
          item.acquisition.map((a, i) => (
            <div key={i}>
              <h3>{a.label}</h3>
              <p>{a.detail}</p>
            </div>
          ))
        ) : (
          <p className="scholar-caption">Not yet verified</p>
        )}
      </section>
      <p className="scholar-caption">
        {item.stats.length
          ? 'Recorded values and ranges; actual rolls may vary.'
          : item.kind === 'normal'
            ? 'Additional properties may be rolled in game.'
            : 'No fixed combat values in this catalog snapshot.'}
        {item.unresolvedStats
          ? ` ${item.unresolvedStats} unresolved internal fields omitted.`
          : ''}
      </p>
    </article>
  );
}
