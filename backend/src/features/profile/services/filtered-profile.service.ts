import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { fetchSingle } from '@/shared/utils/database.helpers.js';
import * as privacySettingsService from '@/features/profile/services/privacy-settings.service.js';
import { isFieldVisible } from '@/features/profile/permissions/field-visibility.js';
import { parseGenres } from '@/shared/music/genres.js';
import type { FilteredProfile, UserProfileRow } from '@/features/profile/profile.types.js';

/** Mutual follows; false when the lookup fails. */
async function checkFriendship(userId1: string, userId2: string): Promise<boolean> {
	try {
		const { data: follows } = await supabaseAdmin
			.from('follows')
			.select('follower_id, following_id')
			.in('follower_id', [userId1, userId2])
			.in('following_id', [userId1, userId2]);

		if (!follows || follows.length < 2) return false;

		const user1FollowsUser2 = follows.some(
			f => f.follower_id === userId1 && f.following_id === userId2
		);
		const user2FollowsUser1 = follows.some(
			f => f.follower_id === userId2 && f.following_id === userId1
		);
		return user1FollowsUser2 && user2FollowsUser1;
	} catch (error) {
		logger.warn('Error checking friendship, defaulting to false', { error });
		return false;
	}
}

export async function getFilteredProfile(
	viewerId: string | null,
	targetUserId: string
): Promise<FilteredProfile> {
	try {
		const isOwnProfile = viewerId === targetUserId;

		const profileData = await fetchSingle<UserProfileRow>(
			supabaseAdmin,
			'user_profiles',
			{ id: targetUserId },
			'*',
			'Profile not found',
			'PROFILE_NOT_FOUND'
		);

		// viewerId decides whether missing settings may be created
		const privacy = await privacySettingsService.getPrivacySettings(
			targetUserId,
			viewerId ?? undefined
		);

		let isFriend = false;
		if (viewerId && !isOwnProfile) isFriend = await checkFriendship(viewerId, targetUserId);

		const { data: musicPrefsData } = await supabaseAdmin
			.from('music_preferences')
			.select('genres')
			.eq('user_id', targetUserId)
			.single();

		const visible = {
			avatar: isFieldVisible(privacy.avatarVisibility, isOwnProfile, isFriend),
			bio: isFieldVisible(privacy.bioVisibility, isOwnProfile, isFriend),
			email: isFieldVisible(privacy.emailVisibility, isOwnProfile, isFriend),
			music: isFieldVisible(privacy.musicPreferencesVisibility, isOwnProfile, isFriend),
		};

		let email: string | null = null;
		if (isOwnProfile || visible.email) {
			const { data: userData } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
			email = userData?.user?.email || null;
		}

		const filteredProfile: FilteredProfile = {
			id: profileData.id,
			username: profileData.username,
			displayName: profileData.display_name ?? undefined,
			favoriteArtist: profileData.favorite_artist ?? undefined,
			createdAt: profileData.created_at ?? new Date().toISOString(),
			isOwnProfile,
			isFriend,
		};

		// Privacy-filtered fields: only present when visible
		if (visible.avatar) filteredProfile.avatarUrl = profileData.avatar_url ?? undefined;
		if (visible.bio) filteredProfile.bio = profileData.bio || '';
		if (visible.email) filteredProfile.email = email;
		if (visible.music) filteredProfile.musicPreferences = parseGenres(musicPrefsData?.genres);

		return filteredProfile;
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error getting filtered profile', { error });
		throw new AppError(500, 'Failed to get profile', 'PROFILE_FETCH_ERROR');
	}
}
