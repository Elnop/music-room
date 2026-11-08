import { logger } from '@/shared/utils/logger.js';

// Lazy imports avoid a cycle with realtime; errors are only logged so they never fail the unfollow.

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
