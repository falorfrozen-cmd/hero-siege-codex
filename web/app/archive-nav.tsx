// Document navigation is required by the deployed vinext router.
/* oxlint-disable next/no-html-link-for-pages */
const archives = [
  { id: 'items', label: 'Item Archive', href: '/' },
  { id: 'stats', label: 'Stat Archive', href: '/stat-archive' },
  { id: 'classes', label: 'Class Archive', href: '/class-study' },
  { id: 'creatures', label: 'Creature Archive', href: '/creature-archive' },
  { id: 'world', label: 'World Archive', href: '/world-archive' },
];

export default function ArchiveNav({ active }: { active: string }) {
  return (
    <nav className="archive-volumes" aria-label="Codex archives">
      {archives.map(({ id, label, href }) => (
        <a
          key={id}
          href={href}
          aria-current={active === id ? 'page' : undefined}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
