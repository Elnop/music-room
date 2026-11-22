import { apiRequest } from '@/shared/backend/lib/api';
import { jpegFormData } from '@/shared/backend/lib/jpegFormData';
import type {
	AvatarResponse,
	UpdateProfileData,
	UserProfile,
} from '@/shared/users/userTypes';

export const profileApi = {
	updateProfile(data: UpdateProfileData): Promise<UserProfile> {
		return apiRequest<UserProfile>('/api/profile', {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
	},

	async uploadAvatar(uri: string): Promise<AvatarResponse> {
		return apiRequest<AvatarResponse>('/api/profile/avatar', {
			method: 'PUT',
			body: await jpegFormData('avatar', uri, 'avatar.jpg'),
		});
	},

	removeAvatar(): Promise<AvatarResponse> {
		return apiRequest<AvatarResponse>('/api/profile/avatar', { method: 'DELETE' });
	},

	getOwnProfile(): Promise<UserProfile> {
		return apiRequest<UserProfile>('/api/profile');
	},

	getMyStats(): Promise<{ followersCount: number; followingCount: number }> {
		return apiRequest<{ followersCount: number; followingCount: number }>('/api/friends/stats/me');
	},
};
