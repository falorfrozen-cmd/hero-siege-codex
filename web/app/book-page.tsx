'use client';
import { useState } from 'react';
import Image from 'next/image';
import {
  Bookmark,
  Check,
  Feather,
  Flame,
  Gem,
  Shield,
  Skull,
  Sun,
  Swords,
  WandSparkles,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import type { Item } from '@/lib/catalog';
import { pageDensity } from '@/lib/page-density';
import { useEntryFit } from './use-entry-fit';
import {
  StatLabel,
  hasStatDescription,
  type StatHelpHandle,
} from './stat-glossary';

const SIGILS = {
  Angelic: Sun,
  Unholy: Skull,
  Heroic: Shield,
  Satanic: Flame,
  Runeword: WandSparkles,
  Normal: Swords,
};
export function ChapterSigil({
  rarity,
  size = 22,
}: {
  rarity: string;
  size?: number;
}) {
  const Icon = SIGILS[rarity as keyof typeof SIGILS] ?? Gem;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}
function ItemImage({
  item,
  priority = false,
}: {
  item: Item;
  priority?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const runeword = item.rarity === 'Runeword';
  const source = runeword ? '/emblems/runeword-seal.webp' : item.image;
  return !source || broken ? (
    <div className="item-image-fallback">
      <Shield size={42} />
      <span>Unillustrated</span>
    </div>
  ) : (
    <Image
      unoptimized
      src={source}
      alt={runeword ? `${item.name} — shared Runeword emblem` : item.name}
      width={runeword ? 256 : 110}
      height={runeword ? 256 : 140}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      onError={() => setBroken(true)}
      className="item-sprite"
    />
  );
}
export default function BookPage({
  item,
  rarity,
  category,
  folio,
  side = 0,
  hasEntries,
  saved = false,
  onBookmark,
  priority = false,
  focused = false,
  onDiscover,
  showLore = true,
  statHelpHandle,
}: {
  item?: Item;
  rarity: string;
  category: string;
  folio: number;
  side?: number;
  hasEntries: boolean;
  saved?: boolean;
  onBookmark: (item: Item) => void;
  priority?: boolean;
  focused?: boolean;
  onDiscover: (item: Item) => void;
  showLore?: boolean;
  statHelpHandle: StatHelpHandle;
}) {
  const sacred = rarity === 'Angelic' || rarity === 'Unholy';
  const dense = !!item && item.stats.length + item.effects.length > 12;
  const density = pageDensity(item, showLore);
  const { windowRef, entryRef } = useEntryFit(
    `${item?.id}:${showLore}:${saved}:${side}`,
  );
  return (
    <div
      className={`book-page ${side === 1 ? 'page-right' : ''} ${sacred ? 'illuminated-page' : ''} ${dense ? 'dense-page' : ''} density-${density}`}
    >
      <div className="page-running-head">
        <span>{rarity}</span>
        <ChapterSigil rarity={rarity} size={18} />
        <span>
          {category === 'All categories' ? 'The collection' : category}
        </span>
      </div>
      <div className="entry-window" ref={windowRef}>
        {item ? (
          <article
            ref={entryRef}
            className={`book-entry ${sacred ? 'illuminated' : ''} ${focused ? 'entry-focused' : ''}`}
            data-item-id={item.id}
          >
            <div className="item-identity">
              <span>
                {item.type}
                {item.tier ? ` · Tier ${item.tier}` : ''}
                {item.level ? ` · Level ${item.level}` : ''}
              </span>
              <button
                className={`bookmark-ribbon ${saved ? 'is-saved' : ''}`}
                aria-label={`${saved ? 'Remove bookmark for' : 'Bookmark'} ${item.name}`}
                aria-pressed={saved}
                onClick={() => onBookmark(item)}
              >
                <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="entry-main relic-nameplate engraved-nameplate">
              <div className="item-portrait" data-category={item.category}>
                <ItemImage key={item.id} item={item} priority={priority} />
                <span className="medallion-seal" aria-hidden="true">
                  <ChapterSigil rarity={item.rarity} size={15} />
                </span>
              </div>
              <div className="entry-copy">
                <h2>{item.name}</h2>
              </div>
            </div>
            <div className="entry-affiliation">
              <div className="item-tags">
                <ChapterSigil rarity={rarity} size={13} />
                {item.tags.join(' · ')}
              </div>
              {item.kind === 'normal' ? (
                <span className="entry-variant">
                  Base variant {item.variant}
                </span>
              ) : null}
              {item.set && item.setRecord ? (
                <button
                  className="set-name set-link"
                  onClick={() => onDiscover(item)}
                  aria-label={`Explore ${item.set} set`}
                >
                  <span className="set-seal" aria-hidden="true">
                    {item.setRecord.seal}
                    <small>{item.setRecord.id}</small>
                  </span>
                  <span>
                    {item.set}
                    <small>
                      {item.setRecord.pieces.length} recorded pieces
                    </small>
                  </span>
                  <ChevronRight size={14} />
                </button>
              ) : null}
            </div>
            <p className="curator-note">{item.summary}</p>
            <section
              className="entry-properties"
              aria-label={`All recorded properties of ${item.name}`}
            >
              <h3 className="ruled-heading">
                <span>Recorded properties</span>
                <small>{item.stats.length}</small>
              </h3>
              {item.stats.length ? (
                <dl className="stat-lines">
                  {item.stats.map((stat, i) => {
                    const signature =
                      !stat.rolled &&
                      item.highlights.some(
                        (highlight) =>
                          highlight.label === stat.label &&
                          highlight.value === stat.value,
                      );
                    return (
                      <div
                        key={`${stat.label}-${i}`}
                        className={`${stat.value.trim().startsWith('-') ? 'negative-stat' : ''} ${signature ? 'signature-stat' : ''}`}
                      >
                        <dt>
                          {signature && !hasStatDescription(stat) ? (
                            <span className="signature-mark" aria-hidden="true">
                              ◆
                            </span>
                          ) : null}
                          <StatLabel stat={stat} handle={statHelpHandle} />
                        </dt>
                        <dd
                          className={
                            stat.value.length <= 12
                              ? 'stat-value-short'
                              : undefined
                          }
                        >
                          {stat.value}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              ) : (
                <p className="empty-properties">
                  No fixed numeric properties are recorded for this entry.
                </p>
              )}
            </section>
            {item.effects.length ? (
              <section
                className="entry-effects"
                aria-label={`Special effects of ${item.name}`}
              >
                <h3 className="ruled-heading">
                  <span>Special effects</span>
                  <small>{item.effects.length}</small>
                </h3>
                <ul>
                  {item.effects.map((effect, i) => (
                    <li key={i} className={i === 0 ? 'signature-effect' : ''}>
                      <span className="effect-marker" aria-hidden="true">
                        ✧
                      </span>
                      <span>{effect.text}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {item.lore && (showLore || item.lore.kind !== 'Lore') ? (
              <div
                className={`entry-lore ${item.lore.kind === 'Lore' ? 'narrative-lore' : ''}`}
              >
                <span className="small-label">
                  <Feather size={13} />
                  {item.lore.kind}
                </span>
                <blockquote>{item.lore.text}</blockquote>
              </div>
            ) : null}
            <div className="entry-acquisition">
              <span className="small-label">
                <MapPin size={12} />
                Obtained from
              </span>
              <div>
                <span>
                  {item.acquisition.length
                    ? item.acquisition[0].label
                    : 'Not yet verified'}
                </span>
                {item.acquisition.some((method) => method.kind === 'craft') ? (
                  <span className="craftable-badge">Craftable</span>
                ) : null}
                <button
                  onClick={() => onDiscover(item)}
                  aria-label={`Acquisition details for ${item.name}`}
                >
                  Details
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
            <div className="entry-footnote">
              <span>
                {item.stats.length
                  ? 'Recorded values and ranges; actual rolls may vary.'
                  : item.kind === 'normal'
                    ? 'Additional properties may be rolled in game.'
                    : 'No fixed combat values in this catalog snapshot.'}
              </span>
              {item.unresolvedStats ? (
                <span>
                  {item.unresolvedStats} unresolved internal{' '}
                  {item.unresolvedStats === 1
                    ? 'field omitted'
                    : 'fields omitted'}
                  .
                </span>
              ) : null}
              {saved ? (
                <span className="saved-caption">
                  <Check size={12} />
                  Bookmarked
                </span>
              ) : null}
            </div>
          </article>
        ) : (
          <div className="empty-leaf">
            <Feather size={30} />
            <h3>
              {hasEntries ? 'The chapter ends here.' : 'An unwritten page.'}
            </h3>
            <p>
              {hasEntries
                ? 'Another chapter awaits among the chapter ribbons.'
                : 'No entries match these filters. Clear a filter to return to the collection.'}
            </p>
          </div>
        )}
      </div>
      <footer className="page-folio">
        <span>THE ITEM CODEX</span>
        <span className="folio-ornament">
          · {String(folio).padStart(2, '0')} ·
        </span>
        <span>SEASON X</span>
      </footer>
    </div>
  );
}
