import { useCallback, useEffect, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSession } from '@/shared/services/authSession';
import { usePlayerHeight } from '@/shared/services/playbackBridge';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';
import { showError } from '@/shared/utils/toast';
import {
	useFriendsPlaylists,
	usePlaylists,
	usePublicPlaylists,
} from '@/features/playlists/hooks/usePlaylistQueries';
import { useRefetchOnFocus } from '@/features/playlists/hooks/useRefetchOnFocus';
import type { FriendPlaylists, Playlist, PlaylistStackParamList } from '@/features/playlists/types';

type Navigation = NativeStackNavigationProp<PlaylistStackParamList, 'Playlists'>;

export interface PlaylistsScreen {
	/** Nothing to show yet: the whole screen is a skeleton. */
	isInitialLoading: boolean;
	myPlaylists: Playlist[];
	friendsPlaylists: FriendPlaylists[];
	friendsLoading: boolean;
	publicPlaylists: Playlist[];
	publicLoading: boolean;
	isRefreshing: boolean;
	refresh: () => void;
	myOpen: boolean;
	toggleMy: () => void;
	publicOpen: boolean;
	togglePublic: () => void;
	openPlaylist: (id: string) => void;
	createPlaylist: () => void;
	findFriends: () => void;
	/** Space left under the list for the mini player. */
	playerHeight: number;
}

export function usePlaylistsScreen(navigation: Navigation): PlaylistsScreen {
	const userId = useSession(session => session.user?.id);
	const playerHeight = usePlayerHeight();
	const mine = usePlaylists();
	const friends = useFriendsPlaylists();
	const publics = usePublicPlaylists();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [myOpen, setMyOpen] = useState(true);
	const [publicOpen, setPublicOpen] = useState(true);

	const { refetch: refetchMine } = mine;
	const { refetch: refetchFriends } = friends;
	const { refetch: refetchPublic } = publics;
	useRefetchOnFocus(
		useCallback(() => {
			void refetchMine();
			void refetchFriends();
			void refetchPublic();
		}, [refetchMine, refetchFriends, refetchPublic])
	);

	useEffect(() => {
		if (friends.error)
			logger.error('[PlaylistsScreen] Failed to load friends playlists:', friends.error);
	}, [friends.error]);
	useEffect(() => {
		if (publics.error)
			logger.error('[PlaylistsScreen] Failed to load public playlists:', publics.error);
	}, [publics.error]);

	const refresh = async () => {
		setIsRefreshing(true);
		const [result] = await Promise.all([refetchMine(), refetchFriends(), refetchPublic()]);
		setIsRefreshing(false);
		if (result.isError) {
			logger.error('[PlaylistsScreen] Refresh failed:', result.error);
			showError(apiErrorMessage(result.error, 'Impossible de rafraîchir les playlists'));
		}
	};

	const createPlaylist = useCallback(() => navigation.navigate('CreatePlaylist'), [navigation]);

	return {
		isInitialLoading: mine.isLoading,
		myPlaylists: (mine.data ?? []).filter(playlist => playlist.ownerId === userId),
		friendsPlaylists: friends.data ?? [],
		friendsLoading: friends.isLoading,
		publicPlaylists: publics.data ?? [],
		publicLoading: publics.isLoading,
		isRefreshing,
		refresh: () => void refresh(),
		myOpen,
		toggleMy: () => setMyOpen(open => !open),
		publicOpen,
		togglePublic: () => setPublicOpen(open => !open),
		openPlaylist: id => navigation.navigate('PlaylistDetail', { id }),
		createPlaylist,
		// The friends tab lives in the parent tab navigator.
		findFriends: () => navigation.getParent()?.navigate('FriendsTab'),
		playerHeight,
	};
}
