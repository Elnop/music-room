import type { PlaylistEditFields } from '@/features/playlists/features/editor/shared/permissions/playlistPermissionsTypes';

export function canEditPlaylist(
	userId: string | null | undefined,
	playlist: PlaylistEditFields | null | undefined,
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
