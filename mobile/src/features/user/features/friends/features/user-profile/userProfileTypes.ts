import type {
	FilteredProfile,
	FollowStatus,
	FriendListeningDevice,
	FriendPlaylistSummary,
} from '@/features/user/features/friends/friendsTypes';

export type ProfileFollow = {
	status: FollowStatus | null;
	isLoading: boolean;
	onToggle: () => void;
};

export type ProfileListening = {
	canControlMusic: boolean;
	devices: FriendListeningDevice[];
	isLoading: boolean;
	onRemotePlay: (deviceId: string) => void;
	onRemotePause: (deviceId: string) => void;
};

export type ProfilePlaylists = {
	items: FriendPlaylistSummary[];
	onSelect: (playlistId: string) => void;
};

export type ViewedProfile = {
	userId: string;
	profile: FilteredProfile;
	playlists: ProfilePlaylists;
	follow: ProfileFollow;
	listening: ProfileListening;
};

export type NowPlayingTrack = {
	title: string;
	artist: string;
	artworkUrl?: string | null;
};
