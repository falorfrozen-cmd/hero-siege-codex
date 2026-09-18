'use client';
import { sharedArchiveHref } from '@desktop/links';
/* oxlint-disable next/no-html-link-for-pages */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Gem,
  Link as LinkIcon,
  List,
  Search,
  Shield,
  Skull,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import GlobalSearch from './global-search';
import ArchiveCoverage from './coverage';

export const volumes = [
  {
    id: 'items',
    name: 'Items',
    label: 'Item Archive',
    href: '/',
    icon: Swords,
    detail: 'Equipment & runewords',
  },
  {
    id: 'stats',
    name: 'Stats',
    label: 'Stat Archive',
    href: '/stat-archive',
    icon: Sparkles,
    detail: 'Original game descriptions',
  },
  {
    id: 'classes',
    name: 'Classes',
    label: 'Class Archive',
    href: '/class-study',
    icon: Shield,
    detail: 'Heroes & their disciplines',
  },
  {
    id: 'creatures',
    name: 'Creatures',
    label: 'Creature Archive',
    href: '/creature-archive',
    icon: Skull,
    detail: 'Creatures & encounters',
  },
  {
    id: 'relics',
    name: 'Relics',
    label: 'Relic Archive',
    href: '/relic-archive',
    icon: Gem,
    detail: 'Curiosities & strange powers',
  },
  {
    id: 'world',
    name: 'World',
    label: 'World Archive',
    href: '/world-archive',
    icon: Compass,
    detail: 'Ether & quest records',
  },
];
const IndexContext = createContext(() => {});
export function useIndexSelection() {
  return useContext(IndexContext);
}
function CloseArchiveMenu() {
  const { setOpenMobile } = useSidebar();
  return (
    <Button
      className="scholar-rail-close"
      size="icon-sm"
      variant="ghost"
      aria-label="Close archive menu"
      onClick={() => setOpenMobile(false)}
    >
      <X size={18} />
    </Button>
  );
}

export default function ScholarShell({
  active,
  title,
  count,
  index,
  children,
  tools,
  resetKey,
}: {
  active: string;
  title: string;
  count: string;
  index: ReactNode;
  children: ReactNode;
  tools?: ReactNode;
  resetKey?: string | number;
}) {
  const [indexOpen, setIndexOpen] = useState(false);
  const content = useRef<HTMLElement>(null);
  useEffect(() => {
    content.current?.scrollTo({ top: 0 });
  }, [resetKey]);
  function selectEntry() {
    setIndexOpen(false);
    content.current?.scrollTo({ top: 0 });
    if (window.matchMedia('(max-width: 1100px)').matches) {
      requestAnimationFrame(() => {
        if (!content.current?.contains(document.activeElement))
          content.current?.focus({ preventScroll: true });
      });
    }
  }
  return (
    <SidebarProvider
      className="scholar"
      data-archive={active}
      style={{ '--sidebar-width': '11.75rem' } as React.CSSProperties}
    >
      <a className="skip-link" href="#archive-content">
        Skip to entry
      </a>
      <Sidebar className="scholar-rail" collapsible="offcanvas">
        <SidebarHeader className="scholar-seal">
          <CloseArchiveMenu />
          <a href="/" aria-label="Hero Siege Codex home">
            <Image
              unoptimized
              src="/emblems/falor-seal.webp"
              width={64}
              height={64}
              alt=""
            />
            <span>THE CODEX</span>
          </a>
        </SidebarHeader>
        <SidebarContent>
          <nav aria-label="Codex archives" className="scholar-volumes">
            {volumes.map(({ id, name, label, href, icon: Icon }, i) => (
              <a
                key={id}
                href={href}
                aria-label={label}
                aria-current={active === id ? 'page' : undefined}
              >
                <Icon size={22} strokeWidth={1.35} />
                <span>{name}</span>
                <small className="scholar-volume-number">
                  {String(i + 1).padStart(2, '0')}
                </small>
              </a>
            ))}
          </nav>
        </SidebarContent>
        <SidebarFooter className="scholar-rail-footer">
          <BookOpen size={23} strokeWidth={1.2} />
          <span>HERO SIEGE</span>
          <small>The Scholar’s Index</small>
          <ArchiveCoverage />
        </SidebarFooter>
      </Sidebar>
      <div className="scholar-main">
        <header className="scholar-header">
          <SidebarTrigger className="scholar-menu" />
          <a href="/" className="scholar-brand">
            Hero Siege Codex
            <small>
              Created by <strong>Falor</strong>
            </small>
          </a>
          <GlobalSearch />
          {tools}
        </header>
        <div className="scholar-mobile-bar">
          <span>{title}</span>
          <Button
            variant="outline"
            onClick={() => setIndexOpen(!indexOpen)}
            aria-expanded={indexOpen}
            aria-controls="archive-index"
          >
            <List size={17} />
            {indexOpen ? 'Close index' : 'Browse entries'}
          </Button>
        </div>
        <div className="scholar-workspace" data-index-open={indexOpen}>
          <IndexContext.Provider value={selectEntry}>
            <aside
              className="scholar-index"
              id="archive-index"
              aria-label={`${title} index`}
            >
              <div className="scholar-index-heading">
                <h2>{title}</h2>
                <p>{count}</p>
              </div>
              {index}
            </aside>
            <main
              ref={content}
              id="archive-content"
              className="scholar-content"
              tabIndex={-1}
            >
              {children}
            </main>
          </IndexContext.Provider>
        </div>
      </div>
    </SidebarProvider>
  );
}

