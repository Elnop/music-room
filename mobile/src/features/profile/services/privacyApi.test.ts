import { apiRequest, authRequest } from '@/shared/services/api';
import { privacyApi } from './privacyApi';

jest.mock('@/shared/services/api', () => ({
	apiRequest: jest.fn(),
	authRequest: jest.fn(),
}));

describe('privacyApi', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('getPrivacySettings calls GET /api/profile/privacy', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ emailVisibility: 'public' });
		await privacyApi.getPrivacySettings();
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/privacy');

		jest.mocked(authRequest).mockResolvedValueOnce({ emailVisibility: 'public' });
		await privacyApi.getPrivacySettings('tok');
		expect(authRequest).toHaveBeenCalledWith('/api/profile/privacy', 'tok');
	});

	it('updatePrivacySettings calls PUT /api/profile/privacy', async () => {
		const data = { emailVisibility: 'private' as const };
		jest.mocked(apiRequest).mockResolvedValueOnce({ emailVisibility: 'private' });
		await privacyApi.updatePrivacySettings(data);
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/privacy', {
			method: 'PUT',
			body: JSON.stringify(data),
		});

		jest.mocked(authRequest).mockResolvedValueOnce({ emailVisibility: 'private' });
		await privacyApi.updatePrivacySettings(data, 'tok');
		expect(authRequest).toHaveBeenCalledWith('/api/profile/privacy', 'tok', {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	});

	it('getMusicPreferences calls GET /api/profile/music-preferences', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ genres: ['rock'] });
		await privacyApi.getMusicPreferences();
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/music-preferences');

		jest.mocked(authRequest).mockResolvedValueOnce({ genres: ['rock'] });
		await privacyApi.getMusicPreferences('tok');
		expect(authRequest).toHaveBeenCalledWith('/api/profile/music-preferences', 'tok');
	});

	it('updateMusicPreferences calls PUT /api/profile/music-preferences', async () => {
		const data = { genres: ['rock' as const, 'pop' as const] };
		jest.mocked(apiRequest).mockResolvedValueOnce(data);
		await privacyApi.updateMusicPreferences(data);
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/music-preferences', {
			method: 'PUT',
			body: JSON.stringify(data),
		});

		jest.mocked(authRequest).mockResolvedValueOnce(data);
		await privacyApi.updateMusicPreferences(data, 'tok');
		expect(authRequest).toHaveBeenCalledWith('/api/profile/music-preferences', 'tok', {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	});

	it('getAvailableGenres calls GET /api/profile/music-preferences/genres', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ genres: ['rock'] });
		await privacyApi.getAvailableGenres();
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/music-preferences/genres');

		jest.mocked(authRequest).mockResolvedValueOnce({ genres: ['rock'] });
		await privacyApi.getAvailableGenres('tok');
		expect(authRequest).toHaveBeenCalledWith('/api/profile/music-preferences/genres', 'tok');
	});

	it('getFilteredProfile calls GET /api/profile/:userId', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ id: 'u3' });
		await privacyApi.getFilteredProfile('u3');
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/u3');

		jest.mocked(authRequest).mockResolvedValueOnce({ id: 'u3' });
		await privacyApi.getFilteredProfile('u3', 'tok');
		expect(authRequest).toHaveBeenCalledWith('/api/profile/u3', 'tok');
	});
});
