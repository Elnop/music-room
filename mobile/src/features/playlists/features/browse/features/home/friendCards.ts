import type {
	FriendPlaylists,
	Playlist,
	UserSummary,
} from '@/features/playlists/shared/playlist/playlistTypes';

export function friendCards(
	friendsPlaylists: FriendPlaylists[]
): { friend: UserSummary; playlist: Playlist }[] {
	return friendsPlaylists.flatMap(({ friend, playlists }) =>
		playlists.map(playlist => ({ friend, playlist }))
	);
}
