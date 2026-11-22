import { apiRequest } from '@/shared/backend/lib/apiRequest';
import type {
	MusicGenre,
	MusicPreferences,
	ProfilePrivacy,
	UpdateMusicPreferencesData,
	UpdatePrivacyData,
} from '@/shared/users/userTypes';

export const privacyApi = {
	getPrivacySettings(): Promise<ProfilePrivacy> {
		return apiRequest<ProfilePrivacy>('/api/profile/privacy');
	},

	updatePrivacySettings(data: UpdatePrivacyData): Promise<ProfilePrivacy> {
		return apiRequest<ProfilePrivacy>('/api/profile/privacy', {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	},

	getMusicPreferences(): Promise<MusicPreferences> {
		return apiRequest<MusicPreferences>('/api/profile/music-preferences');
	},

	updateMusicPreferences(data: UpdateMusicPreferencesData): Promise<MusicPreferences> {
		return apiRequest<MusicPreferences>('/api/profile/music-preferences', {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	},

	getAvailableGenres(): Promise<{ genres: MusicGenre[] }> {
		return apiRequest<{ genres: MusicGenre[] }>('/api/profile/music-preferences/genres');
	},
};
