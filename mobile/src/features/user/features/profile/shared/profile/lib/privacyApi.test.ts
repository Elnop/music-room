import { apiRequest } from '@/shared/backend/lib/apiRequest';
import { privacyApi } from '@/features/user/features/profile/shared/profile/lib/privacyApi';

jest.mock('@/shared/backend/lib/apiRequest', () => ({
	apiRequest: jest.fn(),
}));

describe('privacyApi', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('getPrivacySettings calls GET /api/profile/privacy', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ emailVisibility: 'public' });
		await privacyApi.getPrivacySettings();
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/privacy');
	});

	it('updatePrivacySettings calls PUT /api/profile/privacy', async () => {
		const data = { emailVisibility: 'private' as const };
		jest.mocked(apiRequest).mockResolvedValueOnce({ emailVisibility: 'private' });
		await privacyApi.updatePrivacySettings(data);
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/privacy', {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	});

	it('getMusicPreferences calls GET /api/profile/music-preferences', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ genres: ['rock'] });
		await privacyApi.getMusicPreferences();
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/music-preferences');
	});

	it('updateMusicPreferences calls PUT /api/profile/music-preferences', async () => {
		const data = { genres: ['rock' as const, 'pop' as const] };
		jest.mocked(apiRequest).mockResolvedValueOnce(data);
		await privacyApi.updateMusicPreferences(data);
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/music-preferences', {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	});

	it('getAvailableGenres calls GET /api/profile/music-preferences/genres', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ genres: ['rock'] });
		await privacyApi.getAvailableGenres();
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/music-preferences/genres');
	});
});
