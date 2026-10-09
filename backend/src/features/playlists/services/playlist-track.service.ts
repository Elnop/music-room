import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { checkEditPermission } from '@/features/playlists/permissions/playlist.permissions.js';
import { formatTrackResponse } from '@/features/playlists/utils/playlist.helpers.js';
import { addTrackRpc, moveTrackRpc, removeTrackRpc } from '@/features/playlists/utils/track-rpc.js';
import { realtime } from '@/realtime/index.js';
import type {
	AddTrackDTO,
	AddTrackResult,
	MoveTrackResult,
	RemoveTrackResult,
	TrackInPlaylistResponse,
} from '@/features/playlists/playlist.types.js';
import type { MoveTrackInput } from '@/features/playlists/playlist.validators.js';

/**
 * Adds, removes and moves tracks through the atomic operations of migration 016.
 * See doc/PLAYLIST_CONCURRENCY.md.
 */
export class PlaylistTrackService {
	/**
	 * Add track to playlist
	 * Note: In 'open' edit mode, we don't track who added the track (added_by = null)
	 */
	async addTrack(playlistId: string, userId: string, track: AddTrackDTO): Promise<AddTrackResult> {
		const playlist = await checkEditPermission(playlistId, userId);

		const { data: trackRow, error } = await supabaseAdmin
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
		if (error) {
			logger.error('Failed to upsert track', { error, playlistId });
			throw new AppError(500, 'Failed to add track', 'TRACK_ADD_ERROR');
		}

		const addedBy = playlist.edit_mode === 'restricted' ? userId : null;
		const result = await addTrackRpc(playlistId, trackRow.id, addedBy);

		const added: TrackInPlaylistResponse = {
			...formatTrackResponse(trackRow),
			rank: result.rank,
			addedBy,
			addedAt: result.addedAt,
		};
		logger.info('Track added to playlist', {
			playlistId,
			trackId: trackRow.id,
			userId,
			editMode: playlist.edit_mode,
			version: result.tracksVersion,
		});
		// Old socket payload until #90 (5.5) switches to the versioned delta.
		realtime.notifyPlaylistUpdate(playlistId, 'track_added', { track: { ...added, position: 0 } });

		return { track: added, tracksVersion: result.tracksVersion, rebalanced: result.rebalanced };
	}

	/**
	 * Remove track from playlist
	 */
	async removeTrack(
		playlistId: string,
		userId: string,
		trackId: string
	): Promise<RemoveTrackResult> {
		await checkEditPermission(playlistId, userId);
		const result = await removeTrackRpc(playlistId, trackId);

		logger.info('Track removed from playlist', {
			playlistId,
			trackId,
			userId,
			version: result.tracksVersion,
		});
		realtime.notifyPlaylistUpdate(playlistId, 'track_removed', { trackId });

		return { tracksVersion: result.tracksVersion };
	}

	/**
	 * Move a track right after move.afterRank (null = top of the list)
	 */
	async moveTrack(
		playlistId: string,
		userId: string,
		trackId: string,
		move: MoveTrackInput
	): Promise<MoveTrackResult> {
		await checkEditPermission(playlistId, userId);
		const result = await moveTrackRpc(playlistId, trackId, move);

		logger.info('Track moved in playlist', {
			playlistId,
			trackId,
			userId,
			version: result.tracksVersion,
		});
		realtime.notifyPlaylistUpdate(playlistId, 'reordered');

		return {
			trackId,
			rank: result.rank,
			tracksVersion: result.tracksVersion,
			rebalanced: result.rebalanced,
		};
	}
}
