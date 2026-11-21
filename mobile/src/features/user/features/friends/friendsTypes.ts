import type { FilteredProfile, MusicGenre, UserProfile } from '@/shared/users/userTypes';

export type { FilteredProfile, MusicGenre, UserProfile };

export type FollowStatus = {
	isFollowing: boolean;
	isFollowedBy: boolean;
	isFriend: boolean;
	followersCount: number;
	followingCount: number;
};

export type FriendProfile = {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
};

export type RecommendedProfile = {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
	commonGenres: MusicGenre[];
	score: number;
};

export type ProfileRecommendations = {
	hasPreferences: boolean;
	profiles: RecommendedProfile[];
};

export type MyStats = {
	followersCount: number;
	followingCount: number;
};

export type FriendPlaylistSummary = {
	id: string;
	name: string;
	coverUrl?: string | null;
	firstTrackCover?: string | null;
	trackCount: number;
	visibility: 'public' | 'private';
};

export type FriendListeningDevice = {
	device: { deviceId: string };
	track?: {
		id: number;
		title: string;
		artist: string;
		artworkUrl: string | null;
	} | null;
	isPlaying: boolean;
	controllable: boolean;
};

export type FriendsStackParamList = {
	Friends: undefined;
	UserProfile: { userId: string };
	PlaylistDetail: { id: string };
	SearchTracks: { playlistId: string };
};
