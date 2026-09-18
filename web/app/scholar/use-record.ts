'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// Keep only a small set of complete entries. The index stays light and artwork
// is requested by the selected record, never by the entire catalogue.
export function useRecord<T>({
  initial,
  initialKey,
  records,
  getKey,
  href,
  readKey,
  valid,
}: {
  initial: T;
  initialKey: string;
  records: { key: string; file: string }[];
  getKey: (entry: T) => string;
  href: (key: string) => string;
  readKey: (params: URLSearchParams) => string;
  valid: (value: T) => boolean;
}) {
  const [entry, setEntry] = useState(initial);
  const [selected, setSelected] = useState(initialKey);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const cache = useRef(new Map([[initialKey, initial]]));
  const select = useCallback((key: string) => {
    setSelected(key);
    setError('');
    const cached = cache.current.get(key);
    if (cached) setEntry(cached);
  }, []);
  const navigate = useCallback(
    (key: string, push = true) => {
      if (!records.some((row) => row.key === key)) return;
      window.history[push ? 'pushState' : 'replaceState'](null, '', href(key));
      select(key);
    },
    [records, href, select],
  );
  useEffect(() => {
    if (cache.current.has(selected)) return;
    const record = records.find((row) => row.key === selected);
    if (!record) return;
    const controller = new AbortController();
    void fetch(record.file, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok)
          throw new Error('This entry could not be loaded. Please try again.');
        const value = (await response.json()) as T;
        if (getKey(value) !== selected || !valid(value))
          throw new Error('The archive returned an invalid record.');
        if (controller.signal.aborted) return;
        cache.current.set(selected, value);
        if (cache.current.size > 12)
          cache.current.delete(cache.current.keys().next().value!);
        setEntry(value);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError('This entry could not be loaded. Please try again.');
      });
    return () => controller.abort();
  }, [selected, records, getKey, valid, retry]);
  useEffect(() => {
    const pop = () => {
      try {
        select(readKey(new URLSearchParams(location.search)));
      } catch {
        setError(
          'This entry link is unavailable. Choose another record from the index.',
        );
      }
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, [readKey, select]);
  return {
    entry,
    selected,
    navigate,
    error,
    loading: getKey(entry) !== selected,
    retry: () => {
      setError('');
      setRetry((n) => n + 1);
    },
  };
}
