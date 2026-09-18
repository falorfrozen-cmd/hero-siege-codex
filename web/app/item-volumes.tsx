/* oxlint-disable next/no-html-link-for-pages */
import './item-volumes.css';

export default function ItemVolumes({
  active,
}: {
  active: 'equipment' | 'relics';
}) {
  return (
    <nav className="item-volumes" aria-label="Item collections">
      <a href="/" aria-current={active === 'equipment' ? 'page' : undefined}>
        Equipment
      </a>
      <span aria-hidden="true">/</span>
      <a
        href="/relic-archive"
        aria-current={active === 'relics' ? 'page' : undefined}
      >
        Relics
      </a>
    </nav>
  );
}
