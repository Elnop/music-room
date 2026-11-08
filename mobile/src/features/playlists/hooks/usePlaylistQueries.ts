import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { STALE } from '@/shared/query/queryClient';
import { useSession } from '@/shared/services/authSession';
import * as playlistApi from '@/features/playlists/services/playlistApi';
import * as usersApi from '@/features/playlists/services/usersApi';
import { loadPlaylist } from '@/features/playlists/utils/playlistCache';
import type { FriendPlaylists, PlaylistWithTracks } from '@/features/playlists/types';

const ON_EVERY_VISIT = { staleTime: STALE.none, retry: false } as const;

export function usePlaylists(enabled = true) {
	const signedIn = useSession(session => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.playlists.list(),
		queryFn: playlistApi.fetchPlaylists,
		enabled: signedIn && enabled,
		...ON_EVERY_VISIT,
	});
}

export function usePublicPlaylists() {
	const signedIn = useSession(session => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.playlists.public(),
		queryFn: playlistApi.fetchPublicPlaylists,
		enabled: signedIn,
		...ON_EVERY_VISIT,
	});
}

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

export function useFriendsPlaylists() {
	const signedIn = useSession(session => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.playlists.friends(),
		queryFn: loadFriendsPlaylists,
		enabled: signedIn,
		...ON_EVERY_VISIT,
	});
}

export function usePlaylistDetail(id: string, enabled = true) {
	const client = useQueryClient();
	return useQuery({
		queryKey: queryKeys.playlists.detail(id),
		queryFn: () => loadPlaylist(client, id),
		enabled,
		...ON_EVERY_VISIT,
	});
}

export function useCachedPlaylist(id: string): PlaylistWithTracks | undefined {
	const client = useQueryClient();
	return useQuery({
		queryKey: queryKeys.playlists.detail(id),
		queryFn: () => loadPlaylist(client, id),
		enabled: false,
	}).data;
}
