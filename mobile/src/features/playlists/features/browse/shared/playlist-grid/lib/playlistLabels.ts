import type { UserSummary } from '@/features/playlists/shared/playlist/playlistTypes';

export function ownerName(owner: UserSummary) {
	return owner.displayName || owner.username;
}

export function playlistCardLabel(name: string, owner: UserSummary | undefined) {
	return owner ? `${name}, par ${ownerName(owner)}` : name;
}
