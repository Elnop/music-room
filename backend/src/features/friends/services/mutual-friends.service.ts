import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { failUnexpected } from '@/shared/utils/fail-unexpected.js';
import type { Friend } from '@/features/friends/friends.types.js';

function friendsError(log: string, error: unknown): AppError {
	logger.error(log, { error });
	return new AppError(500, 'Failed to get friends', 'FRIENDS_ERROR');
}

/** The users `userId` follows who follow back, with their public profile. */
export function getMutualFriends(userId: string): Promise<Friend[]> {
	return failUnexpected(
		async () => {
			const { data: following, error: followingError } = await supabaseAdmin
				.from('follows')
				.select('following_id')
				.eq('follower_id', userId);
			if (followingError) throw friendsError('Failed to get following list', followingError);
			if (!following || following.length === 0) return [];

			const { data: mutualFollows, error: mutualError } = await supabaseAdmin
				.from('follows')
				.select('follower_id')
				.eq('following_id', userId)
				.in(
					'follower_id',
					following.map(f => f.following_id)
				);
			if (mutualError) throw friendsError('Failed to get mutual follows', mutualError);
			if (!mutualFollows || mutualFollows.length === 0) return [];

			const { data: profiles, error: profilesError } = await supabaseAdmin
				.from('user_profiles')
				.select('id, username, display_name, avatar_url')
				.in(
					'id',
					mutualFollows.map(f => f.follower_id)
				);
			if (profilesError) throw friendsError('Failed to get friend profiles', profilesError);

			return (profiles || []).map(p => ({
				id: p.id,
				username: p.username,
				displayName: p.display_name ?? undefined,
				avatarUrl: p.avatar_url ?? undefined,
			}));
		},
		'Unexpected error getting mutual friends',
		'Failed to get friends',
		'FRIENDS_ERROR'
	);
}
