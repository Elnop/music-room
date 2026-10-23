import { logger } from '@/shared/utils/logger.js';
import * as realtime from '@/realtime/emitters/queue.emitters.js';
import type { QueuePlayCommand } from '@/features/music-control/music-control.types.js';
import type { QueueState } from '@/features/queue/queue.types.js';

/** If the device left since it was checked, the command is dropped and logged. */
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
