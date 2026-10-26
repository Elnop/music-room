import { useCallback, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSession } from '@/shared/services/authSession';
import { useBottomPadding } from '@/shared/hooks/useBottomPadding';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';
import { showError } from '@/shared/utils/toast';
import { usePlaylists } from '@/features/playlists/hooks/usePlaylistQueries';
import { useRefetchOnFocus } from '@/features/playlists/hooks/useRefetchOnFocus';
import type { Playlist, PlaylistStackParamList } from '@/features/playlists/types';

type Navigation = NativeStackNavigationProp<PlaylistStackParamList, 'Playlists'>;

export interface LibraryScreen {
	/** Nothing to show yet: the whole screen is a skeleton. */
	isInitialLoading: boolean;
	owned: Playlist[];
	/** Playlists of other users where I am a collaborator or a viewer. */
	shared: Playlist[];
	isRefreshing: boolean;
	refresh: () => void;
	openPlaylist: (id: string) => void;
	createPlaylist: () => void;
	/** Space left under the list for the mini player. */
	bottomPadding: number;
}

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

	const refresh = async () => {
		setIsRefreshing(true);
		const result = await refetch();
		setIsRefreshing(false);
		if (result.isError) {
			logger.error('[LibraryScreen] Refresh failed:', result.error);
			showError(apiErrorMessage(result.error, 'Impossible de rafraîchir les playlists'));
		}
	};

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
