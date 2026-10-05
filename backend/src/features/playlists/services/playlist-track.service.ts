import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { deleteRecords } from '@/shared/utils/database.helpers.js';
import { checkEditPermission } from '@/features/playlists/permissions/playlist.permissions.js';
import { reindexPositions } from '@/features/playlists/utils/playlist.helpers.js';
import { realtime } from '@/realtime/index.js';
import type { AddTrackDTO } from '@/features/playlists/playlist.types.js';

/**
 * Service for managing tracks in playlists
 */
export class PlaylistTrackService {
	/**
	 * Add track to playlist
	 * Note: In 'open' edit mode, we don't track who added the track (added_by = null)
	 */
	async addTrack(playlistId: string, userId: string, track: AddTrackDTO): Promise<void> {
		try {
			// Check edit permissions (unified approach)
			const playlist = await checkEditPermission(playlistId, userId);

			// Upsert track (insert if not exists, return existing if duplicate track_uri)
			const { data: trackData, error: trackError } = await supabaseAdmin
				.from('tracks')
				.upsert(
					{
						track_uri: track.trackUri,
						title: track.title,
						artist: track.artist,
						album: track.album,
						album_art: track.albumArt,
						duration_ms: track.durationMs,
						preview_url: track.previewUrl,
					},
					{ onConflict: 'track_uri' }
				)
				.select()
				.single();

			if (trackError) throw trackError;

			// Get next position using RPC function
			const { data: maxPos } = await supabaseAdmin.rpc('get_next_playlist_position', {
				p_playlist_id: playlistId,
			});

			const nextPosition = maxPos ?? 0;

			const addedBy = playlist.edit_mode === 'restricted' ? userId : null;

			// Add to playlist_tracks
			const { error: addError } = await supabaseAdmin.from('playlist_tracks').insert({
				playlist_id: playlistId,
				track_id: trackData.id,
				position: nextPosition,
				added_by: addedBy,
			});

			if (addError) {
				// Check if duplicate track (unique constraint violation)
				if (addError.code === '23505') {
					throw new AppError(409, 'Track already in playlist', 'TRACK_DUPLICATE');
				}
				throw addError;
			}

			logger.info('Track added to playlist', {
				playlistId,
				trackId: trackData.id,
				userId,
				editMode: playlist.edit_mode,
			});

			const now = new Date().toISOString();
			realtime.notifyPlaylistUpdate(playlistId, 'track_added', {
				track: {
					id: trackData.id,
					trackUri: trackData.track_uri,
					title: trackData.title,
					artist: trackData.artist,
					album: trackData.album ?? undefined,
					albumArt: trackData.album_art ?? undefined,
					durationMs: trackData.duration_ms,
					previewUrl: trackData.preview_url ?? undefined,
					createdAt: trackData.created_at ?? new Date().toISOString(),
					updatedAt: trackData.updated_at ?? new Date().toISOString(),
					position: nextPosition,
					addedBy: addedBy,
					addedAt: now,
				},
			});
		} catch (error) {
			if (error instanceof AppError) throw error;
			logger.error('Failed to add track', { error, playlistId });
			throw new AppError(500, 'Failed to add track', 'TRACK_ADD_ERROR');
		}
	}

	/**
	 * Remove track from playlist
	 */
	async removeTrack(playlistId: string, userId: string, trackId: string): Promise<void> {
		try {
			// Check permission (owner or collaborator)
			await checkEditPermission(playlistId, userId);

			await deleteRecords(
				supabaseAdmin,
				'playlist_tracks',
				{ playlist_id: playlistId, track_id: trackId },
				'Failed to remove track',
				'TRACK_REMOVE_ERROR'
			);

			// Re-index positions (close gaps)
			await reindexPositions(playlistId);

			logger.info('Track removed from playlist', {
				playlistId,
				trackId,
				userId,
			});

			realtime.notifyPlaylistUpdate(playlistId, 'track_removed', { trackId });
		} catch (error) {
			if (error instanceof AppError) throw error;
			logger.error('Failed to remove track', { error, playlistId, trackId });
			throw new AppError(500, 'Failed to remove track', 'TRACK_REMOVE_ERROR');
		}
	}

	/**
	 * Reorder tracks in playlist
	 */
	async reorderTracks(playlistId: string, userId: string, trackIds: string[]): Promise<void> {
		try {
			// Check permission (owner or collaborator)
			await checkEditPermission(playlistId, userId);

			// Verify all tracks belong to playlist
			const { data: existingTracks, error: fetchError } = await supabaseAdmin
				.from('playlist_tracks')
				.select('track_id')
				.eq('playlist_id', playlistId);

			if (fetchError) throw fetchError;

			const existingIds = new Set(existingTracks.map(t => t.track_id));
			const allExist = trackIds.every(id => existingIds.has(id));

			if (!allExist || trackIds.length !== existingIds.size) {
				throw new AppError(400, 'Invalid track IDs for reordering', 'INVALID_TRACK_IDS');
			}

			// Delete and re-insert with new positions
			const { error: deleteError } = await supabaseAdmin
				.from('playlist_tracks')
				.delete()
				.eq('playlist_id', playlistId);

			if (deleteError) throw deleteError;

			const inserts = trackIds.map((trackId, index) => ({
				playlist_id: playlistId,
				track_id: trackId,
				position: index,
				added_by: userId,
			}));

			const { error: insertError } = await supabaseAdmin.from('playlist_tracks').insert(inserts);

			if (insertError) throw insertError;

			logger.info('Playlist tracks reordered', { playlistId, userId });

			realtime.notifyPlaylistUpdate(playlistId, 'reordered');
		} catch (error) {
			if (error instanceof AppError) throw error;
			logger.error('Failed to reorder tracks', { error, playlistId });
			throw new AppError(500, 'Failed to reorder tracks', 'TRACK_REORDER_ERROR');
		}
	}
}
