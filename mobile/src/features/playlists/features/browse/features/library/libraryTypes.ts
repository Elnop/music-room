import type { Playlist } from '@/features/playlists/shared/playlist/playlistTypes';

export type LibraryScreen = {
	isInitialLoading: boolean;
	owned: Playlist[];
	shared: Playlist[];
	isRefreshing: boolean;
	refresh: () => void;
	openPlaylist: (id: string) => void;
	createPlaylist: () => void;
	bottomPadding: number;
};
