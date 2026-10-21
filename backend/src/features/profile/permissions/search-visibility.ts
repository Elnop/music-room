import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { PrivacyService } from '@/features/profile/services/privacy.service.js';
import type { VisibilityLevel } from '@/features/profile/profile.types.js';

interface SearchFieldVisibility {
	avatar: boolean;
	bio: boolean;
}

// Same defaults as PrivacyService.mapRowToPrivacy for a profile without a row
const DEFAULT_VISIBILITY: VisibilityLevel = 'public';

const privacyService = new PrivacyService();

const NO_FOLLOWS = { data: [], error: null };

/**
 * Which privacy-controlled fields of each found profile the viewer may see,
 * with the rules of GET /api/profile/:userId (#247). Three queries for the
 * whole result page: privacy rows, then the follows in each direction
 * (friends = mutual follows). Without a viewer, nobody is a friend.
 */
export async function getSearchFieldVisibility(
	viewerId: string | undefined,
	profileIds: string[]
): Promise<Map<string, SearchFieldVisibility>> {
	const visibility = new Map<string, SearchFieldVisibility>();
	if (profileIds.length === 0) return visibility;

	const [privacy, following, followers] = await Promise.all([
		supabaseAdmin
			.from('profile_privacy')
			.select('user_id, avatar_visibility, bio_visibility')
			.in('user_id', profileIds),
		viewerId
			? supabaseAdmin
					.from('follows')
					.select('following_id')
					.eq('follower_id', viewerId)
					.in('following_id', profileIds)
			: NO_FOLLOWS,
		viewerId
			? supabaseAdmin
					.from('follows')
					.select('follower_id')
					.eq('following_id', viewerId)
					.in('follower_id', profileIds)
			: NO_FOLLOWS,
	]);
	// Fail closed without privacy rows; a failed follows lookup means "not a
	// friend", as in PrivacyService.checkFriendship
	if (privacy.error) {
		throw new AppError(500, 'Failed to search users', 'SEARCH_ERROR');
	}

	const rows = new Map(privacy.data.map(row => [row.user_id, row]));
	const followed = new Set(
		(following.data ?? []).map((f: { following_id: string }) => f.following_id)
	);
	const friends = new Set(
		(followers.data ?? [])
			.map((f: { follower_id: string }) => f.follower_id)
			.filter(id => followed.has(id))
	);

	for (const id of profileIds) {
		const row = rows.get(id);
		const isFriend = friends.has(id);
		visibility.set(id, {
			avatar: privacyService.isFieldVisible(
				row?.avatar_visibility ?? DEFAULT_VISIBILITY,
				false,
				isFriend
			),
			bio: privacyService.isFieldVisible(
				row?.bio_visibility ?? DEFAULT_VISIBILITY,
				false,
				isFriend
			),
		});
	}
	return visibility;
}
