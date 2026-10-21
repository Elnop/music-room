import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { FriendsService } from '@/features/friends/services/friends.service.js';
import { realtime } from '@/realtime/index.js';

const friendsService = new FriendsService();

/**
 * Music Control Service
 * Manages music control permissions between friends
 */
class MusicControlService {
	/**
	 * Grant music control permission to a friend
	 * Only works if both users are mutual friends
	 */
	async grantControl(ownerId: string, allowedUserId: string): Promise<void> {
		try {
			// Verify they are mutual friends
			const followStatus = await friendsService.getFollowStatus(ownerId, allowedUserId);

			if (!followStatus.isFriend) {
				throw new AppError(400, 'You can only grant control to mutual friends', 'NOT_FRIENDS');
			}

			// Update the follows table where allowedUserId follows ownerId
			// This is: follows(follower_id=allowedUserId, following_id=ownerId)
			// Use .select() to verify the update actually affected a row
			const { data, error } = await supabaseAdmin
				.from('follows')
				.update({ can_control_music: true })
				.eq('follower_id', allowedUserId)
				.eq('following_id', ownerId)
				.select();

			if (error) {
				logger.error('Failed to grant music control', {
					error,
					ownerId,
					allowedUserId,
				});
				throw new AppError(500, 'Failed to grant control', 'GRANT_CONTROL_ERROR');
			}

			// Verify that a row was actually updated
			if (!data || data.length === 0) {
				logger.error('No follow relationship found to update', {
					ownerId,
					allowedUserId,
				});
				throw new AppError(400, 'Follow relationship not found', 'FOLLOW_NOT_FOUND');
			}

			// Notify the allowed user in real-time
			await realtime.notifyPermissionChange(allowedUserId, ownerId, true);

			logger.info('Music control granted', { ownerId, allowedUserId });
		} catch (error) {
			if (error instanceof AppError) throw error;
			logger.error('Unexpected error granting music control', { error });
			throw new AppError(500, 'Failed to grant control', 'GRANT_CONTROL_ERROR');
		}
	}

	/**
	 * Revoke music control permission from a user
	 */
	async revokeControl(ownerId: string, allowedUserId: string): Promise<void> {
		try {
			const { data, error } = await supabaseAdmin
				.from('follows')
				.update({ can_control_music: false })
				.eq('follower_id', allowedUserId)
				.eq('following_id', ownerId)
				.select();

			if (error) {
				logger.error('Failed to revoke music control', {
					error,
					ownerId,
					allowedUserId,
				});
				throw new AppError(500, 'Failed to revoke control', 'REVOKE_CONTROL_ERROR');
			}

			// Log if no row was found (might happen if friendship was removed)
			if (!data || data.length === 0) {
				logger.warn('No follow relationship found to revoke', {
					ownerId,
					allowedUserId,
				});
			}

			// Notify the user that their permission was revoked in real-time;
			// evicts them from the listening room unless a license remains.
			await realtime.notifyPermissionChange(allowedUserId, ownerId, false);

			logger.info('Music control revoked', { ownerId, allowedUserId });
		} catch (error) {
			if (error instanceof AppError) throw error;
			logger.error('Unexpected error revoking music control', { error });
			throw new AppError(500, 'Failed to revoke control', 'REVOKE_CONTROL_ERROR');
		}
	}

	/**
	 * Get list of users that the owner has granted control to
	 */
	async getGrantedPermissions(ownerId: string): Promise<string[]> {
		try {
			const { data, error } = await supabaseAdmin
				.from('follows')
				.select('follower_id')
				.eq('following_id', ownerId)
				.eq('can_control_music', true);

			if (error) {
				logger.error('Failed to get granted permissions', { error, ownerId });
				throw new AppError(500, 'Failed to get permissions', 'GET_PERMISSIONS_ERROR');
			}

			return (data || []).map(row => row.follower_id);
		} catch (error) {
			if (error instanceof AppError) throw error;
			logger.error('Unexpected error getting granted permissions', { error });
			throw new AppError(500, 'Failed to get permissions', 'GET_PERMISSIONS_ERROR');
		}
	}

	/**
	 * Check if a user can control another user's music
	 */
	async canControl(controllerId: string, targetId: string): Promise<boolean> {
		try {
			const { data, error } = await supabaseAdmin
				.from('follows')
				.select('can_control_music')
				.eq('follower_id', controllerId)
				.eq('following_id', targetId)
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					// No row found - not following
					return false;
				}
				logger.error('Failed to check control permission', {
					error,
					controllerId,
					targetId,
				});
				return false;
			}

			return data?.can_control_music === true;
		} catch (error) {
			logger.error('Unexpected error checking control permission', { error });
			return false;
		}
	}

	/**
	 * Check if a specific user has granted control to the current user
	 * Used to determine if we should show control UI on their profile
	 */
	async hasGrantedControlToMe(targetUserId: string, myUserId: string): Promise<boolean> {
		return this.canControl(myUserId, targetUserId);
	}
}

export const musicControlService = new MusicControlService();
