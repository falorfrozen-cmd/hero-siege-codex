'use client';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
const SearchDialog = lazy(() => import('./search-dialog'));
export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  function show() {
    setLoaded(true);
    setOpen(true);
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setLoaded(true);
        setOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  return (
    <>
      <Button
        variant="outline"
        className="scholar-global-search"
        onClick={show}
        aria-label="Search all archives"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Search size={18} />
        <span>Search all archives</span>
        <kbd>Ctrl K</kbd>
      </Button>
      {loaded && (
        <Suspense
          fallback={<output className="sr-only">Opening search…</output>}
        >
          <SearchDialog open={open} onOpenChange={setOpen} />
        </Suspense>
      )}
    </>
  );
}
