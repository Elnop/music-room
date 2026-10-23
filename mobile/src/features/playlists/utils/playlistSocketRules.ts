import { queryKeys } from '@/shared/query/keys';
import { socketCacheRule } from '@/shared/query/socketCache';
import type {
	Playlist,
	PlaylistDeletedEvent,
	PlaylistDetailsEvent,
	PlaylistUpdatedEvent,
	PlaylistWithTracks,
} from '@/features/playlists/types';
import { applyPlaylistEvent } from './playlistSync';

/** Explicit fields: an absent description means it was cleared. */
const detailsPatch = (details: PlaylistDetailsEvent) => ({
	name: details.name,
	description: details.description,
	visibility: details.visibility,
	editMode: details.editMode,
});

/**
 * What the playlist events do to the cache (#342, doc/features/playlist-concurrency.md).
 * A track delta applies in version order; a skipped version or a rebalance
 * invalidates the playlist, which reloads it. Details patch the metadata only.
 */
export const PLAYLIST_SOCKET_RULES = [
	socketCacheRule<PlaylistUpdatedEvent, PlaylistWithTracks>({
		event: 'playlist:updated',
		queryKey: event => queryKeys.playlists.detail(event.playlistId),
		update: (playlist, event) => {
			const next = applyPlaylistEvent(playlist, event);
			if (next === 'reload') return undefined;
			return next === 'ignore' ? playlist : next;
		},
	}),
	socketCacheRule<PlaylistDetailsEvent, PlaylistWithTracks>({
		event: 'playlist:details',
		queryKey: details => queryKeys.playlists.detail(details.playlistId),
		update: (playlist, details) => ({ ...playlist, ...detailsPatch(details) }),
	}),
	socketCacheRule<PlaylistDetailsEvent, Playlist[]>({
		event: 'playlist:details',
		queryKey: () => queryKeys.playlists.list(),
		update: (list, details) =>
			list.map(p => (p.id === details.playlistId ? { ...p, ...detailsPatch(details) } : p)),
	}),
	socketCacheRule<PlaylistDeletedEvent, Playlist[]>({
		event: 'playlist:deleted',
		queryKey: () => queryKeys.playlists.list(),
		update: (list, event) => list.filter(p => p.id !== event.playlistId),
	}),
];
