import { apiRequest, authRequest } from '@/shared/services/api';
import type {
	FilteredProfile,
	MusicGenre,
	MusicPreferences,
	ProfilePrivacy,
	UpdateMusicPreferencesData,
	UpdatePrivacyData,
} from '@/types/user.types';

export const privacyApi = {
	async getPrivacySettings(accessToken?: string): Promise<ProfilePrivacy> {
		if (accessToken) {
			return authRequest<ProfilePrivacy>('/api/profile/privacy', accessToken);
		}
		return apiRequest<ProfilePrivacy>('/api/profile/privacy');
	},

	async updatePrivacySettings(
		data: UpdatePrivacyData,
		accessToken?: string
	): Promise<ProfilePrivacy> {
		const init = {
			method: 'PUT',
			body: JSON.stringify(data),
		};
		if (accessToken) {
			return authRequest<ProfilePrivacy>('/api/profile/privacy', accessToken, init);
		}
		return apiRequest<ProfilePrivacy>('/api/profile/privacy', init);
	},

	async getMusicPreferences(accessToken?: string): Promise<MusicPreferences> {
		if (accessToken) {
			return authRequest<MusicPreferences>('/api/profile/music-preferences', accessToken);
		}
		return apiRequest<MusicPreferences>('/api/profile/music-preferences');
	},

	async updateMusicPreferences(
		data: UpdateMusicPreferencesData,
		accessToken?: string
	): Promise<MusicPreferences> {
		const init = {
			method: 'PUT',
			body: JSON.stringify(data),
		};
		if (accessToken) {
			return authRequest<MusicPreferences>('/api/profile/music-preferences', accessToken, init);
		}
		return apiRequest<MusicPreferences>('/api/profile/music-preferences', init);
	},

	async getAvailableGenres(accessToken?: string): Promise<{ genres: MusicGenre[] }> {
		if (accessToken) {
			return authRequest<{ genres: MusicGenre[] }>(
				'/api/profile/music-preferences/genres',
				accessToken
			);
		}
		return apiRequest<{ genres: MusicGenre[] }>('/api/profile/music-preferences/genres');
	},

	async getFilteredProfile(userId: string, accessToken?: string): Promise<FilteredProfile> {
		if (accessToken) {
			return authRequest<FilteredProfile>(`/api/profile/${userId}`, accessToken);
		}
		return apiRequest<FilteredProfile>(`/api/profile/${userId}`);
	},
};
