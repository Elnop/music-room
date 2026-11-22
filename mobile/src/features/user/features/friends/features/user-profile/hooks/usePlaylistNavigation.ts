import { useCallback } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FriendsStackParamList } from '@/features/user/features/friends/friendsTypes';

export function usePlaylistNavigation(
	navigation: NativeStackNavigationProp<FriendsStackParamList, 'UserProfile'> | undefined,
	onNavigateToPlaylist: ((playlistId: string) => void) | undefined,
) {
	return useCallback(
		(playlistId: string) => {
			if (onNavigateToPlaylist) {
				onNavigateToPlaylist(playlistId);
			} else if (navigation) {
				navigation.navigate('PlaylistDetail', { id: playlistId });
			}
		},
		[navigation, onNavigateToPlaylist],
	);
}
