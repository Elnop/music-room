import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import * as controlAccessService from '@/features/music-control/services/control-access.service.js';
import type { AppSocket } from '@/realtime/socket-auth.js';
import { controlActionSchema, INVALID_CONTROL_PAYLOAD } from '@/realtime/music-control-access.js';
import { deviceKey, deviceToSocket, getIO, socketToDevice } from '@/realtime/state.js';

/**
 * Music control handler: control:action, a play or pause sent by a
 * controller to one of the target user's devices.
 */
export function registerControlHandlers(socket: AppSocket): void {
	socket.on('control:action', async (payload: unknown) => {
		const startTime = Date.now();

		// Unknown keys (e.g. a forged fromUserId) are stripped: the sender
		// is always the socket's user.
		const parsed = controlActionSchema.safeParse(payload);
		if (!parsed.success) {
			socket.emit('control:error', INVALID_CONTROL_PAYLOAD);
			socketLogger.event('control:action', socket.id, {
				level: 'warn',
				action: 'invalid_payload',
			});
			return;
		}
		const data = parsed.data;

		const socketInfo = socketToDevice.get(socket.id);
		if (!socketInfo) {
			socketLogger.event('control:action', socket.id, {
				level: 'warn',
				action: 'unauthenticated',
			});
			return;
		}

		const { userId: controllerId } = socketInfo;

		// Checked before the device lookup: a refused controller learns
		// nothing about which devices are online.
		const canControl = await controlAccessService.canControlDevice(
			controllerId,
			data.targetUserId,
			data.targetDeviceId
		);
		if (!canControl) {
			socket.emit('control:error', {
				message: "Not authorized to control this user's music",
				code: 'NOT_AUTHORIZED',
			});
			return;
		}

		const targetSocketId = deviceToSocket.get(deviceKey(data.targetUserId, data.targetDeviceId));
		const io = getIO();

		if (targetSocketId && io) {
			io.to(targetSocketId).emit('control:command', {
				action: data.action,
				fromUserId: controllerId,
			});

			const processingTime = Date.now() - startTime;
			socketLogger.event('control:action', socket.id, {
				controllerId,
				targetUserId: data.targetUserId,
				targetDeviceId: data.targetDeviceId,
				controlAction: data.action,
				processingTime: `${processingTime}ms`,
				action: 'command_sent',
			});

			socket.emit('control:success', {
				action: data.action,
				targetUserId: data.targetUserId,
				targetDeviceId: data.targetDeviceId,
			});
		} else {
			socket.emit('control:error', {
				message: 'Target device is not online',
				code: 'DEVICE_OFFLINE',
			});
		}
	});
}
