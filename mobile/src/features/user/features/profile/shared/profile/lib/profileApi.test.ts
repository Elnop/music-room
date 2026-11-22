import { apiRequest } from '@/shared/backend/lib/api';
import { profileApi } from '@/features/user/features/profile/shared/profile/lib/profileApi';

jest.mock('@/shared/backend/lib/api', () => ({
	apiRequest: jest.fn(),
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
	});

	it('uploadAvatar calls PUT /api/profile/avatar', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ avatarUrl: 'url' });
		await profileApi.uploadAvatar('file:///img.jpg');
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/avatar', {
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
	});

	it('getOwnProfile calls GET /api/profile', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ id: 'u1' });
		await profileApi.getOwnProfile();
		expect(apiRequest).toHaveBeenCalledWith('/api/profile');
	});

	it('getMyStats calls GET /api/friends/stats/me', async () => {
		const stats = { followersCount: 5, followingCount: 10 };
		jest.mocked(apiRequest).mockResolvedValueOnce(stats);
		const res1 = await profileApi.getMyStats();
		expect(apiRequest).toHaveBeenCalledWith('/api/friends/stats/me');
		expect(res1).toStrictEqual(stats);
	});
});
