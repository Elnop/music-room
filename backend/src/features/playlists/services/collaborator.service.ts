import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { fetchSingle } from '@/shared/utils/database.helpers.js';
import { checkOwnership } from '@/features/playlists/permissions/playlist.permissions.js';
import * as realtime from '@/realtime/emitters/playlist.emitters.js';

// Playlist collaborators (edit access in restricted mode); owner only.

export async function addCollaborator(
	playlistId: string,
	userId: string,
	collaboratorId: string
): Promise<void> {
	try {
		await checkOwnership(playlistId, userId);

		await fetchSingle<{ id: string }>(
			supabaseAdmin,
			'user_profiles',
			{ id: collaboratorId },
			'id',
			'User not found',
			'USER_NOT_FOUND'
		);

		const playlist = await fetchSingle<{ collaborator_ids: string[] | null }>(
			supabaseAdmin,
			'playlists',
			{ id: playlistId },
			'collaborator_ids',
			'Playlist not found',
			'PLAYLIST_NOT_FOUND'
		);

		if ((playlist.collaborator_ids ?? []).includes(collaboratorId)) {
			throw new AppError(409, 'User is already a collaborator', 'ALREADY_COLLABORATOR');
		}

		const { error: updateError } = await supabaseAdmin
			.from('playlists')
			.update({ collaborator_ids: [...(playlist.collaborator_ids ?? []), collaboratorId] })
			.eq('id', playlistId);

		if (updateError) throw updateError;

		logger.info('Collaborator added to playlist', { playlistId, userId, collaboratorId });
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Failed to add collaborator', { error, playlistId });
		throw new AppError(500, 'Failed to add collaborator', 'COLLABORATOR_ADD_ERROR');
	}
}

export async function removeCollaborator(
	playlistId: string,
	userId: string,
	collaboratorId: string
): Promise<void> {
	try {
		await checkOwnership(playlistId, userId);

		const playlist = await fetchSingle<{ collaborator_ids: string[] | null }>(
			supabaseAdmin,
			'playlists',
			{ id: playlistId },
			'collaborator_ids',
			'Playlist not found',
			'PLAYLIST_NOT_FOUND'
		);

		const { error: updateError } = await supabaseAdmin
			.from('playlists')
			.update({
				collaborator_ids: (playlist.collaborator_ids ?? []).filter(id => id !== collaboratorId),
			})
			.eq('id', playlistId);

		if (updateError) throw updateError;

		// Evict the removed collaborator from the playlist room (fire-and-forget).
		void realtime.revalidatePlaylistRoom(playlistId);

		logger.info('Collaborator removed from playlist', { playlistId, userId, collaboratorId });
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Failed to remove collaborator', { error, playlistId });
		throw new AppError(500, 'Failed to remove collaborator', 'COLLABORATOR_REMOVE_ERROR');
	}
}
