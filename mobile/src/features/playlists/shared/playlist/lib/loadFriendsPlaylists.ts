import * as playlistApi from '@/features/playlists/shared/playlist/lib/playlistApi';
import * as peopleApi from '@/features/playlists/shared/playlist/lib/peopleApi';
import type { FriendPlaylists } from '@/features/playlists/shared/playlist/playlistTypes';

export async function loadFriendsPlaylists(): Promise<FriendPlaylists[]> {
	const friends = await peopleApi.getFriends();
	const all = await Promise.all(
		friends.map(async friend => {
			try {
				return { friend, playlists: await playlistApi.fetchUserPublicPlaylists(friend.id) };
			} catch {
				return { friend, playlists: [] };
			}
		})
	);
	return all.filter(entry => entry.playlists.length > 0);
}
