import type { UserSummary } from '@/features/playlists/types';

export const tracksLabel = (count: number) => `${count} ${count === 1 ? 'titre' : 'titres'}`;

export const ownerName = (owner: UserSummary) => owner.displayName || owner.username;

/** The owner only shows as an avatar: a screen reader still hears who made the playlist. */
export const playlistCardLabel = (name: string, owner: UserSummary | undefined) =>
	owner ? `${name}, par ${ownerName(owner)}` : name;
