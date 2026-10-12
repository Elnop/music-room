import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { fetchSingle } from '@/shared/utils/database.helpers.js';
import { checkOwnership } from '@/features/playlists/permissions/playlist.permissions.js';
import { realtime } from '@/realtime/index.js';

/**
 * Service for managing playlist collaborators
 */
export class CollaboratorService {
	/**
	 * Add collaborator to playlist
	 */
	async addCollaborator(playlistId: string, userId: string, collaboratorId: string): Promise<void> {
		try {
			// Only owner can add collaborators
			await checkOwnership(playlistId, userId);

			// Verify collaborator exists
			await fetchSingle<{ id: string }>(
				supabaseAdmin,
				'user_profiles',
				{ id: collaboratorId },
				'id',
				'User not found',
				'USER_NOT_FOUND'
			);

			// Get current playlist
			const playlist = await fetchSingle<{ collaborator_ids: string[] | null }>(
				supabaseAdmin,
				'playlists',
				{ id: playlistId },
				'collaborator_ids',
				'Playlist not found',
				'PLAYLIST_NOT_FOUND'
			);

			// Check if already collaborator
			if ((playlist.collaborator_ids ?? []).includes(collaboratorId)) {
				throw new AppError(409, 'User is already a collaborator', 'ALREADY_COLLABORATOR');
			}

			// Add collaborator
			const { error: updateError } = await supabaseAdmin
				.from('playlists')
				.update({
					collaborator_ids: [...(playlist.collaborator_ids ?? []), collaboratorId],
				})
				.eq('id', playlistId);

			if (updateError) throw updateError;

			logger.info('Collaborator added to playlist', {
				playlistId,
				userId,
				collaboratorId,
			});
		} catch (error) {
			if (error instanceof AppError) throw error;
			logger.error('Failed to add collaborator', { error, playlistId });
			throw new AppError(500, 'Failed to add collaborator', 'COLLABORATOR_ADD_ERROR');
		}
	}

	/**
	 * Remove collaborator from playlist
	 */
	async removeCollaborator(
		playlistId: string,
		userId: string,
		collaboratorId: string
	): Promise<void> {
		try {
			// Only owner can remove collaborators
			await checkOwnership(playlistId, userId);

			// Get current playlist
			const playlist = await fetchSingle<{ collaborator_ids: string[] | null }>(
				supabaseAdmin,
				'playlists',
				{ id: playlistId },
				'collaborator_ids',
				'Playlist not found',
				'PLAYLIST_NOT_FOUND'
			);

			// Remove collaborator
			const { error: updateError } = await supabaseAdmin
				.from('playlists')
				.update({
					collaborator_ids: (playlist.collaborator_ids ?? []).filter(
						(id: string) => id !== collaboratorId
					),
				})
				.eq('id', playlistId);

			if (updateError) throw updateError;

			// Evict the removed collaborator from the playlist room (fire-and-forget).
			void realtime.revalidatePlaylistRoom(playlistId);

			logger.info('Collaborator removed from playlist', {
				playlistId,
				userId,
				collaboratorId,
			});
		} catch (error) {
			if (error instanceof AppError) throw error;
			logger.error('Failed to remove collaborator', { error, playlistId });
			throw new AppError(500, 'Failed to remove collaborator', 'COLLABORATOR_REMOVE_ERROR');
		}
	}
}
