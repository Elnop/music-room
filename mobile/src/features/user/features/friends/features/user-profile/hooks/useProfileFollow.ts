import { useCallback, useState } from 'react';
import { logger } from '@/shared/logging/logger';
import { useFollowMutation } from '@/features/user/features/friends/shared/follows/hooks/useFriendsMutations';
import type { FollowStatus } from '@/features/user/features/friends/friendsTypes';
import type { ProfileFollow } from '@/features/user/features/friends/features/user-profile/userProfileTypes';

export function useProfileFollow(userId: string, followStatus: FollowStatus | null): ProfileFollow {
	const followMutation = useFollowMutation();
	const [isLoading, setIsLoading] = useState(false);

	const onToggle = useCallback(async () => {
		if (!followStatus) return;
		setIsLoading(true);
		try {
			await followMutation.mutateAsync({ userId, shouldFollow: !followStatus.isFollowing });
		} catch (err) {
			logger.error('[UserProfile] Follow toggle failed', {
				error: err,
				userId,
				isFollowing: followStatus.isFollowing,
			});
		} finally {
			setIsLoading(false);
		}
	}, [followMutation, followStatus, userId]);

	return { status: followStatus, isLoading, onToggle };
}
