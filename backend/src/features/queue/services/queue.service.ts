import { logger } from '@/shared/utils/logger.js';
import { upsertTrack, type TrackUpsertInput } from '@/shared/utils/track-upsert.js';
import { realtime } from '@/realtime/index.js';
import {
	canViewPlaylist,
	getPlaylistForPermissionCheck,
} from '@/features/playlists/permissions/playlist.permissions.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import {
	addQueueItemRpc,
	getQueueRpc,
	moveQueueItemRpc,
	playPlaylistRpc,
	playQueueItemRpc,
	removeQueueItemRpc,
	stepQueueRpc,
} from '@/features/queue/utils/queue-rpc.js';
import type { QueueState, QueueStepDirection } from '@/features/queue/queue.types.js';

/**
 * The caller's play queue, mutated only through the functions of migration
 * 021 (serialized per user). Every mutation sends the new state to all of the
 * user's devices as `queue:updated`.
 */
export class QueueService {
	getQueue(userId: string): Promise<QueueState> {
		return getQueueRpc(userId);
	}

	async addItem(userId: string, track: TrackUpsertInput): Promise<QueueState> {
		// previewUrl is a stream URL: never persisted from a queue add.
		const trackRow = await upsertTrack({ ...track, previewUrl: undefined });
		return this.publish(userId, 'add', await addQueueItemRpc(userId, trackRow.id));
	}

	async removeItem(userId: string, itemId: string): Promise<QueueState> {
		return this.publish(userId, 'remove', await removeQueueItemRpc(userId, itemId));
	}

	async moveItem(userId: string, itemId: string, afterItemId: string | null): Promise<QueueState> {
		return this.publish(userId, 'move', await moveQueueItemRpc(userId, itemId, afterItemId));
	}

	async playItem(userId: string, itemId: string): Promise<QueueState> {
		return this.publish(userId, 'play', await playQueueItemRpc(userId, itemId));
	}

	/**
	 * Copies the playlist's tracks into the queue as a new block right after
	 * the current item and plays its first item (#277).
	 */
	async playPlaylist(userId: string, playlistId: string): Promise<QueueState> {
		const playlist = await getPlaylistForPermissionCheck(playlistId);
		if (!canViewPlaylist(playlist, userId)) {
			throw new AppError(403, 'Access denied', 'PLAYLIST_ACCESS_DENIED');
		}
		return this.publish(userId, 'play-playlist', await playPlaylistRpc(userId, playlistId));
	}

	async step(userId: string, direction: QueueStepDirection): Promise<QueueState> {
		return this.publish(userId, direction, await stepQueueRpc(userId, direction));
	}

	private publish(userId: string, operation: string, state: QueueState): QueueState {
		logger.info('Queue updated', {
			userId,
			operation,
			items: state.items.length,
			currentItemId: state.currentItemId,
		});
		realtime.notifyQueueUpdate(userId, state);
		return state;
	}
}

export const queueService = new QueueService();
