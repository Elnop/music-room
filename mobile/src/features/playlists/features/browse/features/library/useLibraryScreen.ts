import { useCallback, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSession } from '@/shared/backend/hooks/useSession';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError } from '@/shared/theme/lib/toast';
import { usePlaylists } from '@/features/playlists/shared/playlist/usePlaylistQueries';
import { useRefetchOnFocus } from '@/features/playlists/shared/refetch-on-focus/useRefetchOnFocus';
import type {
	Playlist,
	PlaylistStackParamList,
} from '@/features/playlists/shared/playlist/lib/types';

type Navigation = NativeStackNavigationProp<PlaylistStackParamList, 'Playlists'>;

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

export function useLibraryScreen(navigation: Navigation): LibraryScreen {
	const userId = useSession(session => session.user?.id);
	const bottomPadding = useBottomPadding();
	const mine = usePlaylists();
	const [isRefreshing, setIsRefreshing] = useState(false);

	const { refetch } = mine;
	useRefetchOnFocus(
		useCallback(() => {
			void refetch();
		}, [refetch])
	);

	async function refresh() {
		setIsRefreshing(true);
		const result = await refetch();
		setIsRefreshing(false);
		if (result.isError) {
			logger.error('[LibraryScreen] Refresh failed:', result.error);
			showError(apiErrorMessage(result.error, 'Impossible de rafraîchir les playlists'));
		}
	}

	const playlists = mine.data ?? [];
	const createPlaylist = useCallback(() => navigation.navigate('CreatePlaylist'), [navigation]);

	return {
		isInitialLoading: mine.isLoading,
		owned: playlists.filter(playlist => playlist.ownerId === userId),
		shared: playlists.filter(playlist => playlist.ownerId !== userId),
		isRefreshing,
		refresh: () => void refresh(),
		openPlaylist: id => navigation.navigate('PlaylistDetail', { id }),
		createPlaylist,
		bottomPadding,
	};
}
