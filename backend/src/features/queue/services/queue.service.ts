import { logger } from '@/shared/utils/logger.js';
import type { TrackUpsertInput } from '@/shared/utils/track-upsert.js';
import { realtime } from '@/realtime/index.js';
import {
	canViewPlaylist,
	getPlaylistForPermissionCheck,
} from '@/features/playlists/permissions/playlist.permissions.js';
import {
	assertCanManageQueue,
	resolvePlaybackDevice,
} from '@/features/queue/permissions/queue.permissions.js';
import { sendPlayCommand } from '@/features/queue/utils/queue-play-command.js';
import { addTrackToQueue } from '@/features/queue/utils/queue-add.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import {
	getQueueRpc,
	moveQueueItemRpc,
	playPlaylistRpc,
	playQueueItemRpc,
	removeQueueItemRpc,
	stepQueueRpc,
} from '@/features/queue/utils/queue-rpc.js';
import type { QueueState, QueueStepDirection } from '@/features/queue/queue.types.js';

// The play queue of ownerId, read or changed by its owner or a delegate
// (#294), mutated only through the functions of migration 021 (serialized per
// owner). Every mutation sends the new state to all of the owner's devices as
// `queue:updated`; playback actions also tell the chosen device to play.

export async function getQueue(actorId: string, ownerId: string): Promise<QueueState> {
	await assertCanManageQueue(actorId, ownerId);
	return getQueueRpc(ownerId);
}

/** Appends the track, or with `next` places it after the current item (#316); publishes once. */
export async function addItem(
	actorId: string,
	ownerId: string,
	track: TrackUpsertInput,
	options: { next?: boolean } = {}
): Promise<QueueState> {
	await assertCanManageQueue(actorId, ownerId);
	const { state, operation } = await addTrackToQueue(ownerId, track, options.next);
	return publish(actorId, ownerId, operation, state);
}

export async function removeItem(
	actorId: string,
	ownerId: string,
	itemId: string
): Promise<QueueState> {
	await assertCanManageQueue(actorId, ownerId);
	return publish(actorId, ownerId, 'remove', await removeQueueItemRpc(ownerId, itemId));
}

export async function moveItem(
	actorId: string,
	ownerId: string,
	itemId: string,
	afterItemId: string | null
): Promise<QueueState> {
	await assertCanManageQueue(actorId, ownerId);
	const state = await moveQueueItemRpc(ownerId, itemId, afterItemId);
	return publish(actorId, ownerId, 'move', state);
}

export async function playItem(
	actorId: string,
	ownerId: string,
	itemId: string,
	deviceId?: string
): Promise<QueueState> {
	const device = await playbackDevice(actorId, ownerId, deviceId);
	const state = await playQueueItemRpc(ownerId, itemId);
	return play(actorId, ownerId, 'play', state, device);
}

/**
 * Copies the playlist's tracks into the queue as a new block right after
 * the current item and plays its first item (#277).
 */
export async function playPlaylist(
	actorId: string,
	ownerId: string,
	playlistId: string,
	deviceId?: string
): Promise<QueueState> {
	const device = await playbackDevice(actorId, ownerId, deviceId);
	// The actor chooses the playlist: its visibility is checked for them (#294).
	const playlist = await getPlaylistForPermissionCheck(playlistId);
	if (!canViewPlaylist(playlist, actorId)) {
		throw new AppError(403, 'Access denied', 'PLAYLIST_ACCESS_DENIED');
	}
	const state = await playPlaylistRpc(ownerId, playlistId);
	return play(actorId, ownerId, 'play-playlist', state, device);
}

export async function step(
	actorId: string,
	ownerId: string,
	direction: QueueStepDirection,
	deviceId?: string
): Promise<QueueState> {
	const device = await playbackDevice(actorId, ownerId, deviceId);
	const state = await stepQueueRpc(ownerId, direction);
	return play(actorId, ownerId, direction, state, device);
}

/** Access to the queue, then the device that must play: both before any change. */
async function playbackDevice(
	actorId: string,
	ownerId: string,
	deviceId: string | undefined
): Promise<string | null> {
	await assertCanManageQueue(actorId, ownerId);
	return resolvePlaybackDevice(actorId, ownerId, deviceId);
}

/** Publishes the state, then tells the target device to play its current item. */
function play(
	actorId: string,
	ownerId: string,
	operation: string,
	state: QueueState,
	deviceId: string | null
): QueueState {
	publish(actorId, ownerId, operation, state);
	if (deviceId) sendPlayCommand(actorId, ownerId, deviceId, state);
	return state;
}

function publish(
	actorId: string,
	ownerId: string,
	operation: string,
	state: QueueState
): QueueState {
	logger.info('Queue updated', {
		actorId,
		ownerId,
		operation,
		items: state.items.length,
		currentItemId: state.currentItemId,
		version: state.version,
	});
	realtime.notifyQueueUpdate(ownerId, state);
	return state;
}
