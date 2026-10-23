import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { fetchSingle, updateOne } from '@/shared/utils/database.helpers.js';
import { deleteReplacedAvatar } from '@/features/profile/services/avatar.service.js';
import type { UpdateProfileInput } from '@/features/profile/profile.validators.js';
import type { OwnProfile, UserProfileRow } from '@/features/profile/profile.types.js';

/** Joins the account's email (auth.users); 404 USER_NOT_FOUND without one. */
async function withEmail(
	profileData: UserProfileRow,
	userId: string,
	failureLog: string
): Promise<OwnProfile> {
	const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

	if (userError || !userData.user) {
		logger.error(failureLog, { userId, error: userError });
		throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
	}

	return {
		id: profileData.id,
		email: userData.user.email ?? '',
		username: profileData.username,
		displayName: profileData.display_name ?? undefined,
		avatarUrl: profileData.avatar_url ?? undefined,
		bio: profileData.bio ?? undefined,
		favoriteArtist: profileData.favorite_artist ?? undefined,
		createdAt: profileData.created_at ?? new Date().toISOString(),
		updatedAt: profileData.updated_at ?? new Date().toISOString(),
	};
}

export async function updateProfile(userId: string, data: UpdateProfileInput): Promise<OwnProfile> {
	try {
		logger.info('Updating user profile', { userId, data });

		const updateData: Record<string, string | undefined> = {};
		if (data.displayName !== undefined) updateData.display_name = data.displayName;
		if (data.bio !== undefined) updateData.bio = data.bio;
		if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
		updateData.updated_at = new Date().toISOString();

		// Previous avatar, to delete our stored photo once replaced
		let previousAvatarUrl: string | null = null;
		if (data.avatarUrl !== undefined) {
			const { data: current } = await supabaseAdmin
				.from('user_profiles')
				.select('avatar_url')
				.eq('id', userId)
				.single();
			previousAvatarUrl = current?.avatar_url ?? null;
		}

		const profileData = await updateOne<UserProfileRow>(
			supabaseAdmin,
			'user_profiles',
			{ id: userId },
			updateData,
			'*',
			'Failed to update profile',
			'PROFILE_UPDATE_ERROR'
		);

		if (data.avatarUrl !== undefined) {
			void deleteReplacedAvatar(previousAvatarUrl, profileData.avatar_url, userId);
		}

		const profile = await withEmail(profileData, userId, 'Failed to fetch user data');
		logger.info('Profile updated successfully', { userId });
		return profile;
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error during profile update', { error });
		throw new AppError(500, 'Profile update failed', 'PROFILE_UPDATE_ERROR');
	}
}

export async function getProfile(userId: string): Promise<OwnProfile> {
	try {
		logger.info('Fetching user profile', { userId });

		const profileData = await fetchSingle<UserProfileRow>(
			supabaseAdmin,
			'user_profiles',
			{ id: userId },
			'*',
			'Profile not found',
			'PROFILE_NOT_FOUND'
		);

		return await withEmail(profileData, userId, 'User not found');
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error fetching profile', { error });
		throw new AppError(500, 'Failed to fetch profile', 'PROFILE_FETCH_ERROR');
	}
}
