import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ClassStudy from './study';
import studies from './studies.json';
import termData from './skill-terms.json';
import { readSkillLink } from '../../lib/class-reader';

export const metadata: Metadata = {
  title: 'The Class Archive — Hero Siege Codex',
  description:
    'Explore 24 illustrated Hero Siege classes and their original in-game skill descriptions.',
  robots: { index: false, follow: false },
};

export default async function ClassStudyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selected =
    params.class === undefined
      ? studies[0]
      : studies.find((entry) => entry.slug === params.class);
  if (!selected) notFound();
  let initialSkill: string | null;
  try {
    const skillParams = new URLSearchParams();
    for (const value of typeof params.skill === 'string'
      ? [params.skill]
      : (params.skill ?? [])) {
      skillParams.append('skill', value);
    }
    initialSkill = readSkillLink(skillParams, selected.skills);
  } catch {
    notFound();
  }
  return (
    <ClassStudy
      key={selected.id}
      entry={{
        ...selected,
        skills: selected.skills.map((skill) => ({
          ...skill,
          terms:
            (
              termData as Record<
                string,
                Record<string, { key: string; label: string; href?: string }[]>
              >
            )[selected.slug]?.[skill.sourceKey.replace(/^talent_desc_/, '')] ??
            [],
        })),
      }}
      initialSkill={initialSkill}
      classes={studies.map(({ slug, name, image }) => ({
        slug,
        name,
        image: image.replace('.webp', '-mobile.webp'),
      }))}
    />
  );
}
