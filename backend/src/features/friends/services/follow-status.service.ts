import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { failUnexpected } from '@/shared/utils/fail-unexpected.js';
import type { FollowStatus, FriendStats } from '@/features/friends/friends.types.js';

function followRow(followerId: string, followingId: string) {
	return supabaseAdmin
		.from('follows')
		.select('follower_id')
		.eq('follower_id', followerId)
		.eq('following_id', followingId)
		.maybeSingle();
}

function countFollows(column: 'follower_id' | 'following_id', userId: string) {
	return supabaseAdmin
		.from('follows')
		.select('*', { count: 'exact', head: true })
		.eq(column, userId);
}

export function getFollowStatus(
	currentUserId: string,
	targetUserId: string
): Promise<FollowStatus> {
	return failUnexpected(
		async () => {
			const [following, followedBy, followers, followingCount] = await Promise.all([
				followRow(currentUserId, targetUserId),
				followRow(targetUserId, currentUserId),
				countFollows('following_id', targetUserId),
				countFollows('follower_id', targetUserId),
			]);

			if (following.error) {
				logger.error('Failed to check following status', { error: following.error });
				throw new AppError(500, 'Failed to get follow status', 'FOLLOW_STATUS_ERROR');
			}
			if (followedBy.error) {
				logger.error('Failed to check followed by status', { error: followedBy.error });
				throw new AppError(500, 'Failed to get follow status', 'FOLLOW_STATUS_ERROR');
			}

			const isFollowing = !!following.data;
			const isFollowedBy = !!followedBy.data;
			return {
				isFollowing,
				isFollowedBy,
				isFriend: isFollowing && isFollowedBy,
				followersCount: followers.count || 0,
				followingCount: followingCount.count || 0,
			};
		},
		'Unexpected error getting follow status',
		'Failed to get follow status',
		'FOLLOW_STATUS_ERROR'
	);
}

export function getMyStats(userId: string): Promise<FriendStats> {
	return failUnexpected(
		async () => {
			const [followers, following] = await Promise.all([
				countFollows('following_id', userId),
				countFollows('follower_id', userId),
			]);
			return { followersCount: followers.count || 0, followingCount: following.count || 0 };
		},
		'Unexpected error getting my stats',
		'Failed to get stats',
		'STATS_ERROR'
	);
}
