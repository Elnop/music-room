import { supabase } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { fetchSingle, updateOne } from '@/shared/utils/database.helpers.js';
import type { UpdateProfileDTO, ProfileUpdateResponse } from '@/features/profile/profile.types.js';

// Type for user_profiles table row
type UserProfileRow = {
	id: string;
	username: string;
	display_name: string | null;
	avatar_url: string | null;
	bio: string | null;
	favorite_artist: string | null;
	created_at: string | null;
	updated_at: string | null;
};

export class ProfileService {
	/**
	 * Update user profile
	 */
	async updateProfile(userId: string, data: UpdateProfileDTO): Promise<ProfileUpdateResponse> {
		try {
			logger.info('Updating user profile', { userId, data });

			// Build update object with only provided fields
			const updateData: Record<string, string | undefined> = {};
			if (data.displayName !== undefined) updateData.display_name = data.displayName;
			if (data.bio !== undefined) updateData.bio = data.bio;
			if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
			if (data.favoriteArtist !== undefined) updateData.favorite_artist = data.favoriteArtist;
			updateData.updated_at = new Date().toISOString();

			// Update user_profiles table
			const profileData = await updateOne<UserProfileRow>(
				supabase,
				'user_profiles',
				{ id: userId },
				updateData,
				'*',
				'Failed to update profile',
				'PROFILE_UPDATE_ERROR'
			);

			// Get user email from auth.users
			const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

			if (userError || !userData.user) {
				logger.error('Failed to fetch user data', { userId, error: userError });
				throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
			}

			logger.info('Profile updated successfully', { userId });

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
		} catch (error) {
			if (error instanceof AppError) throw error;
			logger.error('Unexpected error during profile update', { error });
			throw new AppError(500, 'Profile update failed', 'PROFILE_UPDATE_ERROR');
		}
	}

	/**
	 * Get user profile by ID
	 */
	async getProfile(userId: string): Promise<ProfileUpdateResponse> {
		try {
			logger.info('Fetching user profile', { userId });

			// Get profile from user_profiles
			const profileData = await fetchSingle<UserProfileRow>(
				supabase,
				'user_profiles',
				{ id: userId },
				'*',
				'Profile not found',
				'PROFILE_NOT_FOUND'
			);

			// Get user email from auth.users
			const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

			if (userError || !userData.user) {
				logger.error('User not found', { userId, error: userError });
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
		} catch (error) {
			if (error instanceof AppError) throw error;
			logger.error('Unexpected error fetching profile', { error });
			throw new AppError(500, 'Failed to fetch profile', 'PROFILE_FETCH_ERROR');
		}
	}
}
