import * as controlAccessService from '@/features/music-control/services/control-access.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import * as realtime from '@/realtime/emitters/control.emitters.js';

const accessDenied = () =>
	new AppError(403, "Not authorized to manage this user's queue", 'QUEUE_ACCESS_DENIED');

export async function assertCanManageQueue(actorId: string, ownerId: string): Promise<void> {
	if (actorId === ownerId) return;
	if (!(await controlAccessService.canControlAnyDevice(actorId, ownerId))) throw accessDenied();
}

/** Null: the owner plays on the device it acts from. */
export async function resolvePlaybackDevice(
	actorId: string,
	ownerId: string,
	deviceId: string | undefined
): Promise<string | null> {
	if (deviceId === undefined) {
		if (actorId === ownerId) return null;
		throw new AppError(400, 'A delegate must name the device to play on', 'DEVICE_ID_REQUIRED');
	}
	if (!(await controlAccessService.canControlDevice(actorId, ownerId, deviceId))) {
		throw accessDenied();
	}
	if (!realtime.isDeviceOnline(ownerId, deviceId)) {
		throw new AppError(409, 'Target device is not online', 'DEVICE_OFFLINE');
	}
	return deviceId;
}
