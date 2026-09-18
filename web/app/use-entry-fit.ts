'use client';
import { useLayoutEffect, useRef } from 'react';

// Fit only the record inside a fixed paper area. The binding never depends on
// item height. Bounded measurements run on content/size/font changes, not frames.
export function useEntryFit(identity: string) {
  const windowRef = useRef<HTMLDivElement>(null);
  const entryRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const viewport = windowRef.current;
    const entry = entryRef.current;
    if (!viewport || !entry) return;
    let frame = 0;
    let active = true;
    let lastSize = '';
    const measure = () => {
      if (!active || !viewport.clientHeight || !viewport.clientWidth) return;
      const size = `${viewport.clientWidth}:${viewport.clientHeight}`;
      if (size === lastSize) return;
      lastSize = size;
      entry.style.removeProperty('transform');
      entry.style.removeProperty('width');
      const title = entry.querySelector<HTMLElement>('.entry-copy h2');
      const titleBox = title?.parentElement;
      if (title && titleBox?.clientHeight && titleBox.clientWidth) {
        // The frame's inset defines the ink area. Measure real wrapping rather
        // than using a character-count threshold; no name is clipped or shortened.
        title.style.removeProperty('font-size');
        const preferred = parseFloat(getComputedStyle(title).fontSize);
        const fits = () =>
          title.offsetHeight <= titleBox.clientHeight - 1 &&
          title.scrollWidth <= titleBox.clientWidth;
        if (!fits()) {
          let low = 1;
          let high = preferred;
          for (let i = 0; i < 7; i++) {
            const middle = (low + high) / 2;
            title.style.fontSize = `${middle}px`;
            if (fits()) low = middle;
            else high = middle;
          }
          title.style.fontSize = `${Math.floor(low * 10) / 10}px`;
        }
      }
      const available = viewport.clientHeight - 2;
      const setType = (value: number) =>
        entry.style.setProperty('--entry-type', String(value));
      setType(1.12);
      if (entry.offsetHeight <= available) return;
      let low = 0.6;
      let high = 1.12;
      setType(low);
      // Extremely long records still retain every line. This last-resort scale
      // stays inside the same safe text margins; it cannot resize the book.
      if (entry.offsetHeight > available) {
        const scale = available / entry.offsetHeight;
        entry.style.transform = `scale(${scale})`;
        entry.style.transformOrigin = 'top left';
        return;
      }
      for (let i = 0; i < 6; i++) {
        const middle = (low + high) / 2;
        setType(middle);
        if (entry.offsetHeight <= available) low = middle;
        else high = middle;
      }
      setType(Math.floor(low * 1000) / 1000);
    };
    measure();
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(viewport);
    if (document.fonts.status !== 'loaded')
      void document.fonts.ready.then(() => {
        lastSize = '';
        measure();
      });
    return () => {
      active = false;
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [identity]);
  return { windowRef, entryRef };
}
