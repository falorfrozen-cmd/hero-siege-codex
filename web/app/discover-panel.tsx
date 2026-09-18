'use client';
import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Copy,
  Compass,
  MapPin,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CHAPTERS, type IndexItem, type Item } from '@/lib/catalog';
import { sharedEntryHref as entryHref } from '@desktop/links';

function EntryDiscovery({
  item,
  rows,
  failed,
  retry,
  onChoose,
}: {
  item: Item;
  rows: Map<number, IndexItem>;
  failed: boolean;
  retry: () => void;
  onChoose: (item: IndexItem) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [manualLink, setManualLink] = useState('');
  return (
    <>
      <div className="discovery-intro">
        <span className="small-label">
          {item.rarity} · {item.type}
          {item.variant !== null ? ` · Base variant ${item.variant}` : ''}
        </span>
        <h3>{item.name}</h3>
        <p>{item.summary}</p>
        <Button
          variant="outline"
          className="copy-entry-link"
          onClick={async () => {
            const href = entryHref(item, window.location.href);
            // Keep the exact selected-entry URL available even in embedded
            // browsers whose clipboard bridge cannot be inspected reliably.
            setManualLink(href);
            try {
              await navigator.clipboard.writeText(href);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? 'Link copied' : 'Copy entry link'}
        </Button>
        <output className="sr-only">
          {copied ? 'Entry link copied.' : ''}
        </output>
        {manualLink ? (
          <label
            className="manual-entry-link"
            htmlFor={`entry-link-${item.id}`}
          >
            Copy this link
            <Input
              id={`entry-link-${item.id}`}
              readOnly
              value={manualLink}
              onFocus={(event) => event.currentTarget.select()}
            />
          </label>
        ) : null}
      </div>
      {item.set && item.setRecord ? (
        <section
          className="set-discovery"
          aria-label={`${item.set} set collection`}
        >
          <div className="discovery-heading">
            <Shield size={16} />
            <h3>Set collection</h3>
          </div>
          <div className="set-discovery-title">
            <span className="set-seal" aria-hidden="true">
              {item.setRecord.seal}
              <small>{item.setRecord.id}</small>
            </span>
            <div>
              <h4>{item.set}</h4>
              <p>{item.setRecord.pieces.length} recorded pieces</p>
            </div>
          </div>
          <div className="related-entries">
            {!rows.size ? (
              <output className="discovery-state">
                {failed
                  ? 'The set index is unavailable. Use Try again below.'
                  : 'Opening the set index…'}
              </output>
            ) : null}
            {item.setRecord.pieces.map((id) => {
              const piece = rows.get(id);
              if (!piece) return null;
              return (
                <button
                  key={id}
                  className="related-entry"
                  onClick={() => onChoose(piece)}
                  disabled={id === item.id}
                  aria-current={id === item.id ? 'true' : undefined}
                >
                  <span
                    className="related-dot"
                    style={{ background: CHAPTERS[piece.rarity].color }}
                  />
                  <span>
                    <strong>{piece.name}</strong>
                    <small>
                      {piece.type} ·{' '}
                      {id === item.id ? 'Current entry' : piece.rarity}
                    </small>
                  </span>
                  {id === item.id ? (
                    <Check size={16} />
                  ) : (
                    <ArrowUpRight size={16} />
                  )}
                </button>
              );
            })}
          </div>
          <h4 className="set-bonuses-title">Set bonuses</h4>
          {item.setRecord.bonuses.length ? (
            <ul className="recorded-bonuses">
              {item.setRecord.bonuses.map((bonus) => (
                <li key={bonus.required}>
                  <strong>{bonus.required} pieces</strong> {bonus.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="discovery-state">
              Set bonuses have not yet been verified.
            </p>
          )}
        </section>
      ) : null}
      <section
        className="acquisition-discovery"
        aria-label={`Obtained from: ${item.name}`}
      >
        <div className="discovery-heading">
          <MapPin size={16} />
          <h3>Obtained from</h3>
        </div>
        {item.acquisition.length ? (
          item.acquisition.map((method, i) => (
            <div
              className="acquisition-route"
              key={`${method.evidence.key}-${i}`}
            >
              <div>
                <strong>{method.label}</strong>
                {method.kind === 'craft' ? (
                  <span className="craftable-badge">Craftable</span>
                ) : null}
              </div>
              <p>{method.detail}</p>
              {method.boss || method.area || method.difficulty ? (
                <p>
                  {[method.boss, method.area, method.difficulty]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              ) : null}
              <small>
                {method.evidence.file === 'translationsItem.csv'
                  ? 'Recorded in the game’s English recipe text.'
                  : 'Recorded rune sequence and base requirements.'}
              </small>
            </div>
          ))
        ) : (
          <p className="discovery-state">
            No acquisition route has been verified for this entry. This does not
            mean it cannot drop or be crafted.
          </p>
        )}
      </section>
      <div className="discovery-heading">
        <Compass size={16} />
        <h3>Related entries</h3>
      </div>
      {failed ? (
        <div className="discovery-state">
          <p>The discovery index could not be loaded.</p>
          <Button variant="outline" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : !rows.size ? (
        <output className="discovery-state">
          Opening the discovery index…
        </output>
      ) : item.related.length ? (
        <div className="related-entries">
          {item.related.map((relation) => {
            const target = rows.get(relation.id);
            if (!target) return null;
            return (
              <button
                key={target.id}
                onClick={() => onChoose(target)}
                className="related-entry"
              >
                <span
                  className="related-dot"
                  style={{ background: CHAPTERS[target.rarity].color }}
                />
                <span>
                  <strong>{target.name}</strong>
                  <small>
                    {target.rarity} · {target.type}
                  </small>
                  <em>{relation.reason}</em>
                </span>
                <ArrowUpRight size={16} />
              </button>
            );
          })}
        </div>
      ) : (
        <p className="discovery-state">
          No matching set or combat focus is recorded for this entry.
        </p>
      )}
    </>
  );
}

export default function DiscoverPanel({
  items,
  selectedId,
  select,
  index,
  failed,
  retry,
  onChoose,
}: {
  items: Item[];
  selectedId: number | null;
  select: (id: number) => void;
  index: IndexItem[];
  failed: boolean;
  retry: () => void;
  onChoose: (item: IndexItem) => void;
}) {
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const rows = useMemo(
    () => new Map(index.map((item) => [item.id, item])),
    [index],
  );
  if (!selected)
    return (
      <p className="discovery-state">
        Open an entry to discover related items.
      </p>
    );
  return (
    <div className="discovery-panel">
      {items.length > 1 ? (
        <div className="discovery-selection" aria-label="Entry to explore">
          {items.map((item) => (
            <button
              key={item.id}
              aria-pressed={selected.id === item.id}
              onClick={() => select(item.id)}
            >
              {item.name}
              {item.variant !== null ? (
                <small>Base variant {item.variant}</small>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
      <EntryDiscovery
        key={selected.id}
        item={selected}
        rows={rows}
        failed={failed}
        retry={retry}
        onChoose={onChoose}
      />
    </div>
  );
}
