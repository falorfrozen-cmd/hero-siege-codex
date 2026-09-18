// Resolve the same validated pages as the website, from bundled modules only.
const pages = {
  '/': () => import('@/app/page'),
  '/stat-archive': () => import('@/app/stat-archive/page'),
  '/class-study': () => import('@/app/class-study/page'),
  '/creature-archive': () => import('@/app/creature-archive/page'),
  '/relic-archive': () => import('@/app/relic-archive/page'),
  '/world-archive': () => import('@/app/world-archive/page'),
};

export async function renderArchive() {
  const pathname = location.pathname === '/index.html' ? '/' : location.pathname.replace(/\/$/, '') || '/';
  const load = pages[pathname as keyof typeof pages];
  if (!load) throw new Error('This archive is not included in this test build.');
  const params: Record<string, string | string[]> = {};
  for (const [key, value] of new URLSearchParams(location.search)) {
    const old = params[key];
    params[key] = old === undefined ? value : [...(Array.isArray(old) ? old : [old]), value];
  }
  const page = await load();
  return page.default({ searchParams: Promise.resolve(params) });
}
