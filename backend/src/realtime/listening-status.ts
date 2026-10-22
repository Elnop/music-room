import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import type { AppSocket } from '@/realtime/socket-auth.js';
import { createLatestThrottle } from '@/realtime/latest-throttle.js';
import { listeningRoom, type ListeningUpdatePayload } from '@/realtime/music-control-access.js';
import type { ListeningStatus, UserListeningStatus } from '@/realtime/listening.types.js';
import { getIO, listeningStatuses } from '@/realtime/state.js';

/**
 * The listening status of every connected device, and its broadcast to the
 * owner's `listening:<ownerId>` room.
 */

const LISTENING_UPDATE_THROTTLE_MS = 1000;

/** Leading + trailing throttle of listening:update, per device (#151). */
export const listeningUpdateThrottle = createLatestThrottle(LISTENING_UPDATE_THROTTLE_MS);

/** Listening status of all of a user's devices. */
export function getUserListeningStatus(userId: string): UserListeningStatus {
	const userDevices = listeningStatuses.get(userId);
	const devices = userDevices ? Array.from(userDevices.values()) : [];
	return { ownerId: userId, devices };
}

/**
 * Broadcast all devices' listening status for a user
 */
export function broadcastUserListeningStatus(userId: string): void {
	const io = getIO();
	if (!io) return;

	const room = listeningRoom(userId);
	const socketsInRoom = io.sockets.adapter.rooms.get(room);
	const subscriberCount = socketsInRoom ? socketsInRoom.size : 0;

	const userStatus = getUserListeningStatus(userId);

	socketLogger.broadcast('device_status', {
		userId,
		room,
		deviceCount: userStatus.devices.length,
		subscriberCount,
		action: 'broadcasted',
	});

	io.to(room).emit('listening:status', userStatus);
}

/**
 * Store a device's listening status and broadcast it to the user's subscribers.
 */
export function applyListeningUpdate(
	socket: AppSocket,
	userId: string,
	deviceId: string,
	data: ListeningUpdatePayload
): void {
	const startTime = Date.now();

	let userDevices = listeningStatuses.get(userId);
	if (!userDevices) {
		userDevices = new Map();
		listeningStatuses.set(userId, userDevices);
	}

	const status: ListeningStatus = {
		ownerId: userId,
		device: socket.data.device,
		track: data.track,
		isPlaying: data.isPlaying,
		positionMs: data.positionMs ?? null,
		updatedAt: new Date().toISOString(),
	};
	userDevices.set(deviceId, status);

	const processingTime = Date.now() - startTime;
	socketLogger.event('listening:update', socket.id, {
		userId,
		deviceId,
		deviceName: socket.data.device.deviceName,
		track: status.track?.title,
		isPlaying: status.isPlaying,
		processingTime: `${processingTime}ms`,
		action: 'status_updated',
	});

	broadcastUserListeningStatus(userId);
}

/** Forget a disconnected device's status, dropping the user when none is left. */
export function removeDeviceStatus(userId: string, deviceId: string): void {
	const userDevices = listeningStatuses.get(userId);
	if (userDevices) {
		userDevices.delete(deviceId);
		if (userDevices.size === 0) {
			listeningStatuses.delete(userId);
		}
	}
}
