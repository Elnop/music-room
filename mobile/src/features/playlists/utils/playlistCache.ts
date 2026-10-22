import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import * as playlistApi from '@/features/playlists/services/playlistApi';
import type {
	Playlist,
	PlaylistUpdatedEvent,
	PlaylistWithTracks,
} from '@/features/playlists/types';
import { applyPlaylistEvent, sortByRank } from './playlistSync';

// The playlist data lives in the query cache: the user's list
// (queryKeys.playlists.list) and one detail per playlist. These helpers read and
// patch it in the order doc/PLAYLIST_CONCURRENCY.md describes.

const detailKey = queryKeys.playlists.detail;

/**
 * Fetches a playlist sorted by rank. A newer track list applied by an event
 * while the request was in flight is kept.
 */
export async function loadPlaylist(client: QueryClient, id: string): Promise<PlaylistWithTracks> {
	const fetched = await playlistApi.fetchPlaylistById(id);
	const shown = client.getQueryData<PlaylistWithTracks>(detailKey(id));
	return shown && shown.tracksVersion > fetched.tracksVersion
		? { ...fetched, tracks: shown.tracks, tracksVersion: shown.tracksVersion }
		: { ...fetched, tracks: sortByRank(fetched.tracks) };
}

/** Fetches the playlist into the cache even when no screen observes it; rejects on failure. */
export function refreshPlaylist(client: QueryClient, id: string): Promise<PlaylistWithTracks> {
	return client.fetchQuery({
		queryKey: detailKey(id),
		queryFn: () => loadPlaylist(client, id),
		staleTime: 0,
		retry: false,
	});
}

/** A screen shows the playlist now (an enabled query observes it). */
export function isOpen(client: QueryClient, id: string): boolean {
	return (
		client
			.getQueryCache()
			.find({ queryKey: detailKey(id), exact: true })
			?.isActive() ?? false
	);
}

/** Reloads the playlist if it is still on screen; a failure stays in the query. */
export async function reloadIfOpen(client: QueryClient, id: string): Promise<void> {
	if (!isOpen(client, id)) return;
	await client.refetchQueries({ queryKey: detailKey(id), exact: true, type: 'active' });
}

/** Applies a track event (socket delta or our own answer) to the cached playlist. */
function applyTrackEvent(
	client: QueryClient,
	event: PlaylistUpdatedEvent
): 'applied' | 'ignored' | 'reload' {
	const current = client.getQueryData<PlaylistWithTracks>(detailKey(event.playlistId));
	if (!current) return 'ignored';
	const next = applyPlaylistEvent(current, event);
	if (next === 'ignore') return 'ignored';
	if (next === 'reload') return 'reload';
	client.setQueryData(detailKey(event.playlistId), next);
	return 'applied';
}

/** Applies a track event, then reloads the playlist when its versions do not follow. */
export async function settleTrackEvent(
	client: QueryClient,
	event: PlaylistUpdatedEvent
): Promise<void> {
	if (applyTrackEvent(client, event) === 'reload') await reloadIfOpen(client, event.playlistId);
}

/** The metadata of a playlist that its edition or a `playlist:details` event changes. */
type PlaylistPatch = Partial<
	Pick<
		Playlist,
		| 'name'
		| 'description'
		| 'coverUrl'
		| 'visibility'
		| 'editMode'
		| 'collaboratorIds'
		| 'viewerIds'
		| 'updatedAt'
	>
>;

/** Patches a playlist's metadata in the user's list and in its detail (tracks untouched). */
export function patchPlaylist(client: QueryClient, id: string, patch: PlaylistPatch): void {
	client.setQueryData<Playlist[]>(queryKeys.playlists.list(), list =>
		list?.map(playlist => (playlist.id === id ? { ...playlist, ...patch } : playlist))
	);
	client.setQueryData<PlaylistWithTracks>(detailKey(id), playlist =>
		playlist ? { ...playlist, ...patch } : playlist
	);
}

/** Puts a created playlist at the top of the user's list. */
export function prependPlaylist(client: QueryClient, playlist: Playlist): void {
	client.setQueryData<Playlist[]>(queryKeys.playlists.list(), list =>
		list ? [playlist, ...list] : list
	);
}

/** Drops a deleted playlist from the user's list. */
export function dropFromList(client: QueryClient, id: string): void {
	client.setQueryData<Playlist[]>(queryKeys.playlists.list(), list =>
		list?.filter(playlist => playlist.id !== id)
	);
}

/** Forgets a deleted playlist's detail, once no screen shows it. */
export function forgetPlaylist(client: QueryClient, id: string): void {
	client.removeQueries({ queryKey: detailKey(id), exact: true });
	client.removeQueries({ queryKey: queryKeys.playlists.members(id), exact: true });
}
