import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ApiError } from '@/shared/services/api';
import { usePlayerHeight } from '@/shared/services/playbackBridge';
import { showError, showInfo } from '@/shared/utils/toast';
import { usePlaylistDetail } from '@/features/playlists/hooks/usePlaylistQueries';
import { usePlaylistRoom } from '@/features/playlists/hooks/usePlaylistRoom';
import { useRefetchOnFocus } from '@/features/playlists/hooks/useRefetchOnFocus';
import { forgetPlaylist } from '@/features/playlists/utils/playlistCache';
import type { PlaylistStackParamList, PlaylistWithTracks } from '@/features/playlists/types';

export type DetailNavigation = NativeStackNavigationProp<PlaylistStackParamList, 'PlaylistDetail'>;

export interface PlaylistDetailScreen {
	id: string;
	playlist: PlaylistWithTracks | undefined;
	/** Why the playlist could not be shown; null while it loads or once shown. */
	failure: 'notFound' | 'error' | null;
	retry: () => void;
	isRefreshing: boolean;
	refresh: () => void;
	/** Set before this screen deletes the playlist: its own `playlist:deleted` is not news. */
	markDeleting: (deleting: boolean) => void;
	/** Leaves for the list after the playlist was deleted, and forgets it. */
	leaveDeleted: () => void;
	playerHeight: number;
}

/**
 * The playlist on screen: loaded on each visit, kept live by its room, and
 * left with a message when its owner deletes it (#342). A share link may point
 * to a private or deleted playlist (#321): a 403 or 404 is « not found ».
 */
export function usePlaylistDetailScreen(
	navigation: DetailNavigation,
	id: string
): PlaylistDetailScreen {
	const client = useQueryClient();
	const playerHeight = usePlayerHeight();
	const { deleted } = usePlaylistRoom(id);
	const [gone, setGone] = useState(false);
	const deletingRef = useRef(false);
	const detail = usePlaylistDetail(id, !deleted && !gone);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const { refetch, isFetching, error, data } = detail;
	const active = !deleted && !gone;
	useRefetchOnFocus(
		useCallback(() => {
			if (active) void refetch();
		}, [active, refetch])
	);

	const leaveDeleted = useCallback(() => {
		setGone(true);
		navigation.popToTop();
		forgetPlaylist(client, id);
	}, [navigation, client, id]);

	useEffect(() => {
		if (!deleted || deletingRef.current) return;
		showInfo('Cette playlist a été supprimée');
		// Root of its stack (opened from a link): go to the list rather than stay stuck.
		if (navigation.canGoBack()) navigation.goBack();
		else navigation.navigate('Playlists');
		forgetPlaylist(client, id);
	}, [deleted, navigation, client, id]);

	const refresh = async () => {
		setIsRefreshing(true);
		const result = await refetch();
		setIsRefreshing(false);
		if (result.isError) showError('Impossible de charger la playlist');
	};

	const notFound = error instanceof ApiError && (error.status === 403 || error.status === 404);
	return {
		id,
		playlist: data,
		failure: error && !data && !isFetching ? (notFound ? 'notFound' : 'error') : null,
		retry: () => void refetch(),
		isRefreshing,
		refresh: () => void refresh(),
		markDeleting: deleting => {
			deletingRef.current = deleting;
		},
		leaveDeleted,
		playerHeight,
	};
}
