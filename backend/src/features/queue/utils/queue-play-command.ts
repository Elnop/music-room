import { logger } from '@/shared/utils/logger.js';
import { realtime } from '@/realtime/index.js';
import type { QueuePlayCommand } from '@/features/music-control/music-control.types.js';
import type { QueueState } from '@/features/queue/queue.types.js';

/**
 * Tells the owner's device to play the queue's current item (#294). The device
 * was online when checked; if it left since, the command is dropped and logged.
 */
export function sendPlayCommand(
	actorId: string,
	ownerId: string,
	deviceId: string,
	state: QueueState
): void {
	const item = state.items.find(i => i.id === state.currentItemId);
	if (!item) return;
	const command: QueuePlayCommand = {
		action: 'play-item',
		fromUserId: actorId,
		item,
		positionMs: 0,
		version: state.version,
	};
	if (!realtime.sendDeviceCommand(ownerId, deviceId, command)) {
		logger.warn('Queue play command not delivered: device went offline', {
			ownerId,
			deviceId,
			actorId,
		});
	}
}
