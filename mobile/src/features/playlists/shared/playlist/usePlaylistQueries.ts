import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { STALE } from '@/shared/backend/configs/staleQueryConfig';
import { useSession } from '@/shared/backend/hooks/useSession';
import * as playlistApi from '@/features/playlists/shared/playlist/lib/playlistApi';
import { loadFriendsPlaylists } from '@/features/playlists/shared/playlist/lib/loadFriendsPlaylists';
import { loadPlaylist } from '@/features/playlists/shared/playlist/lib/playlistCache';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';

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
	return useQuery({
		queryKey: queryKeys.playlists.detail(id),
		queryFn: context => loadPlaylist(context.client, id),
		enabled,
		...ON_EVERY_VISIT,
	});
}

export function useCachedPlaylist(id: string): PlaylistWithTracks | undefined {
	return useQuery({
		queryKey: queryKeys.playlists.detail(id),
		queryFn: context => loadPlaylist(context.client, id),
		enabled: false,
	}).data;
}
