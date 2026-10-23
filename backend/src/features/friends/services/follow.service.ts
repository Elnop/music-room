import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { deleteRecords } from '@/shared/utils/database.helpers.js';
import { failUnexpected } from '@/shared/utils/fail-unexpected.js';
import * as followStatusService from '@/features/friends/services/follow-status.service.js';
import { revalidateListeningAccess } from '@/features/friends/utils/listening-access.js';
import type { FollowActionResponse } from '@/features/friends/friends.types.js';

/** 400 SELF_FOLLOW_ERROR on oneself, 404 USER_NOT_FOUND for an unknown user; following twice is a no-op. */
export function followUser(
	currentUserId: string,
	targetUserId: string
): Promise<FollowActionResponse> {
	return failUnexpected(
		async () => {
			if (currentUserId === targetUserId) {
				throw new AppError(400, 'Cannot follow yourself', 'SELF_FOLLOW_ERROR');
			}

			const { data: targetUser, error: userError } = await supabaseAdmin
				.from('user_profiles')
				.select('id')
				.eq('id', targetUserId)
				.maybeSingle();
			if (userError || !targetUser) {
				throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
			}

			const { error: insertError } = await supabaseAdmin
				.from('follows')
				.insert({ follower_id: currentUserId, following_id: targetUserId });
			if (insertError) {
				if (insertError.code !== '23505') {
					logger.error('Failed to follow user', { error: insertError });
					throw new AppError(500, 'Failed to follow user', 'FOLLOW_ERROR');
				}
				logger.info('Already following user', { currentUserId, targetUserId });
			}

			const status = await followStatusService.getFollowStatus(currentUserId, targetUserId);
			return { success: true, status };
		},
		'Unexpected error following user',
		'Failed to follow user',
		'FOLLOW_ERROR'
	);
}

/** Not following is a no-op. */
export function unfollowUser(
	currentUserId: string,
	targetUserId: string
): Promise<FollowActionResponse> {
	return failUnexpected(
		async () => {
			await deleteRecords(
				supabaseAdmin,
				'follows',
				{ follower_id: currentUserId, following_id: targetUserId },
				'Failed to unfollow user',
				'UNFOLLOW_ERROR'
			);

			// Control requires mutual friends: neither side may keep receiving
			// the other's listening status.
			await Promise.all([
				revalidateListeningAccess(currentUserId, targetUserId),
				revalidateListeningAccess(targetUserId, currentUserId),
			]);

			const status = await followStatusService.getFollowStatus(currentUserId, targetUserId);
			return { success: true, status };
		},
		'Unexpected error unfollowing user',
		'Failed to unfollow user',
		'UNFOLLOW_ERROR'
	);
}
