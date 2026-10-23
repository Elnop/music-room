import { logger } from '@/shared/utils/logger.js';
import type { TrackUpsertInput } from '@/shared/utils/track-upsert.js';
import * as realtime from '@/realtime/emitters/queue.emitters.js';
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

// Mutated only through the SQL functions (serialized per owner); every mutation sends
// `queue:updated` to all of the owner's devices.

export async function getQueue(actorId: string, ownerId: string): Promise<QueueState> {
	await assertCanManageQueue(actorId, ownerId);
	return getQueueRpc(ownerId);
}

/** With `next`, places the track after the current item; publishes once. */
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

/** Copies the playlist's tracks as a new block right after the current item and plays `startTrackId`, or the first. */
export async function playPlaylist(
	actorId: string,
	ownerId: string,
	playlistId: string,
	deviceId?: string,
	startTrackId?: string
): Promise<QueueState> {
	const device = await playbackDevice(actorId, ownerId, deviceId);
	// The actor chooses the playlist: its visibility is checked for them.
	const playlist = await getPlaylistForPermissionCheck(playlistId);
	if (!canViewPlaylist(playlist, actorId)) {
		throw new AppError(403, 'Access denied', 'PLAYLIST_ACCESS_DENIED');
	}
	const state = await playPlaylistRpc(ownerId, playlistId, startTrackId);
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
