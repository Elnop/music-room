import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { STALE } from '@/shared/query/queryClient';
import { useSession } from '@/shared/services/authSession';
import * as playlistApi from '@/features/playlists/services/playlistApi';
import * as usersApi from '@/features/playlists/services/usersApi';
import { loadPlaylist } from '@/features/playlists/utils/playlistCache';
import type { FriendPlaylists, PlaylistWithTracks } from '@/features/playlists/types';

// Every playlist screen reloaded its data on each visit and showed a failure at
// once: the queries refetch on mount and do not retry.
const ON_EVERY_VISIT = { staleTime: STALE.none, retry: false } as const;

/** The signed-in user's playlists. */
export function usePlaylists(enabled = true) {
	const signedIn = useSession(session => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.playlists.list(),
		queryFn: playlistApi.fetchPlaylists,
		enabled: signedIn && enabled,
		...ON_EVERY_VISIT,
	});
}

/** Every public playlist but the user's own. */
export function usePublicPlaylists() {
	const signedIn = useSession(session => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.playlists.public(),
		queryFn: playlistApi.fetchPublicPlaylists,
		enabled: signedIn,
		...ON_EVERY_VISIT,
	});
}

/** A friend whose playlists fail to load is shown without them, like one with none. */
async function loadFriendsPlaylists(): Promise<FriendPlaylists[]> {
	const friends = await usersApi.getFriends();
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

/** The public playlists of the user's friends, friends without any left out. */
export function useFriendsPlaylists() {
	const signedIn = useSession(session => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.playlists.friends(),
		queryFn: loadFriendsPlaylists,
		enabled: signedIn,
		...ON_EVERY_VISIT,
	});
}

/** A playlist with its tracks, in rank order. */
export function usePlaylistDetail(id: string, enabled = true) {
	const client = useQueryClient();
	return useQuery({
		queryKey: queryKeys.playlists.detail(id),
		queryFn: () => loadPlaylist(client, id),
		enabled,
		...ON_EVERY_VISIT,
	});
}

/** The playlist as another screen loaded it, kept up to date, without fetching it. */
export function useCachedPlaylist(id: string): PlaylistWithTracks | undefined {
	const client = useQueryClient();
	return useQuery({
		queryKey: queryKeys.playlists.detail(id),
		queryFn: () => loadPlaylist(client, id),
		enabled: false,
	}).data;
}
