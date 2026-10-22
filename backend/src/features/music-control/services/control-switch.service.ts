import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { FriendsService } from '@/features/friends/services/friends.service.js';
import { realtime } from '@/realtime/index.js';

// The "all my devices" switch (`follows(friend → owner).can_control_music`):
// the owner lets a mutual friend control all of their devices.

const friendsService = new FriendsService();

/** Runs `work`; an error that is not an AppError is logged and answered as a 500 `code`. */
async function failUnexpected(
	work: () => Promise<void>,
	log: string,
	message: string,
	code: string
): Promise<void> {
	try {
		await work();
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error(log, { error });
		throw new AppError(500, message, code);
	}
}

/** Sets the switch on `follows(allowedUserId → ownerId)`; `.select()` returns the rows updated. */
function setControl(ownerId: string, allowedUserId: string, canControl: boolean) {
	return supabaseAdmin
		.from('follows')
		.update({ can_control_music: canControl })
		.eq('follower_id', allowedUserId)
		.eq('following_id', ownerId)
		.select();
}

/**
 * Turns the switch on for a friend. Only works if both users are mutual
 * friends (400 NOT_FRIENDS) and the friend follows the owner (400 FOLLOW_NOT_FOUND).
 */
export function grantControl(ownerId: string, allowedUserId: string): Promise<void> {
	return failUnexpected(
		async () => {
			const followStatus = await friendsService.getFollowStatus(ownerId, allowedUserId);
			if (!followStatus.isFriend) {
				throw new AppError(400, 'You can only grant control to mutual friends', 'NOT_FRIENDS');
			}

			const { data, error } = await setControl(ownerId, allowedUserId, true);
			if (error) {
				logger.error('Failed to grant music control', { error, ownerId, allowedUserId });
				throw new AppError(500, 'Failed to grant control', 'GRANT_CONTROL_ERROR');
			}
			if (!data || data.length === 0) {
				logger.error('No follow relationship found to update', { ownerId, allowedUserId });
				throw new AppError(400, 'Follow relationship not found', 'FOLLOW_NOT_FOUND');
			}

			await realtime.notifyPermissionChange(allowedUserId, ownerId, true);
			logger.info('Music control granted', { ownerId, allowedUserId });
		},
		'Unexpected error granting music control',
		'Failed to grant control',
		'GRANT_CONTROL_ERROR'
	);
}

/** Turns the switch off for a user. No row (friendship removed) is only logged. */
export function revokeControl(ownerId: string, allowedUserId: string): Promise<void> {
	return failUnexpected(
		async () => {
			const { data, error } = await setControl(ownerId, allowedUserId, false);
			if (error) {
				logger.error('Failed to revoke music control', { error, ownerId, allowedUserId });
				throw new AppError(500, 'Failed to revoke control', 'REVOKE_CONTROL_ERROR');
			}
			if (!data || data.length === 0) {
				logger.warn('No follow relationship found to revoke', { ownerId, allowedUserId });
			}

			// Evicts them from the listening room unless a license remains.
			await realtime.notifyPermissionChange(allowedUserId, ownerId, false);
			logger.info('Music control revoked', { ownerId, allowedUserId });
		},
		'Unexpected error revoking music control',
		'Failed to revoke control',
		'REVOKE_CONTROL_ERROR'
	);
}
