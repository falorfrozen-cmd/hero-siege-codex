import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { desktopEntryPath } from './links';
import { renderArchive } from './routes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import '@/app/globals.css';
import '@/app/scholar/panels.css';
import '@/app/scholar/scholar.css';
import '@/app/scholar/refinement.css';
import './desktop.css';

function openEntry(value: string, replace = false) {
  const path = desktopEntryPath(value);
  // Document navigation also switches classes/volumes and remounts invalid entries safely.
  if (replace) window.history.replaceState(null, '', path);
  else window.location.assign(path);
}

function DesktopDialogs({ initialError = '' }: { initialError?: string }) {
  const [open, setOpen] = useState(!!initialError);
  const [value, setValue] = useState('');
  const [error, setError] = useState(initialError);
  useEffect(() => {
    const trigger = () => { setError(''); setOpen(true); };
    const invalid = (e: Event) => { setError((e as CustomEvent<string>).detail); setOpen(true); };
    const keyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'o') { e.preventDefault(); trigger(); }
    };
    window.addEventListener('keydown', keyboard);
    window.addEventListener('codex-link-error', invalid);
    const pending = isTauri() ? listen('open-entry-link', trigger) : null;
    return () => {
      window.removeEventListener('keydown', keyboard);
      window.removeEventListener('codex-link-error', invalid);
      if (pending) void pending.then(stop => stop());
    };
  }, []);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="desktop-link-dialog">
      <DialogHeader><DialogTitle>Open entry link</DialogTitle><DialogDescription>Paste a desktop or website entry link. The entry opens in this offline catalog.</DialogDescription></DialogHeader>
      <form onSubmit={e => { e.preventDefault(); try { openEntry(value); setOpen(false); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'This link is invalid.'); } }}>
        <label htmlFor="desktop-entry-url">Entry link</label>
        <Input id="desktop-entry-url" value={value} onChange={e => setValue(e.target.value)} placeholder="hscodex://entry?item=…" autoFocus />
        {error ? <p role="alert">{error}</p> : null}
        <Button type="submit" disabled={!value.trim()}>Open entry</Button>
      </form>
    </DialogContent>
  </Dialog>;
}

async function start() {
  let initialError = '';
  if (isTauri()) {
    await onOpenUrl(urls => {
      try { if (urls[0]) { sessionStorage.setItem('codex-launch-link', urls[0]); openEntry(urls[0]); } }
      catch (error) { window.dispatchEvent(new CustomEvent('codex-link-error', { detail: String(error) })); }
    });
    const urls = await getCurrent();
    if (urls?.[0] && sessionStorage.getItem('codex-launch-link') !== urls[0]) {
      try { sessionStorage.setItem('codex-launch-link', urls[0]); openEntry(urls[0], true); }
      catch (error) { initialError = error instanceof Error ? error.message : 'This link is invalid.'; }
    }
  }
  let archive;
  try { archive = await renderArchive(); }
  catch (error) {
    initialError = error instanceof Error ? error.message : 'This entry could not be opened.';
    archive = <main className="desktop-error"><h1>Entry unavailable</h1><p>{initialError}</p><a href="/">Open the Item Archive</a></main>;
  }
  createRoot(document.getElementById('root')!).render(<>
    {archive}
    <DesktopDialogs initialError={initialError} />
  </>);
}
void start().catch(() => {
  const root = document.getElementById('root');
  if (root) root.textContent = 'The archive could not start. Close the application and try again.';
});
