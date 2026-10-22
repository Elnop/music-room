import { authRequest } from '@/shared/services/api';

export interface FollowStatus {
	isFollowing: boolean;
	isFollowedBy: boolean;
	isFriend: boolean;
	followersCount: number;
	followingCount: number;
}

export interface FriendProfile {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
}

export interface MyStats {
	followersCount: number;
	followingCount: number;
}

export const friendsApi = {
	async getFriends(accessToken: string): Promise<FriendProfile[]> {
		return authRequest<FriendProfile[]>('/api/friends', accessToken, {
			method: 'GET',
		});
	},

	async getMyStats(accessToken: string): Promise<MyStats> {
		return authRequest<MyStats>('/api/friends/stats/me', accessToken, {
			method: 'GET',
		});
	},

	async getFollowStatus(accessToken: string, userId: string): Promise<FollowStatus> {
		return authRequest<FollowStatus>(`/api/friends/status/${userId}`, accessToken, {
			method: 'GET',
		});
	},

	async followUser(
		accessToken: string,
		userId: string
	): Promise<{ success: boolean; status: FollowStatus }> {
		return authRequest<{ success: boolean; status: FollowStatus }>(
			`/api/friends/follow/${userId}`,
			accessToken,
			{ method: 'POST' }
		);
	},

	async unfollowUser(
		accessToken: string,
		userId: string
	): Promise<{ success: boolean; status: FollowStatus }> {
		return authRequest<{ success: boolean; status: FollowStatus }>(
			`/api/friends/follow/${userId}`,
			accessToken,
			{ method: 'DELETE' }
		);
	},
};
