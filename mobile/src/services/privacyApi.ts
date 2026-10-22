import type {
	ProfilePrivacy,
	UpdatePrivacyData,
	MusicPreferences,
	UpdateMusicPreferencesData,
	MusicGenre,
	FilteredProfile,
} from '@/types/user.types';

import { authRequest } from '@/shared/services/api';

/**
 * Privacy API
 */
export const privacyApi = {
	/**
	 * Get current user's privacy settings
	 */
	async getPrivacySettings(accessToken: string): Promise<ProfilePrivacy> {
		return authRequest<ProfilePrivacy>('/api/profile/privacy', accessToken, {
			method: 'GET',
		});
	},

	/**
	 * Update current user's privacy settings
	 */
	async updatePrivacySettings(
		accessToken: string,
		data: UpdatePrivacyData
	): Promise<ProfilePrivacy> {
		return authRequest<ProfilePrivacy>('/api/profile/privacy', accessToken, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	},

	/**
	 * Get current user's music preferences
	 */
	async getMusicPreferences(accessToken: string): Promise<MusicPreferences> {
		return authRequest<MusicPreferences>('/api/profile/music-preferences', accessToken, {
			method: 'GET',
		});
	},

	/**
	 * Update current user's music preferences
	 */
	async updateMusicPreferences(
		accessToken: string,
		data: UpdateMusicPreferencesData
	): Promise<MusicPreferences> {
		return authRequest<MusicPreferences>('/api/profile/music-preferences', accessToken, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	},

	/**
	 * Get all available music genres
	 */
	async getAvailableGenres(accessToken: string): Promise<{ genres: MusicGenre[] }> {
		return authRequest<{ genres: MusicGenre[] }>(
			'/api/profile/music-preferences/genres',
			accessToken,
			{
				method: 'GET',
			}
		);
	},

	/**
	 * Get user profile with privacy filtering applied
	 */
	async getFilteredProfile(accessToken: string, userId: string): Promise<FilteredProfile> {
		return authRequest<FilteredProfile>(`/api/profile/${userId}`, accessToken, {
			method: 'GET',
		});
	},
};
