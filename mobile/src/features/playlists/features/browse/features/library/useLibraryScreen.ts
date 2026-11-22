import { useCallback } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSession } from '@/shared/backend/hooks/useSession';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { usePlaylists } from '@/features/playlists/shared/playlist/usePlaylistQueries';
import { useRefetchOnFocus } from '@/features/playlists/shared/refetch-on-focus/useRefetchOnFocus';
import { useManualRefresh } from '@/features/playlists/features/browse/shared/manual-refresh/useManualRefresh';
import type { LibraryScreen } from '@/features/playlists/features/browse/features/library/libraryTypes';
import type {
	Playlist,
	PlaylistStackParamList,
} from '@/features/playlists/shared/playlist/playlistTypes';

type Navigation = NativeStackNavigationProp<PlaylistStackParamList, 'Playlists'>;

function splitByOwner(playlists: Playlist[], userId: string | undefined) {
	return {
		owned: playlists.filter((playlist) => playlist.ownerId === userId),
		shared: playlists.filter((playlist) => playlist.ownerId !== userId),
	};
}

export function useLibraryScreen(navigation: Navigation): LibraryScreen {
	const userId = useSession((session) => session.user?.id);
	const bottomPadding = useBottomPadding();
	const mine = usePlaylists();
	const refresher = useManualRefresh(mine.refetch, 'LibraryScreen');
	const createPlaylist = useCallback(() => navigation.navigate('CreatePlaylist'), [navigation]);

	useRefetchOnFocus(mine.refetch);

	return {
		isInitialLoading: mine.isLoading,
		...splitByOwner(mine.data ?? [], userId),
		isRefreshing: refresher.isRefreshing,
		refresh: refresher.refresh,
		openPlaylist: (id) => navigation.navigate('PlaylistDetail', { id }),
		createPlaylist,
		bottomPadding,
	};
}
