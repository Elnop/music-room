import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import type { AppSocket } from '@/realtime/socket-auth.js';
import {
	broadcastUserListeningStatus,
	listeningUpdateThrottle,
	removeDeviceStatus,
} from '@/realtime/listening-status.js';
import { deviceKey, deviceToSocket, socketToDevice } from '@/realtime/state.js';

/** Identity comes from socket.data, filled by authenticateSocket. */
export function registerDevice(socket: AppSocket): void {
	const { userId, device } = socket.data;

	socketToDevice.set(socket.id, { userId, deviceId: device.deviceId });
	deviceToSocket.set(deviceKey(userId, device.deviceId), socket.id);

	void socket.join(`user:${userId}`);

	socketLogger.auth('register', userId, socket.id, {
		deviceId: device.deviceId,
		deviceName: device.deviceName,
		action: 'device_registered',
	});
}

export function handleDisconnect(socket: AppSocket): void {
	const socketInfo = socketToDevice.get(socket.id);
	if (socketInfo) {
		const { userId, deviceId } = socketInfo;
		const key = deviceKey(userId, deviceId);

		socketToDevice.delete(socket.id);

		// The device reconnected on a newer socket: leave its state to that socket.
		if (deviceToSocket.get(key) !== socket.id) return;

		removeDeviceStatus(userId, deviceId);

		listeningUpdateThrottle.cancel(key);

		broadcastUserListeningStatus(userId);

		deviceToSocket.delete(key);

		socketLogger.event('device:cleanup', socket.id, {
			userId,
			deviceId,
			action: 'cleaned_up',
		});
	}
}
