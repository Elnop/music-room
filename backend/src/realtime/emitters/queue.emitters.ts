import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import type { QueueState } from '@/features/queue/queue.types.js';
import type { DeviceCommand } from '@/features/music-control/music-control.types.js';
import { listeningRoom } from '@/realtime/music-control-access.js';
import { deviceKey, deviceToSocket, getIO } from '@/realtime/state.js';

/** One emit to `user:<id>` and `listening:<id>`, so a socket in both rooms gets it once. */
export function notifyQueueUpdate(userId: string, state: QueueState): void {
	const io = getIO();
	if (!io) {
		socketLogger.event('queue:updated', 'N/A', {
			level: 'warn',
			userId,
			action: 'not_initialized',
		});
		return;
	}

	const rooms = [`user:${userId}`, listeningRoom(userId)];
	io.to(rooms).emit('queue:updated', state);

	socketLogger.broadcast('queue_updated', {
		userId,
		items: state.items.length,
		version: state.version,
		room: rooms.join(','),
		action: 'broadcasted',
	});
}

/** False when the device has no socket any more. */
export function sendDeviceCommand(
	ownerId: string,
	deviceId: string,
	command: DeviceCommand
): boolean {
	const socketId = deviceToSocket.get(deviceKey(ownerId, deviceId));
	const io = getIO();
	if (!socketId || !io) return false;
	io.to(socketId).emit('control:command', command);
	socketLogger.broadcast('queue_play_command', {
		ownerId,
		deviceId,
		fromUserId: command.fromUserId,
		command: command.action,
		action: 'command_sent',
	});
	return true;
}
