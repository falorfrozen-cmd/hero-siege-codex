'use client';
import { useEffect, useId, useRef, useState } from 'react';

/** Read the rendered article, so unavailable sections never get dead links. */
export default function EntryContents({
  entryKey,
}: {
  entryKey: string | number;
}) {
  const root = useRef<HTMLElement>(null);
  const prefix = useId().replace(/:/g, '');
  const [sections, setSections] = useState<{ id: string; label: string }[]>([]);
  useEffect(() => {
    const article = root.current?.closest('article');
    if (!article) return;
    const headings = Array.from(article.querySelectorAll<HTMLElement>('h2'));
    setSections(
      headings.map((heading, i) => {
        // Reindex our generated anchors when optional sections appear/disappear.
        // Keep explicit anchors (for example skill deep links) unchanged.
        if (!heading.id || heading.id.startsWith(`${prefix}-section-`))
          heading.id = `${prefix}-section-${i}`;
        heading.tabIndex = -1;
        const label = Array.from(heading.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent)
          .join('')
          .trim();
        return {
          id: heading.id,
          label: label || heading.textContent || 'Section',
        };
      }),
    );
  }, [entryKey, prefix]);
  function go(id?: string) {
    const article = root.current?.closest('article');
    const target = id
      ? document.getElementById(id)
      : article?.querySelector('h1');
    if (!target) return;
    const pane = document.getElementById('archive-content');
    if (!pane) return;
    const top = id
      ? target.getBoundingClientRect().top -
        pane.getBoundingClientRect().top +
        pane.scrollTop -
        (root.current?.offsetHeight ?? 0) -
        24
      : 0;
    pane.scrollTo({ top, behavior: 'auto' });
    target.setAttribute('tabindex', '-1');
    (target as HTMLElement).focus({ preventScroll: true });
  }
  return (
    <nav ref={root} className="scholar-contents" aria-label="On this page">
      <span>On this page</span>
      <div>
        <button type="button" onClick={() => go()}>
          Overview
        </button>
        {sections.map((section) => (
          <button type="button" key={section.id} onClick={() => go(section.id)}>
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
