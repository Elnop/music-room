import { logger } from '@/shared/utils/logger.js';

/** Lazy import keeps Socket.io out of the friends feature and avoids a cycle; never throws, so eviction cannot fail the unfollow. */
export async function revalidateListeningAccess(
	controllerId: string,
	ownerId: string
): Promise<void> {
	try {
		const realtime = await import('@/realtime/emitters/control.emitters.js');
		await realtime.revalidateListeningAccess(controllerId, ownerId);
	} catch (error) {
		logger.error('Failed to revalidate listening access', { error, controllerId, ownerId });
	}
}

/** Emits `permission:changed` to controllerId and evicts it once no owner device stays controllable; same lazy import, never throws. */
export async function notifyListeningAccessChange(
	controllerId: string,
	ownerId: string,
	canControl: boolean
): Promise<void> {
	try {
		const realtime = await import('@/realtime/emitters/control.emitters.js');
		await realtime.notifyPermissionChange(controllerId, ownerId, canControl);
	} catch (error) {
		logger.error('Failed to notify listening access change', { error, controllerId, ownerId });
	}
}
