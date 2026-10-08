import { logger } from '@/shared/utils/logger.js';

/**
 * Evict the controller's sockets from the owner's listening room. Imported
 * lazily: realtime/index.ts imports music-control.service.ts, which builds a
 * FriendsService at load time, so a static import would form a cycle. Never
 * throws: eviction must not fail the unfollow.
 */
export async function revokeListeningAccess(controllerId: string, ownerId: string): Promise<void> {
	try {
		const { realtime } = await import('@/realtime/index.js');
		realtime.revokeListeningAccess(controllerId, ownerId);
	} catch (error) {
		logger.error('Failed to revoke listening access after unfollow', {
			error,
			controllerId,
			ownerId,
		});
	}
}
