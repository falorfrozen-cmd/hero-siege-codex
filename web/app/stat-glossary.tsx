'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';
import type { Stat } from '@/lib/catalog';
import manifest from '@/lib/stat-glossary-manifest.json';
import { statArchiveHref } from '@/lib/stat-archive';

type Explanation = {
  label: string;
  text: string;
  sourceKey: string;
  line: number;
};
type Glossary = { entries: Record<string, Explanation> };
export type StatHelpHandle = {
  open: (stat: Stat, anchor: HTMLButtonElement) => void;
  close: () => void;
};
export const createStatHelpHandle = (): StatHelpHandle => ({
  open: () => {},
  close: () => {},
});
const supported = new Set<number>(manifest.statKeys);
export const hasStatDescription = (stat: Stat) =>
  stat.key !== undefined && supported.has(stat.key);
let request: Promise<Glossary> | null = null;
function loadGlossary() {
  return (request ??= fetch(manifest.path)
    .then(async (response) => {
      if (!response.ok) throw new Error('Glossary unavailable');
      const data: Glossary = await response.json();
      if (
        !manifest.statKeys.every(
          (key) => typeof data.entries?.[key]?.text === 'string',
        )
      )
        throw new Error('Invalid glossary');
      return data;
    })
    .catch((error) => {
      request = null;
      throw error;
    }));
}

export function StatLabel({
  stat,
  handle,
}: {
  stat: Stat;
  handle: StatHelpHandle;
}) {
  if (!hasStatDescription(stat)) return stat.label;
  return (
    <button
      type="button"
      className="stat-help"
      aria-haspopup="dialog"
      aria-controls="stat-explanation"
      aria-label={`Explain ${stat.label}`}
      onClick={(event) => handle.open(stat, event.currentTarget)}
    >
      {stat.label}
      <Info className="stat-help-icon" size={11} aria-hidden="true" />
    </button>
  );
}

function Description({ stat }: { stat: Stat }) {
  const [text, setText] = useState('');
  const [archiveHref, setArchiveHref] = useState('');
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loadGlossary()
      .then((data) => {
        const entry = data.entries[stat.key!];
        if (!entry || entry.label !== stat.label)
          throw new Error('Mismatched stat');
        if (active) {
          setText(entry.text);
          setArchiveHref(statArchiveHref(entry.sourceKey));
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [stat.key, stat.label, attempt]);
  return (
    <div
      className="stat-explanation-body"
      aria-live="polite"
      aria-busy={!text && !error}
    >
      {text ? (
        <>
          <p>{text}</p>
          {/* Document navigation avoids the deployed client router issue. */}
          {/* oxlint-disable-next-line next/no-html-link-for-pages */}
          <a className="stat-archive-reference" href={archiveHref}>
            Open in Stat Archive →
          </a>
        </>
      ) : error ? (
        <>
          <p>The game description could not be loaded.</p>
          <button
            className="stat-help-retry"
            onClick={() => {
              setError(false);
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </button>
        </>
      ) : (
        <p>Loading game description…</p>
      )}
    </div>
  );
}

// Native top-layer popover keeps a single note outside the scaled paper. The
// existing library popover exceeded the established gzip budget by 5.4 KB.
export default function StatGlossary({
  handle,
  resetKey,
}: {
  handle: StatHelpHandle;
  resetKey: string;
}) {
  const [selection, setSelection] = useState<{
    stat: Stat;
    anchor: HTMLButtonElement;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    handle.open = (stat, anchor) =>
      setSelection((current) =>
        current?.anchor === anchor ? null : { stat, anchor },
      );
    handle.close = () => setSelection(null);
    return () => {
      handle.open = () => {};
      handle.close = () => {};
    };
  }, [handle]);
  useLayoutEffect(() => {
    handle.close();
  }, [handle, resetKey]);
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!selection || !panel) return;
    const { anchor } = selection;
    anchor.setAttribute('aria-expanded', 'true');
    panel.showPopover?.();
    const position = () => {
      const rect = anchor.getBoundingClientRect();
      const width = panel.offsetWidth,
        height = panel.offsetHeight;
      const below = rect.bottom + 8;
      panel.style.left = `${Math.max(16, Math.min(rect.left, document.documentElement.clientWidth - width - 16))}px`;
      panel.style.top = `${Math.max(12, Math.min(below + height <= innerHeight - 12 ? below : rect.top - height - 8, innerHeight - height - 12))}px`;
    };
    position();
    panel
      .querySelector<HTMLButtonElement>('.stat-help-close')
      ?.focus({ preventScroll: true });
    const observer = new ResizeObserver(position);
    observer.observe(panel);
    return () => {
      observer.disconnect();
      anchor.removeAttribute('aria-expanded');
    };
  }, [selection]);
  useEffect(() => {
    if (!selection) return;
    const dismiss = (event: Event) => {
      if (
        event.target instanceof Node &&
        panelRef.current?.contains(event.target)
      )
        return;
      if (
        event.type === 'pointerdown' &&
        event.target instanceof Node &&
        selection.anchor.contains(event.target)
      )
        return;
      setSelection(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      selection.anchor.focus({ preventScroll: true });
      setSelection(null);
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    window.addEventListener('scroll', dismiss, {
      capture: true,
      passive: true,
    });
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [selection]);
  if (!selection) return null;
  return (
    <div
      ref={panelRef}
      popover="manual"
      role="dialog"
      id="stat-explanation"
      aria-labelledby="stat-explanation-title"
      className="stat-explanation"
      data-slot="popover-content"
      onBlur={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget) &&
          event.relatedTarget !== selection.anchor
        )
          setSelection(null);
      }}
    >
      <div className="stat-explanation-heading">
        <span>Game description</span>
        <button
          type="button"
          className="stat-help-close"
          aria-label="Close stat explanation"
          onClick={() => {
            selection.anchor.focus({ preventScroll: true });
            setSelection(null);
          }}
        >
          <X size={17} />
        </button>
      </div>
      <h3 id="stat-explanation-title" data-slot="popover-title">
        {selection.stat.label}
      </h3>
      <Description
        key={`${selection.stat.key}:${selection.stat.label}`}
        stat={selection.stat}
      />
    </div>
  );
}
