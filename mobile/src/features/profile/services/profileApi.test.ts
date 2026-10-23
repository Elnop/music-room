import { apiRequest, authRequest } from '@/shared/services/api';
import { profileApi } from './profileApi';

jest.mock('@/shared/services/api', () => ({
	apiRequest: jest.fn(),
	authRequest: jest.fn(),
}));

describe('profileApi', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('updateProfile calls PATCH /api/profile', async () => {
		const updateData = { displayName: 'Alice' };
		jest.mocked(apiRequest).mockResolvedValueOnce({ id: 'u1' });
		await profileApi.updateProfile(updateData);
		expect(apiRequest).toHaveBeenCalledWith('/api/profile', {
			method: 'PATCH',
			body: JSON.stringify(updateData),
		});

		jest.mocked(authRequest).mockResolvedValueOnce({ id: 'u1' });
		await profileApi.updateProfile(updateData, 'tok');
		expect(authRequest).toHaveBeenCalledWith('/api/profile', 'tok', {
			method: 'PATCH',
			body: JSON.stringify(updateData),
		});
	});

	it('uploadAvatar calls PUT /api/profile/avatar', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ avatarUrl: 'url' });
		await profileApi.uploadAvatar('file:///img.jpg');
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/avatar', {
			method: 'PUT',
			body: expect.any(FormData),
		});

		jest.mocked(authRequest).mockResolvedValueOnce({ avatarUrl: 'url' });
		await profileApi.uploadAvatar('file:///img.jpg', 'tok');
		expect(authRequest).toHaveBeenCalledWith('/api/profile/avatar', 'tok', {
			method: 'PUT',
			body: expect.any(FormData),
		});
	});

	it('removeAvatar calls DELETE /api/profile/avatar', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ avatarUrl: null });
		await profileApi.removeAvatar();
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/avatar', {
			method: 'DELETE',
		});

		jest.mocked(authRequest).mockResolvedValueOnce({ avatarUrl: null });
		await profileApi.removeAvatar('tok');
		expect(authRequest).toHaveBeenCalledWith('/api/profile/avatar', 'tok', {
			method: 'DELETE',
		});
	});

	it('getOwnProfile calls GET /api/profile', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ id: 'u1' });
		await profileApi.getOwnProfile();
		expect(apiRequest).toHaveBeenCalledWith('/api/profile');

		jest.mocked(authRequest).mockResolvedValueOnce({ id: 'u1' });
		await profileApi.getOwnProfile('tok');
		expect(authRequest).toHaveBeenCalledWith('/api/profile', 'tok');
	});

	it('getUserProfile calls GET /api/profile/:userId', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ id: 'u2' });
		await profileApi.getUserProfile('u2');
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/u2');

		jest.mocked(authRequest).mockResolvedValueOnce({ id: 'u2' });
		await profileApi.getUserProfile('u2', 'tok');
		expect(authRequest).toHaveBeenCalledWith('/api/profile/u2', 'tok');
	});

	it('searchUsers calls GET /api/profile/search with query params', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce([]);
		await profileApi.searchUsers('alice', 10);
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/search?q=alice&limit=10');

		jest.mocked(authRequest).mockResolvedValueOnce([]);
		await profileApi.searchUsers('alice', 10, 'tok');
		expect(authRequest).toHaveBeenCalledWith('/api/profile/search?q=alice&limit=10', 'tok');
	});

	it('getMyStats calls GET /api/friends/stats/me', async () => {
		const stats = { followersCount: 5, followingCount: 10 };
		jest.mocked(apiRequest).mockResolvedValueOnce(stats);
		const res1 = await profileApi.getMyStats();
		expect(apiRequest).toHaveBeenCalledWith('/api/friends/stats/me');
		expect(res1).toEqual(stats);

		jest.mocked(authRequest).mockResolvedValueOnce(stats);
		const res2 = await profileApi.getMyStats('tok');
		expect(authRequest).toHaveBeenCalledWith('/api/friends/stats/me', 'tok');
		expect(res2).toEqual(stats);
	});
});
