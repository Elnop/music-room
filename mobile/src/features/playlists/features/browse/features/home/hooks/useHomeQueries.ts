import { useCallback } from 'react';
import {
	useFriendsPlaylists,
	usePublicPlaylists,
} from '@/features/playlists/shared/playlist/usePlaylistQueries';
import { useRefetchOnFocus } from '@/features/playlists/shared/refetch-on-focus/useRefetchOnFocus';
import { useLoadErrorLog } from '@/features/playlists/features/browse/features/home/hooks/useLoadErrorLog';

export function useHomeQueries() {
	const friends = useFriendsPlaylists();
	const publics = usePublicPlaylists();
	const { refetch: refetchFriends } = friends;
	const { refetch: refetchPublic } = publics;

	useRefetchOnFocus(
		useCallback(() => {
			void refetchFriends();
			void refetchPublic();
		}, [refetchFriends, refetchPublic])
	);
	useLoadErrorLog(friends.error, '[HomeScreen] Failed to load friends playlists:');
	useLoadErrorLog(publics.error, '[HomeScreen] Failed to load public playlists:');

	async function refetchAll() {
		const [result] = await Promise.all([refetchPublic(), refetchFriends()]);
		return result;
	}

	return { friends, publics, refetchAll };
}
