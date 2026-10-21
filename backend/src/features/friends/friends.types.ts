export interface FollowStatus {
	isFollowing: boolean;
	isFollowedBy: boolean;
	isFriend: boolean;
	followersCount: number;
	followingCount: number;
}

export interface FollowActionResponse {
	success: boolean;
	status: FollowStatus;
}
