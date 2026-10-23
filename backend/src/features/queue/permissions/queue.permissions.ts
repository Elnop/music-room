import * as controlAccessService from '@/features/music-control/services/control-access.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import * as realtime from '@/realtime/emitters/control.emitters.js';

// The owner and any friend who may control one of the owner's devices manage the whole queue; an action
// that changes what plays needs control of the target device, online, checked before the queue changes.

const accessDenied = () =>
	new AppError(403, "Not authorized to manage this user's queue", 'QUEUE_ACCESS_DENIED');

export async function assertCanManageQueue(actorId: string, ownerId: string): Promise<void> {
	if (actorId === ownerId) return;
	if (!(await controlAccessService.canControlAnyDevice(actorId, ownerId))) throw accessDenied();
}

/** Null when the owner acts from the device that plays; a delegate must name an online device it controls. */
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
