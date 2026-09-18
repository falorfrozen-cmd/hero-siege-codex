'use client';
import { useState } from 'react';
import { indexWindow } from '@/lib/index-window';
export function useIndexWindow<T>(
  entries: T[],
  selected: string,
  activeIndex: number,
) {
  const [request, setRequest] = useState<{
    selected: string;
    page: number | null;
  }>({ selected, page: null });
  // Forget a manually browsed page when the record changes, including Back/Forward.
  if (request.selected !== selected) setRequest({ selected, page: null });
  return {
    ...indexWindow(
      entries,
      activeIndex,
      request.selected === selected ? request.page : null,
    ),
    setPage: (page: number | null) => setRequest({ selected, page }),
  };
}
