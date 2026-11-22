import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { STALE } from '@/shared/backend/configs/staleQueryConfig';
import * as playlistApi from '@/features/playlists/shared/playlist/lib/playlistApi';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import { sortByRank } from '@/features/playlists/shared/playlist/lib/playlistSync';

export async function loadPlaylist(client: QueryClient, id: string): Promise<PlaylistWithTracks> {
	const fetched = await playlistApi.fetchPlaylistById(id);
	const shown = client.getQueryData<PlaylistWithTracks>(queryKeys.playlists.detail(id));
	return shown && shown.tracksVersion > fetched.tracksVersion
		? { ...fetched, tracks: shown.tracks, tracksVersion: shown.tracksVersion }
		: { ...fetched, tracks: sortByRank(fetched.tracks) };
}

export function refreshPlaylist(client: QueryClient, id: string): Promise<PlaylistWithTracks> {
	return client.fetchQuery({
		queryKey: queryKeys.playlists.detail(id),
		queryFn: (context) => loadPlaylist(context.client, id),
		staleTime: STALE.none,
		retry: false,
	});
}

export function isOnScreen(client: QueryClient, id: string): boolean {
	return (
		client
			.getQueryCache()
			.find({ queryKey: queryKeys.playlists.detail(id), exact: true })
			?.isActive() ?? false
	);
}

export async function reloadIfOnScreen(client: QueryClient, id: string): Promise<void> {
	if (!isOnScreen(client, id)) return;
	await client.refetchQueries({
		queryKey: queryKeys.playlists.detail(id),
		exact: true,
		type: 'active',
	});
}
