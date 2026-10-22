import { logger } from '@/shared/utils/logger.js';
import { upsertTrack, type TrackUpsertInput } from '@/shared/utils/track-upsert.js';
import { checkEditPermission } from '@/features/playlists/permissions/playlist.permissions.js';
import { formatTrackResponse } from '@/features/playlists/utils/playlist.helpers.js';
import { addTrackRpc, moveTrackRpc, removeTrackRpc } from '@/features/playlists/utils/track-rpc.js';
import { realtime } from '@/realtime/index.js';
import { queueSyncService } from '@/features/queue/services/queue-sync.service.js';
import type {
	AddTrackResult,
	MoveTrackResult,
	RemoveTrackResult,
	TrackInPlaylistResponse,
} from '@/features/playlists/playlist.types.js';
import type { MoveTrackInput } from '@/features/playlists/playlist.validators.js';

// Adds, removes and moves tracks through the atomic operations of migration 016.
// See doc/PLAYLIST_CONCURRENCY.md. Each change is then mirrored in the queue
// blocks of the playlist (#278); a sync failure never fails the operation.

/** In 'open' edit mode, the adder is not recorded (added_by = null). */
export async function addTrack(
	playlistId: string,
	userId: string,
	track: TrackUpsertInput
): Promise<AddTrackResult> {
	const playlist = await checkEditPermission(playlistId, userId);

	const trackRow = await upsertTrack(track);

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
	realtime.notifyPlaylistUpdate({
		playlistId,
		tracksVersion: result.tracksVersion,
		rebalanced: result.rebalanced,
		event: 'track_added',
		track: added,
	});
	await queueSyncService.syncPlaylistChange('added', playlistId, trackRow.id);

	return { track: added, tracksVersion: result.tracksVersion, rebalanced: result.rebalanced };
}

export async function removeTrack(
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
	realtime.notifyPlaylistUpdate({
		playlistId,
		tracksVersion: result.tracksVersion,
		rebalanced: false,
		event: 'track_removed',
		trackId,
	});
	await queueSyncService.syncPlaylistChange('removed', playlistId, trackId);

	return { tracksVersion: result.tracksVersion };
}

/** Moves a track right after move.afterRank (null = top of the list). */
export async function moveTrack(
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
	realtime.notifyPlaylistUpdate({
		playlistId,
		tracksVersion: result.tracksVersion,
		rebalanced: result.rebalanced,
		event: 'track_moved',
		trackId,
		rank: result.rank,
	});
	await queueSyncService.syncPlaylistChange('moved', playlistId, trackId);

	return {
		trackId,
		rank: result.rank,
		tracksVersion: result.tracksVersion,
		rebalanced: result.rebalanced,
	};
}
