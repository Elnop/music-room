import { apiRequest } from '@/shared/backend/lib/apiRequest';
import type { FollowStatus } from '@/features/user/features/friends/friendsTypes';
import { friendsApi } from '@/features/user/features/friends/shared/follows/friendsApi';

jest.mock('@/shared/backend/lib/apiRequest', () => ({
	apiRequest: jest.fn(),
}));

const mockStatus: FollowStatus = {
	isFollowing: false,
	isFollowedBy: false,
	isFriend: false,
	followersCount: 0,
	followingCount: 0,
};

describe('friendsApi', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('getFriends calls apiRequest', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce([]);
		await friendsApi.getFriends();
		expect(apiRequest).toHaveBeenCalledWith('/api/friends');
	});

	it('getFollowStatus calls /api/friends/status/:userId', async () => {
		const status: FollowStatus = {
			isFollowing: true,
			isFollowedBy: false,
			isFriend: false,
			followersCount: 5,
			followingCount: 3,
		};
		jest.mocked(apiRequest).mockResolvedValueOnce(status);
		const res = await friendsApi.getFollowStatus('u1');
		expect(apiRequest).toHaveBeenCalledWith('/api/friends/status/u1');
		expect(res).toStrictEqual(status);
	});

	it('followUser posts to /api/friends/follow/:userId', async () => {
		const ret = { success: true, status: mockStatus };
		jest.mocked(apiRequest).mockResolvedValueOnce(ret);
		const res = await friendsApi.followUser('u2');
		expect(apiRequest).toHaveBeenCalledWith('/api/friends/follow/u2', {
			method: 'POST',
		});
		expect(res).toStrictEqual(ret);
	});

	it('unfollowUser sends DELETE to /api/friends/follow/:userId', async () => {
		const ret = { success: true, status: mockStatus };
		jest.mocked(apiRequest).mockResolvedValueOnce(ret);
		const res = await friendsApi.unfollowUser('u2');
		expect(apiRequest).toHaveBeenCalledWith('/api/friends/follow/u2', {
			method: 'DELETE',
		});
		expect(res).toStrictEqual(ret);
	});

	it('searchUsers queries /api/profile/search', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce([]);
		await friendsApi.searchUsers('alice', 10);
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/search?q=alice&limit=10');
	});

	it('getProfile fetches /api/profile/:userId', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ id: 'u3' });
		const res = await friendsApi.getProfile('u3');
		expect(apiRequest).toHaveBeenCalledWith('/api/profile/u3');
		expect(res).toStrictEqual({ id: 'u3' });
	});

	it('getUserPublicPlaylists returns the playlists array', async () => {
		const playlists = [{ id: 'p1', name: 'Chill', trackCount: 4, visibility: 'public' as const }];
		jest.mocked(apiRequest).mockResolvedValueOnce({ playlists });
		const res = await friendsApi.getUserPublicPlaylists('u4');
		expect(apiRequest).toHaveBeenCalledWith('/api/playlists/user/u4');
		expect(res).toStrictEqual(playlists);
	});

	it('getMyPermissions, grantControl and revokeControl interact with permissions API', async () => {
		jest.mocked(apiRequest).mockResolvedValueOnce({ allowedUserIds: ['u5'] });
		const perms = await friendsApi.getMyPermissions();
		expect(apiRequest).toHaveBeenCalledWith('/api/music-control/permissions');
		expect(perms).toStrictEqual(['u5']);

		jest.mocked(apiRequest).mockResolvedValueOnce(undefined);
		await friendsApi.grantControl('u5');
		expect(apiRequest).toHaveBeenCalledWith('/api/music-control/permissions/u5', {
			method: 'POST',
		});

		jest.mocked(apiRequest).mockResolvedValueOnce(undefined);
		await friendsApi.revokeControl('u5');
		expect(apiRequest).toHaveBeenCalledWith('/api/music-control/permissions/u5', {
			method: 'DELETE',
		});
	});
});
