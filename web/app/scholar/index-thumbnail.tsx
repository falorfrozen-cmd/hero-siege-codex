'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';

// One observer for all mounted index pictures. Clipped/closed indexes load no art.
let observer: IntersectionObserver | undefined;
const pending = new WeakMap<Element, () => void>();
export default function IndexThumbnail({
  src,
  portrait = false,
}: {
  src?: string | null;
  portrait?: boolean;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const node = root.current;
    if (!src || !node) return;
    observer ??= new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            pending.get(entry.target)?.();
            pending.delete(entry.target);
            observer?.unobserve(entry.target);
          }
      },
      { rootMargin: '48px' },
    );
    pending.set(node, () => setVisible(true));
    observer.observe(node);
    return () => {
      pending.delete(node);
      observer?.unobserve(node);
    };
  }, [src]);
  return (
    <span
      ref={root}
      className="scholar-index-picture"
      data-portrait={portrait || undefined}
      aria-hidden="true"
    >
      {visible && src && !failed ? (
        <Image
          unoptimized
          src={src}
          width={40}
          height={40}
          alt=""
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <BookOpen size={17} strokeWidth={1.1} />
      )}
    </span>
  );
}
