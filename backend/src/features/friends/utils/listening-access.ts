import { logger } from '@/shared/utils/logger.js';

/**
 * Re-check controllerId's access to ownerId's devices and evict its sockets
 * from the owner's listening room when none is left (see
 * realtime.revalidateListeningAccess). Imported lazily so that loading the
 * friends feature does not load the Socket.io server, and so that no import
 * cycle forms if realtime/index.ts ever imports a service that builds a
 * FriendsService at load time. Never throws: eviction must not fail the
 * unfollow or the revoke.
 */
export async function revalidateListeningAccess(
	controllerId: string,
	ownerId: string
): Promise<void> {
	try {
		const { realtime } = await import('@/realtime/index.js');
		await realtime.revalidateListeningAccess(controllerId, ownerId);
	} catch (error) {
		logger.error('Failed to revalidate listening access', { error, controllerId, ownerId });
	}
}

/**
 * Tell controllerId that its access to ownerId's devices changed
 * (`permission:changed`, `canControl` = whether at least one device remains
 * controllable) and, when none remains, evict it from the owner's listening
 * room (see realtime.notifyPermissionChange). Lazy import and never throws,
 * like revalidateListeningAccess.
 */
export async function notifyListeningAccessChange(
	controllerId: string,
	ownerId: string,
	canControl: boolean
): Promise<void> {
	try {
		const { realtime } = await import('@/realtime/index.js');
		await realtime.notifyPermissionChange(controllerId, ownerId, canControl);
	} catch (error) {
		logger.error('Failed to notify listening access change', { error, controllerId, ownerId });
	}
}
