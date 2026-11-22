import { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { useManualRefresh } from '@/features/playlists/features/browse/shared/manual-refresh/useManualRefresh';
import { useHomeQueries } from '@/features/playlists/features/browse/features/home/hooks/useHomeQueries';
import type { HomeScreen } from '@/features/playlists/features/browse/features/home/homeTypes';
import type {
	FriendPlaylists,
	PlaylistStackParamList,
} from '@/features/playlists/shared/playlist/playlistTypes';

type Navigation = NativeStackNavigationProp<PlaylistStackParamList, 'Home'>;

function countAll(friendsPlaylists: FriendPlaylists[]) {
	return friendsPlaylists.reduce((total, entry) => total + entry.playlists.length, 0);
}

export function useHomeScreen(navigation: Navigation): HomeScreen {
	const bottomPadding = useBottomPadding();
	const queries = useHomeQueries();
	const refresher = useManualRefresh(queries.refetchAll, 'HomeScreen');
	const [publicOpen, setPublicOpen] = useState(true);

	return {
		isInitialLoading: queries.friends.isLoading && queries.publics.isLoading,
		friendsPlaylists: queries.friends.data ?? [],
		friendsCount: countAll(queries.friends.data ?? []),
		publicPlaylists: queries.publics.data ?? [],
		publicLoading: queries.publics.isLoading,
		isRefreshing: refresher.isRefreshing,
		refresh: refresher.refresh,
		publicOpen,
		togglePublic: () => setPublicOpen((open) => !open),
		openPlaylist: (id) => navigation.navigate('PlaylistDetail', { id }),
		bottomPadding,
	};
}
