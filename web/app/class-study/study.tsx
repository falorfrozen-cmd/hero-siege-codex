'use client';
import EntryContents from '../scholar/entry-contents';
import IndexThumbnail from '../scholar/index-thumbnail';
/* oxlint-disable next/no-html-link-for-pages */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import ScholarShell, {
  CopyEntry,
  EntryNavigation,
  IndexEntry,
  useIndexSelection,
} from '../scholar/shell';
import SkillSearch from './skill-search';
import {
  classEntryHref,
  classStorageKey,
  readClassPosition,
  readSkillLink,
  skillKey,
} from '@/lib/class-reader';
type Skill = {
  id: number;
  name: string;
  description: string;
  sourceKey: string;
  icon: string;
  terms?: { key: string; label: string; href?: string }[];
};
type Entry = {
  id: number;
  slug: string;
  name: string;
  title: string;
  focus: string[];
  description: string;
  image: string;
  tone: string;
  skills: Skill[];
};
function ClassSkillSearch({
  currentClass,
  onSelect,
}: {
  currentClass: string;
  onSelect: (key: string) => void;
}) {
  const closeIndex = useIndexSelection();
  return (
    <SkillSearch
      currentClass={currentClass}
      onSelect={(key) => {
        closeIndex();
        onSelect(key);
      }}
    />
  );
}
export default function ClassStudy({
  entry,
  classes,
  initialSkill,
}: {
  entry: Entry;
  classes: { slug: string; name: string; image?: string }[];
  initialSkill: string | null;
}) {
  const [selected, setSelected] = useState(initialSkill ?? 'portrait');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const position = classes.findIndex((c) => c.slug === entry.slug);
  function choose(key: string, push = true) {
    if (key !== 'portrait' && !entry.skills.some((s) => skillKey(s) === key))
      return;
    window.history[push ? 'pushState' : 'replaceState'](
      null,
      '',
      classEntryHref(entry.slug, key),
    );
    setSelected(key);
    setError('');
    requestAnimationFrame(() => {
      const target = document.getElementById(
        key === 'portrait' ? 'class-overview' : `skill-${key}`,
      );
      target?.scrollIntoView({ block: 'start' });
      target?.focus({ preventScroll: true });
    });
  }
  useEffect(() => {
    let restored = initialSkill;
    try {
      if (!restored)
        restored = readClassPosition(
          localStorage.getItem(classStorageKey(entry.slug)),
          entry.skills,
        );
    } catch {
      /* Device preferences are optional. */
    }
    const frame = requestAnimationFrame(() => {
      setSelected(restored ?? 'portrait');
      setReady(true);
      if (restored && restored !== 'portrait')
        document
          .getElementById(`skill-${restored}`)
          ?.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [entry.slug, entry.skills, initialSkill]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        classStorageKey(entry.slug),
        JSON.stringify({ version: 1, skill: selected }),
      );
    } catch {
      /* Reading remains available without storage. */
    }
  }, [entry.slug, selected, ready]);
  useEffect(() => {
    const pop = () => {
      try {
        const key =
          readSkillLink(new URLSearchParams(location.search), entry.skills) ??
          'portrait';
        setSelected(key);
        setError('');
        requestAnimationFrame(() =>
          document
            .getElementById(
              key === 'portrait' ? 'class-overview' : `skill-${key}`,
            )
            ?.scrollIntoView({ block: 'start' }),
        );
      } catch {
        setError(
          'This skill link is unavailable. Choose a skill from the index.',
        );
      }
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, [entry.skills]);
  return (
    <ScholarShell
      active="classes"
      resetKey={entry.slug}
      title="Class Archive"
      browse={{ label: 'skills', count: entry.skills.length }}
      count={`${classes.length} illustrated classes`}
      index={
        <>
          <details className="scholar-class-selector">
            <summary>Choose a class · {entry.name}</summary>
            {classes.map((c) => (
              <a
                key={c.slug}
                className="scholar-class-link"
                href={classEntryHref(c.slug)}
                aria-current={c.slug === entry.slug ? 'page' : undefined}
              >
                <IndexThumbnail src={c.image} portrait />
                <span>{c.name}</span>
              </a>
            ))}
          </details>
          <ClassSkillSearch currentClass={entry.slug} onSelect={choose} />
          <IndexEntry
            active={selected === 'portrait'}
            image={entry.image.replace('.webp', '-mobile.webp')}
            portrait
            onClick={() => choose('portrait')}
          >
            Overview <small>{entry.name}</small>
          </IndexEntry>
          <p className="scholar-eyebrow scholar-index-subtitle">
            Skills & techniques
          </p>
          {entry.skills.map((s, i) => (
            <IndexEntry
              key={s.sourceKey}
              active={selected === skillKey(s)}
              image={s.icon}
              onClick={() => choose(skillKey(s))}
            >
              <span>
                <small>{String(i + 1).padStart(2, '0')}</small>
                {s.name}
              </span>
            </IndexEntry>
          ))}
        </>
      }
    >
      <article>
        <EntryContents entryKey={entry.slug} />
        {error && (
          <p role="alert" className="scholar-alert">
            {error}
          </p>
        )}
        <section id="class-overview" tabIndex={-1}>
          <p className="scholar-breadcrumb">
            <span>Classes</span>
            <span>{entry.name}</span>
          </p>
          <header className="scholar-record-head">
            <div>
              <p className="scholar-eyebrow">{entry.title}</p>
              <h1>{entry.name}</h1>
            </div>
            <CopyEntry
              name={entry.name}
              href={classEntryHref(entry.slug, 'portrait')}
            />
          </header>
          <div className="scholar-class-profile">
            <div>
              <ul className="scholar-chips">
                {entry.focus.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <p className="scholar-class-description">{entry.description}</p>
              <p className="scholar-caption">
                An introduction drawn from the class’s recorded skills.
              </p>
              <p className="scholar-eyebrow">
                {entry.skills.length} recorded skills
              </p>
            </div>
            <figure>
              <picture>
                <source
                  media="(max-width:767px)"
                  srcSet={entry.image.replace('.webp', '-mobile.webp')}
                />
                <Image
                  unoptimized
                  src={entry.image}
                  width={768}
                  height={960}
                  alt={`Painted interpretation of the Hero Siege ${entry.name}`}
                  priority
                />
              </picture>
            </figure>
          </div>
        </section>
        <section className="scholar-section">
          <h2>Skills & techniques</h2>
          <p className="scholar-caption">Original in-game descriptions</p>
          <div className="scholar-skills">
            {entry.skills.map((s, i) => (
              <section
                key={s.sourceKey}
                id={`skill-${skillKey(s)}`}
                tabIndex={-1}
                className="scholar-skill"
                data-selected={selected === skillKey(s)}
              >
                <header>
                  <Image
                    unoptimized
                    src={s.icon}
                    width={44}
                    height={44}
                    alt=""
                    loading="lazy"
                  />
                  <div>
                    <p className="scholar-eyebrow">
                      {String(i + 1).padStart(2, '0')}
                    </p>
                    <h3>{s.name}</h3>
                  </div>
                  <CopyEntry
                    name={s.name}
                    href={classEntryHref(entry.slug, skillKey(s))}
                  />
                </header>
                <p>{s.description}</p>
                {!!s.terms?.length && (
                  <div className="scholar-terms">
                    <span>Game terms</span>
                    {s.terms.map((t) =>
                      t.href ? (
                        <a key={t.key} href={t.href}>
                          {t.label}
                        </a>
                      ) : (
                        <span key={t.key}>{t.label}</span>
                      ),
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>
        </section>
        <EntryNavigation
          previous={classes[position - 1]?.name}
          next={classes[position + 1]?.name}
          onPrevious={() =>
            location.assign(classEntryHref(classes[position - 1].slug))
          }
          onNext={() =>
            location.assign(classEntryHref(classes[position + 1].slug))
          }
          position={`${position + 1} / ${classes.length} classes`}
        />
      </article>
    </ScholarShell>
  );
}
