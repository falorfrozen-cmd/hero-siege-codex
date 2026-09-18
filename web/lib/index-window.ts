/** Keep a bounded index page while following direct links and Next/Previous. */
export function indexWindow<T>(
  entries: T[],
  activeIndex: number,
  requested: number | null,
  size = 40,
) {
  const total = Math.max(1, Math.ceil(entries.length / size));
  const page = Math.min(
    total - 1,
    Math.max(0, requested ?? Math.floor(Math.max(0, activeIndex) / size)),
  );
  return {
    entries: entries.slice(page * size, (page + 1) * size),
    page,
    total,
  };
}
