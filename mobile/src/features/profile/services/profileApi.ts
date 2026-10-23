import { apiRequest, authRequest } from '@/shared/services/api';
import type {
	AvatarResponse,
	FilteredProfile,
	UpdateProfileData,
	UserProfile,
} from '@/types/user.types';

export const profileApi = {
	async updateProfile(data: UpdateProfileData, accessToken?: string): Promise<UserProfile> {
		const init = {
			method: 'PATCH',
			body: JSON.stringify(data),
		};
		if (accessToken) {
			return authRequest<UserProfile>('/api/profile', accessToken, init);
		}
		return apiRequest<UserProfile>('/api/profile', init);
	},

	async uploadAvatar(uri: string, accessToken?: string): Promise<AvatarResponse> {
		const form = new FormData();
		form.append('avatar', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as unknown as Blob);
		const init = {
			method: 'PUT',
			body: form,
		};
		if (accessToken) {
			return authRequest<AvatarResponse>('/api/profile/avatar', accessToken, init);
		}
		return apiRequest<AvatarResponse>('/api/profile/avatar', init);
	},

	async removeAvatar(accessToken?: string): Promise<AvatarResponse> {
		const init = { method: 'DELETE' };
		if (accessToken) {
			return authRequest<AvatarResponse>('/api/profile/avatar', accessToken, init);
		}
		return apiRequest<AvatarResponse>('/api/profile/avatar', init);
	},

	async getOwnProfile(accessToken?: string): Promise<UserProfile> {
		if (accessToken) {
			return authRequest<UserProfile>('/api/profile', accessToken);
		}
		return apiRequest<UserProfile>('/api/profile');
	},

	async getUserProfile(userId: string, accessToken?: string): Promise<FilteredProfile> {
		if (accessToken) {
			return authRequest<FilteredProfile>(`/api/profile/${userId}`, accessToken);
		}
		return apiRequest<FilteredProfile>(`/api/profile/${userId}`);
	},

	async searchUsers(query: string, limit = 20, accessToken?: string): Promise<UserProfile[]> {
		const params = new URLSearchParams({ q: query, limit: limit.toString() });
		const endpoint = `/api/profile/search?${params.toString()}`;
		if (accessToken) {
			return authRequest<UserProfile[]>(endpoint, accessToken);
		}
		return apiRequest<UserProfile[]>(endpoint);
	},

	async getMyStats(
		accessToken?: string
	): Promise<{ followersCount: number; followingCount: number }> {
		if (accessToken) {
			return authRequest<{ followersCount: number; followingCount: number }>(
				'/api/friends/stats/me',
				accessToken
			);
		}
		return apiRequest<{ followersCount: number; followingCount: number }>('/api/friends/stats/me');
	},
};
