import type {
	UserProfile,
	UpdateProfileData,
	FilteredProfile,
	AvatarResponse,
} from '@/types/user.types';

import { authRequest } from '@/shared/services/api';

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
	 * Upload a new profile photo: the local JPEG at `uri` (already square, 512 px)
	 * as the multipart field `avatar`
	 */
	async uploadAvatar(accessToken: string, uri: string): Promise<AvatarResponse> {
		const form = new FormData();
		// React Native's FormData reads the file from { uri, name, type }.
		form.append('avatar', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as unknown as Blob);
		return authRequest<AvatarResponse>('/api/profile/avatar', accessToken, {
			method: 'PUT',
			body: form,
		});
	},

	/**
	 * Remove the profile photo (initials are shown again)
	 */
	async removeAvatar(accessToken: string): Promise<AvatarResponse> {
		return authRequest<AvatarResponse>('/api/profile/avatar', accessToken, {
			method: 'DELETE',
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
