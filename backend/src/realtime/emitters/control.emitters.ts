import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import * as controlAccessService from '@/features/music-control/services/control-access.service.js';
import { leaveListeningRoom } from '@/realtime/music-control-access.js';
import { broadcastUserListeningStatus } from '@/realtime/listening-status.js';
import { deviceKey, deviceToSocket, getIO, listeningStatuses } from '@/realtime/state.js';

/**
 * What the music-control and friends features ask of the Socket.io server:
 * device presence and names, and the effects of a control access change.
 */

/**
 * Re-check `controllerId`'s access to `ownerId`'s devices after a change
 * (switch or license revoked, unfollow) and make its sockets leave
 * `listening:<ownerId>` only when no device is left. A failed check
 * evicts (fail closed). Never throws; no-op before initialize.
 */
export async function revalidateListeningAccess(
	controllerId: string,
	ownerId: string
): Promise<void> {
	const io = getIO();
	if (!io) return;
	if (await controlAccessService.canControlAnyDevice(controllerId, ownerId)) return;
	leaveListeningRoom(io, controllerId, ownerId);
}

/**
 * Notify a user that their music control permission has changed
 * Called when someone grants or revokes control to them
 */
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

/**
 * Give a connected device the name its owner just chose (#352): its socket
 * data and its listening status take it at once, and the owner's listeners
 * get the status again. No-op when offline.
 */
export function setDeviceName(userId: string, deviceId: string, deviceName: string): void {
	const socketId = deviceToSocket.get(deviceKey(userId, deviceId));
	const socket = socketId ? getIO()?.sockets.sockets.get(socketId) : undefined;
	if (socket) socket.data.device = { ...socket.data.device, deviceName };

	const status = listeningStatuses.get(userId)?.get(deviceId);
	if (!status) return;
	status.device = { ...status.device, deviceName };
	broadcastUserListeningStatus(userId);
}

/** Whether a device of userId has a connected socket (#294). */
export function isDeviceOnline(userId: string, deviceId: string): boolean {
	return deviceToSocket.has(deviceKey(userId, deviceId));
}
