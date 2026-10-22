import type { Playlist } from '@/features/playlists/types';

/** The playlist fields that decide who may edit its tracks. */
export type PlaylistEditFields = Pick<
	Playlist,
	'ownerId' | 'collaboratorIds' | 'viewerIds' | 'visibility' | 'editMode'
>;

/**
 * Whether `userId` may add, remove or move tracks: the owner, a collaborator,
 * or anyone who can see an `editMode: 'open'` playlist (public, or one they
 * were invited to view). Mirrors the backend's edit check.
 */
export function canEditPlaylist(
	userId: string | null | undefined,
	playlist: PlaylistEditFields | null | undefined
): boolean {
	if (!userId || !playlist) return false;
	if (playlist.ownerId === userId) return true;
	if (playlist.collaboratorIds?.includes(userId)) return true;
	if (playlist.editMode === 'open') {
		if (playlist.visibility === 'public') return true;
		if (playlist.viewerIds?.includes(userId)) return true;
	}
	return false;
}
