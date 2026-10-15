import { controlAccessService } from '@/features/music-control/services/control-access.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { realtime } from '@/realtime/index.js';

/**
 * Who may act on a play queue (#294, subject IV.2.2). The owner, and any friend
 * who may control at least one of the owner's devices (control-access.service.ts),
 * manage the whole queue. An action that changes what plays targets a device:
 * the actor needs control of that device, and it must be online, checked before
 * the queue changes.
 */

const accessDenied = () =>
	new AppError(403, "Not authorized to manage this user's queue", 'QUEUE_ACCESS_DENIED');

/** Throws 403 QUEUE_ACCESS_DENIED unless actorId may manage ownerId's queue. */
export async function assertCanManageQueue(actorId: string, ownerId: string): Promise<void> {
	if (actorId === ownerId) return;
	if (!(await controlAccessService.canControlAnyDevice(actorId, ownerId))) throw accessDenied();
}

/**
 * The owner's device that must play after a playback action, or null when the
 * owner acts from the device that plays (no deviceId). A delegate must name a
 * device it controls; the device must be online.
 */
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