export function IndexEntry({
  active,
  children,
  onClick,
  ...props
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
  title?: string;
}) {
  const select = useContext(IndexContext);
  return (
    <button
      type="button"
      className="scholar-index-entry"
      aria-current={active ? 'true' : undefined}
      onClick={() => {
        onClick();
        select();
      }}
      {...props}
    >
      {children}
    </button>
  );
}
export function ArchiveSearch({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <search className="scholar-search">
      <Search size={18} aria-hidden="true" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        aria-label={label}
      />
      {value && (
        <button onClick={() => onChange('')} aria-label="Clear search">
          <X size={16} />
        </button>
      )}
    </search>
  );
}
export function EntryNavigation({
  previous,
  next,
  onPrevious,
  onNext,
  position,
}: {
  previous?: string;
  next?: string;
  onPrevious: () => void;
  onNext: () => void;
  position?: string;
}) {
  const select = useContext(IndexContext);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        target.closest(
          'input,textarea,select,button,a,[contenteditable=true],[role=dialog]',
        ) ||
        document.querySelector('[role=dialog]')
      )
        return;
      if (event.key === 'ArrowLeft' && previous) {
        event.preventDefault();
        onPrevious();
        select();
      }
      if (event.key === 'ArrowRight' && next) {
        event.preventDefault();
        onNext();
        select();
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [previous, next, onPrevious, onNext, select]);
  return (
    <nav className="scholar-entry-navigation" aria-label="Entry navigation">
      <button
        disabled={!previous}
        onClick={() => {
          onPrevious();
          select();
        }}
        aria-label="Previous entry"
      >
        <ArrowLeft size={19} />
        <span>
          Previous<small>{previous ?? 'First entry'}</small>
        </span>
      </button>
      <span className="scholar-position">{position}</span>
      <button
        disabled={!next}
        onClick={() => {
          onNext();
          select();
        }}
        aria-label="Next entry"
      >
        <span>
          Next<small>{next ?? 'Last entry'}</small>
        </span>
        <ArrowRight size={19} />
      </button>
    </nav>
  );
}
export function CopyEntry({ href, name }: { href: string; name: string }) {
  const [status, setStatus] = useState('');
  const [fallback, setFallback] = useState('');
  const attempt = useRef(0);
  async function copy() {
    const id = ++attempt.current;
    const url = sharedArchiveHref(new URL(href, window.location.origin).href);
    try {
      await navigator.clipboard.writeText(url);
      if (id === attempt.current) {
        setStatus('Link copied');
        setFallback('');
      }
    } catch {
      if (id === attempt.current) {
        setFallback(url);
        setStatus('Select and copy the link');
      }
    }
  }
  return (
    <div className="scholar-copy">
      <Button
        variant="outline"
        size="sm"
        onClick={copy}
        aria-label={`Copy link to ${name}`}
      >
        {status === 'Link copied' ? (
          <Check size={16} />
        ) : (
          <LinkIcon size={16} />
        )}
        {status === 'Link copied' ? 'Copied' : 'Copy link'}
      </Button>
      <output className="sr-only">{status}</output>
      {fallback && (
        <Input
          readOnly
          value={fallback}
          onFocus={(e) => e.target.select()}
          aria-label="Entry link to copy"
        />
      )}
    </div>
  );
}
export function ExploreArchives({ current }: { current: string }) {
  return (
    <section className="scholar-explore">
      <h2>Explore the archive</h2>
      <div>
        {volumes
          .filter((v) => v.id !== current)
          .slice(0, 4)
          .map(({ id, name, href, icon: Icon, detail }) => (
            <a key={id} href={href}>
              <Icon size={30} strokeWidth={1.1} />
              <h3>{name}</h3>
              <p>{detail}</p>
              <ArrowRight size={16} />
            </a>
          ))}
      </div>
    </section>
  );
}
export function EntryState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="scholar-empty" aria-live="polite">
      <BookOpen size={30} strokeWidth={1.2} />
      <h1>{title}</h1>
      {children}
    </div>
  );
}
