import { useCallback, useEffect, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBottomPadding } from '@/shared/hooks/useBottomPadding';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';
import { showError } from '@/shared/utils/toast';
import {
	useFriendsPlaylists,
	usePublicPlaylists,
} from '@/features/playlists/hooks/usePlaylistQueries';
import { useRefetchOnFocus } from '@/features/playlists/hooks/useRefetchOnFocus';
import type { FriendPlaylists, Playlist, PlaylistStackParamList } from '@/features/playlists/types';

type Navigation = NativeStackNavigationProp<PlaylistStackParamList, 'Home'>;

export interface HomeScreen {
	/** Nothing to show yet: the whole screen is a skeleton. */
	isInitialLoading: boolean;
	friendsPlaylists: FriendPlaylists[];
	friendsLoading: boolean;
	publicPlaylists: Playlist[];
	publicLoading: boolean;
	isRefreshing: boolean;
	refresh: () => void;
	publicOpen: boolean;
	togglePublic: () => void;
	openPlaylist: (id: string) => void;
	findFriends: () => void;
	/** Space left under the list for the mini player. */
	bottomPadding: number;
}

export function useHomeScreen(navigation: Navigation): HomeScreen {
	const bottomPadding = useBottomPadding();
	const friends = useFriendsPlaylists();
	const publics = usePublicPlaylists();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [publicOpen, setPublicOpen] = useState(true);

	const { refetch: refetchFriends } = friends;
	const { refetch: refetchPublic } = publics;
	useRefetchOnFocus(
		useCallback(() => {
			void refetchFriends();
			void refetchPublic();
		}, [refetchFriends, refetchPublic])
	);

	useEffect(() => {
		if (friends.error)
			logger.error('[HomeScreen] Failed to load friends playlists:', friends.error);
	}, [friends.error]);
	useEffect(() => {
		if (publics.error) logger.error('[HomeScreen] Failed to load public playlists:', publics.error);
	}, [publics.error]);

	const refresh = async () => {
		setIsRefreshing(true);
		const [result] = await Promise.all([refetchPublic(), refetchFriends()]);
		setIsRefreshing(false);
		if (result.isError) {
			logger.error('[HomeScreen] Refresh failed:', result.error);
			showError(apiErrorMessage(result.error, 'Impossible de rafraîchir les playlists'));
		}
	};

	return {
		isInitialLoading: friends.isLoading && publics.isLoading,
		friendsPlaylists: friends.data ?? [],
		friendsLoading: friends.isLoading,
		publicPlaylists: publics.data ?? [],
		publicLoading: publics.isLoading,
		isRefreshing,
		refresh: () => void refresh(),
		publicOpen,
		togglePublic: () => setPublicOpen(open => !open),
		openPlaylist: id => navigation.navigate('PlaylistDetail', { id }),
		// The friends tab lives in the parent tab navigator.
		findFriends: () => navigation.getParent()?.navigate('FriendsTab'),
		bottomPadding,
	};
}
