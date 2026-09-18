// Curated identities only. Shared URLs cannot inject names, artwork or targets.
export const CREATORS = {
  graxy_tv: {
    name: 'Graxy_TV',
    channel: 'https://www.twitch.tv/graxy_tv',
    discord: 'https://discord.gg/fDtXAQu5c3',
    artwork: '/creators/graxy-bookmark.webp',
  },
} as const;
export type CreatorId = keyof typeof CREATORS;
export function isCreatorId(value: string | null): value is CreatorId {
  return value !== null && Object.hasOwn(CREATORS, value);
}
