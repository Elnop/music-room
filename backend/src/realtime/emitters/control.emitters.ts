import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import * as controlAccessService from '@/features/music-control/services/control-access.service.js';
import { leaveListeningRoom } from '@/realtime/music-control-access.js';
import { broadcastUserListeningStatus } from '@/realtime/listening-status.js';
import { deviceKey, deviceToSocket, getIO, listeningStatuses } from '@/realtime/state.js';

/** Leaves `listening:<ownerId>` only when no device is left; a failed check evicts (fail closed). Never throws. */
export async function revalidateListeningAccess(
	controllerId: string,
	ownerId: string
): Promise<void> {
	const io = getIO();
	if (!io) return;
	if (await controlAccessService.canControlAnyDevice(controllerId, ownerId)) return;
	leaveListeningRoom(io, controllerId, ownerId);
}

export async function notifyPermissionChange(
	targetUserId: string,
	ownerId: string,
	granted: boolean
): Promise<void> {
	const io = getIO();
	if (!io) return;

	// A license may still give access to some device: re-check, not leave.
	if (!granted) await revalidateListeningAccess(targetUserId, ownerId);

	io.to(`user:${targetUserId}`).emit('permission:changed', {
		ownerId,
		targetUserId,
		canControl: granted,
	});

	socketLogger.broadcast('permission_changed', {
		ownerId,
		targetUserId,
		granted,
		room: `user:${targetUserId}`,
		action: granted ? 'granted' : 'revoked',
	});
}

/** Its socket data and listening status take the name at once; no-op when offline. */
export function setDeviceName(userId: string, deviceId: string, deviceName: string): void {
	const socketId = deviceToSocket.get(deviceKey(userId, deviceId));
	const socket = socketId ? getIO()?.sockets.sockets.get(socketId) : undefined;
	if (socket) socket.data.device = { ...socket.data.device, deviceName };

	const status = listeningStatuses.get(userId)?.get(deviceId);
	if (!status) return;
	status.device = { ...status.device, deviceName };
	broadcastUserListeningStatus(userId);
}

export function isDeviceOnline(userId: string, deviceId: string): boolean {
	return deviceToSocket.has(deviceKey(userId, deviceId));
}
