import { logger } from '@/shared/utils/logger.js';
import { upsertTrack } from '@/shared/utils/track-upsert.js';
import * as realtime from '@/realtime/emitters/queue.emitters.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import * as controlAccessService from '@/features/music-control/services/control-access.service.js';
import type { DeviceCommand } from '@/features/music-control/music-control.types.js';
import { resolvePlaybackDevice } from '@/features/queue/permissions/queue.permissions.js';
import {
	getQueueRpc,
	insertBlockRpc,
	trackIdsFromRpc,
	upcomingTrackIdsRpc,
} from '@/features/queue/utils/queue-rpc.js';
import type { TransferInput } from '@/features/queue/queue.validators.js';
import type { QueueItem, TransferResult } from '@/features/queue/queue.types.js';

/**
 * Moves playback to a device of the actor or of a friend (#295). Every check
 * comes before any change: target device (license, online), source device
 * (control), and the played item (in the actor's own queue).
 */
export async function transfer(actorId: string, input: TransferInput): Promise<TransferResult> {
	const { targetUserId: ownerId, targetDeviceId: deviceId, playing, positionMs } = input;
	await resolvePlaybackDevice(actorId, ownerId, deviceId);
	await checkSource(actorId, input.source);
	const mine = await getQueueRpc(actorId);
	let item: QueueItem | undefined;
	if ('queueItemId' in playing) {
		item = mine.items.find(i => i.id === playing.queueItemId);
		if (!item) throw new AppError(404, 'Queue item not found', 'QUEUE_ITEM_NOT_FOUND');
	}

	let queue: TransferResult['queue'] = null;
	let tracks = 1;
	let command: DeviceCommand;
	if (ownerId === actorId) {
		command = item
			? { action: 'play-item', fromUserId: actorId, item, positionMs, version: mine.version }
			: trackCommand(actorId, input);
	} else {
		const trackIds = await trackIdsToInsert(actorId, input);
		const state = await insertBlockRpc(ownerId, trackIds);
		realtime.notifyQueueUpdate(ownerId, state);
		const current = state.items.find(i => i.id === state.currentItemId);
		if (!current) throw new AppError(500, 'Queue operation failed', 'QUEUE_OPERATION_ERROR');
		command = {
			action: 'play-item',
			fromUserId: actorId,
			item: current,
			positionMs,
			version: state.version,
		};
		queue = state;
		tracks = trackIds.length;
	}

	send(ownerId, deviceId, command, actorId);
	const source = input.source;
	const sourceIsTarget = source?.userId === ownerId && source.deviceId === deviceId;
	if (source && !sourceIsTarget) {
		const { userId, deviceId: sourceDevice } = source;
		send(userId, sourceDevice, { action: 'pause', fromUserId: actorId }, actorId);
	}
	logger.info('Queue transfer', {
		actorId,
		targetUserId: ownerId,
		targetDeviceId: deviceId,
		source: input.source ?? null,
		tracks,
	});
	return { ownerId, deviceId, queue };
}

async function checkSource(actorId: string, source: TransferInput['source']): Promise<void> {
	if (!source) return;
	if (!(await controlAccessService.canControlDevice(actorId, source.userId, source.deviceId))) {
		throw new AppError(403, 'Not authorized to control the source device', 'QUEUE_ACCESS_DENIED');
	}
}

function trackCommand(actorId: string, input: TransferInput): DeviceCommand {
	if (!('track' in input.playing)) throw new Error('unreachable: queueItemId handled earlier');
	const { album, albumArt, ...rest } = input.playing.track;
	return {
		action: 'play-track',
		fromUserId: actorId,
		track: { ...rest, album: album ?? null, albumArt: albumArt ?? null },
		positionMs: input.positionMs,
	};
}

/** The played track and what follows it in the actor's queue, as track ids. */
async function trackIdsToInsert(actorId: string, input: TransferInput): Promise<string[]> {
	const { playing } = input;
	if ('queueItemId' in playing) return trackIdsFromRpc(actorId, playing.queueItemId);
	const row = await upsertTrack({ ...playing.track, previewUrl: undefined });
	return [row.id, ...(await upcomingTrackIdsRpc(actorId))];
}

/** The device was online or controlled when checked; a command that fails to reach it is logged. */
function send(ownerId: string, deviceId: string, command: DeviceCommand, actorId: string): void {
	if (!realtime.sendDeviceCommand(ownerId, deviceId, command)) {
		logger.warn('Transfer command not delivered: device went offline', {
			ownerId,
			deviceId,
			actorId,
			action: command.action,
		});
	}
}
