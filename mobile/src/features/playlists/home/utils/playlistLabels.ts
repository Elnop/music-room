import type { UserSummary } from '@/features/playlists/types';

export const ownerName = (owner: UserSummary) => owner.displayName || owner.username;

export const playlistCardLabel = (name: string, owner: UserSummary | undefined) =>
	owner ? `${name}, par ${ownerName(owner)}` : name;
