import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { fetchSingle } from '@/shared/utils/database.helpers.js';
import { checkOwnership } from '@/features/playlists/permissions/playlist.permissions.js';
import { realtime } from '@/realtime/index.js';

// Playlist viewers (read access to a private playlist); owner only.

/** Adds a viewer; the owner and collaborators cannot be added. */
export async function addViewer(
	playlistId: string,
	userId: string,
	viewerId: string
): Promise<void> {
	try {
		await checkOwnership(playlistId, userId);

		await fetchSingle<{ id: string }>(
			supabaseAdmin,
			'user_profiles',
			{ id: viewerId },
			'id',
			'User not found',
			'USER_NOT_FOUND'
		);

		const playlist = await fetchSingle<{
			viewer_ids: string[] | null;
			collaborator_ids: string[] | null;
			owner_id: string;
		}>(
			supabaseAdmin,
			'playlists',
			{ id: playlistId },
			'viewer_ids, collaborator_ids, owner_id',
			'Playlist not found',
			'PLAYLIST_NOT_FOUND'
		);

		if (playlist.owner_id === viewerId) {
			throw new AppError(400, 'Owner cannot be added as viewer', 'OWNER_CANNOT_BE_VIEWER');
		}

		// Editors don't need viewer access.
		if ((playlist.collaborator_ids ?? []).includes(viewerId)) {
			throw new AppError(
				409,
				'User is already a collaborator with edit access',
				'ALREADY_COLLABORATOR'
			);
		}

		if ((playlist.viewer_ids ?? []).includes(viewerId)) {
			throw new AppError(409, 'User is already a viewer', 'ALREADY_VIEWER');
		}

		const { error: updateError } = await supabaseAdmin
			.from('playlists')
			.update({ viewer_ids: [...(playlist.viewer_ids ?? []), viewerId] })
			.eq('id', playlistId);

		if (updateError) throw updateError;

		logger.info('Viewer added to playlist', { playlistId, userId, viewerId });
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Failed to add viewer', { error, playlistId });
		throw new AppError(500, 'Failed to add viewer', 'VIEWER_ADD_ERROR');
	}
}

export async function removeViewer(
	playlistId: string,
	userId: string,
	viewerId: string
): Promise<void> {
	try {
		await checkOwnership(playlistId, userId);

		const playlist = await fetchSingle<{ viewer_ids: string[] | null }>(
			supabaseAdmin,
			'playlists',
			{ id: playlistId },
			'viewer_ids',
			'Playlist not found',
			'PLAYLIST_NOT_FOUND'
		);

		const { error: updateError } = await supabaseAdmin
			.from('playlists')
			.update({ viewer_ids: (playlist.viewer_ids ?? []).filter(id => id !== viewerId) })
			.eq('id', playlistId);

		if (updateError) throw updateError;

		// Evict the removed viewer from the playlist room (fire-and-forget).
		void realtime.revalidatePlaylistRoom(playlistId);

		logger.info('Viewer removed from playlist', { playlistId, userId, viewerId });
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Failed to remove viewer', { error, playlistId });
		throw new AppError(500, 'Failed to remove viewer', 'VIEWER_REMOVE_ERROR');
	}
}
