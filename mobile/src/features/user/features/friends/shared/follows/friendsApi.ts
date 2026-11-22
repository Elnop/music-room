import { apiRequest } from '@/shared/backend/lib/apiRequest';
import type {
	FollowStatus,
	FriendPlaylistSummary,
	FriendProfile,
	ProfileRecommendations,
	UserProfile,
	FilteredProfile,
} from '@/features/user/features/friends/friendsTypes';

export const friendsApi = {
	getFriends(): Promise<FriendProfile[]> {
		return apiRequest<FriendProfile[]>('/api/friends');
	},

	getFollowStatus(userId: string): Promise<FollowStatus> {
		return apiRequest<FollowStatus>(`/api/friends/status/${userId}`);
	},

	followUser(userId: string): Promise<{ success: boolean; status: FollowStatus }> {
		return apiRequest<{ success: boolean; status: FollowStatus }>(`/api/friends/follow/${userId}`, {
			method: 'POST',
		});
	},

	unfollowUser(userId: string): Promise<{ success: boolean; status: FollowStatus }> {
		return apiRequest<{ success: boolean; status: FollowStatus }>(`/api/friends/follow/${userId}`, {
			method: 'DELETE',
		});
	},

	searchUsers(query: string, limit = 20): Promise<UserProfile[]> {
		const params = new URLSearchParams({ q: query, limit: limit.toString() });
		return apiRequest<UserProfile[]>(`/api/profile/search?${params.toString()}`);
	},

	getRecommendations(limit = 10): Promise<ProfileRecommendations> {
		return apiRequest<ProfileRecommendations>(`/api/profile/recommendations?limit=${limit}`);
	},

	getProfile(userId: string): Promise<FilteredProfile> {
		return apiRequest<FilteredProfile>(`/api/profile/${userId}`);
	},

	getUserPublicPlaylists(userId: string): Promise<FriendPlaylistSummary[]> {
		return apiRequest<{ playlists: FriendPlaylistSummary[] }>(`/api/playlists/user/${userId}`).then(
			(res) => res.playlists,
		);
	},

	async getMyPermissions(): Promise<string[]> {
		const data = await apiRequest<{ allowedUserIds: string[] }>('/api/music-control/permissions');
		return data.allowedUserIds;
	},

	grantControl(userId: string): Promise<void> {
		return apiRequest(`/api/music-control/permissions/${userId}`, { method: 'POST' });
	},

	revokeControl(userId: string): Promise<void> {
		return apiRequest(`/api/music-control/permissions/${userId}`, { method: 'DELETE' });
	},
};
