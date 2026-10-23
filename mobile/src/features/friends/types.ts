import type { FilteredProfile, MusicGenre, UserProfile } from '@/types/user.types';

export type { FilteredProfile, MusicGenre, UserProfile };

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

export interface FriendPlaylistSummary {
	id: string;
	name: string;
	coverUrl?: string | null;
	firstTrackCover?: string | null;
	trackCount: number;
	visibility: 'public' | 'private';
}

export interface FriendListeningDevice {
	device: { deviceId: string };
	track?: {
		id: number;
		title: string;
		artist: string;
		artworkUrl: string | null;
	} | null;
	isPlaying: boolean;
	controllable: boolean;
}

export interface UserProfileHeaderProps {
	userId: string;
	profile: FilteredProfile;
	followStatus: FollowStatus | null;
	isFollowLoading: boolean;
	onFollowToggle: () => void;
	canControlMusic: boolean;
	devices: FriendListeningDevice[];
	isListeningLoading: boolean;
	onRemotePlay: (deviceId: string) => void;
	onRemotePause: (deviceId: string) => void;
}

export type FriendsStackParamList = {
	Friends: undefined;
	UserProfile: { userId: string };
	PlaylistDetail: { id: string };
	SearchTracks: { playlistId: string };
};
