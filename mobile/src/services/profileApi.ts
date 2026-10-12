import type { UserProfile, UpdateProfileData, FilteredProfile } from '@/types/user.types';

import { authRequest } from '@/services/api';

/**
 * Profile API
 */
export const profileApi = {
	/**
	 * Update current user's profile
	 */
	async updateProfile(accessToken: string, data: UpdateProfileData): Promise<UserProfile> {
		return authRequest<UserProfile>('/api/profile', accessToken, {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
	},

	/**
	 * Get current user's profile
	 */
	async getOwnProfile(accessToken: string): Promise<UserProfile> {
		return authRequest<UserProfile>('/api/profile', accessToken, {
			method: 'GET',
		});
	},

	/**
	 * Get user profile by ID (with privacy filtering)
	 */
	async getUserProfile(accessToken: string, userId: string): Promise<FilteredProfile> {
		return authRequest<FilteredProfile>(`/api/profile/${userId}`, accessToken, {
			method: 'GET',
		});
	},

	/**
	 * Search users by username or display name
	 */
	async searchUsers(accessToken: string, query: string, limit = 20): Promise<UserProfile[]> {
		const params = new URLSearchParams({ q: query, limit: limit.toString() });
		return authRequest<UserProfile[]>(`/api/profile/search?${params.toString()}`, accessToken, {
			method: 'GET',
		});
	},
};
