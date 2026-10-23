import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import type { PlaylistRow } from '@/features/playlists/playlist.types.js';

// View: public = everyone, private = owner, viewers and collaborators.
// Edit: owner and collaborators always; in 'open' mode, anyone who can view.

export function canViewPlaylist(playlist: PlaylistRow, userId: string): boolean {
	return (
		playlist.visibility === 'public' ||
		playlist.owner_id === userId ||
		(playlist.collaborator_ids ?? []).includes(userId) ||
		(playlist.viewer_ids ?? []).includes(userId)
	);
}

export function canEditPlaylist(playlist: PlaylistRow, userId: string): boolean {
	if (playlist.owner_id === userId) {
		return true;
	}

	if ((playlist.collaborator_ids ?? []).includes(userId)) {
		return true;
	}

	if (playlist.edit_mode === 'open') {
		return canViewPlaylist(playlist, userId);
	}

	return false;
}

export async function checkOwnership(playlistId: string, userId: string): Promise<void> {
	const { data: playlist, error } = await supabaseAdmin
		.from('playlists')
		.select('owner_id')
		.eq('id', playlistId)
		.single();

	if (error || !playlist) {
		throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
	}

	if (playlist.owner_id !== userId) {
		throw new AppError(403, 'Access denied', 'PLAYLIST_ACCESS_DENIED');
	}
}

export async function checkEditPermission(
	playlistId: string,
	userId: string
): Promise<Pick<PlaylistRow, 'edit_mode'>> {
	const { data: playlist, error } = await supabaseAdmin
		.from('playlists')
		.select('owner_id, collaborator_ids, viewer_ids, visibility, edit_mode')
		.eq('id', playlistId)
		.single();

	if (error || !playlist) {
		throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
	}

	if (!canEditPlaylist(playlist as PlaylistRow, userId)) {
		throw new AppError(403, 'Access denied', 'PLAYLIST_ACCESS_DENIED');
	}

	return { edit_mode: playlist.edit_mode };
}

export async function getPlaylistForPermissionCheck(playlistId: string): Promise<PlaylistRow> {
	const { data: playlist, error } = await supabaseAdmin
		.from('playlists')
		.select('*')
		.eq('id', playlistId)
		.single();

	if (error || !playlist) {
		throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
	}

	return playlist;
}
