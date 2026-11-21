import type { FriendPlaylists, Playlist } from '@/features/playlists/shared/playlist/playlistTypes';

export type HomeScreen = {
	isInitialLoading: boolean;
	friendsPlaylists: FriendPlaylists[];
	friendsCount: number;
	publicPlaylists: Playlist[];
	publicLoading: boolean;
	isRefreshing: boolean;
	refresh: () => void;
	publicOpen: boolean;
	togglePublic: () => void;
	openPlaylist: (id: string) => void;
	bottomPadding: number;
};
