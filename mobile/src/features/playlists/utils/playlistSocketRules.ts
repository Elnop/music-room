import { queryKeys } from '@/shared/query/keys';
import { socketCacheRule } from '@/shared/query/socketCache';
import type {
	Playlist,
	PlaylistDeletedEvent,
	PlaylistDetailsEvent,
	PlaylistUpdatedEvent,
	PlaylistWithTracks,
	TracksAvailabilityEvent,
} from '@/features/playlists/types';
import { applyPlaylistEvent } from './playlistSync';

/** Explicit fields: an absent description means it was cleared. */
const detailsPatch = (details: PlaylistDetailsEvent) => ({
	name: details.name,
	description: details.description,
	visibility: details.visibility,
	editMode: details.editMode,
});

function applyTracksAvailability(
	playlist: PlaylistWithTracks,
	event: TracksAvailabilityEvent
): PlaylistWithTracks {
	const changes = new Map(event.tracks.map(change => [change.trackId, change.unavailable]));
	return {
		...playlist,
		tracks: playlist.tracks.map(track => {
			const unavailable = changes.get(track.id);
			return unavailable === undefined ? track : { ...track, unavailable };
		}),
	};
}

/** Track deltas apply in version order; a gap or a rebalance reloads the playlist (doc/features/playlist-concurrency.md). */
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
	socketCacheRule<TracksAvailabilityEvent, PlaylistWithTracks>({
		event: 'playlist:tracks-availability',
		queryKey: event => queryKeys.playlists.detail(event.playlistId),
		update: (playlist, event) => applyTracksAvailability(playlist, event),
	}),
	socketCacheRule<PlaylistDeletedEvent, Playlist[]>({
		event: 'playlist:deleted',
		queryKey: () => queryKeys.playlists.list(),
		update: (list, event) => list.filter(p => p.id !== event.playlistId),
	}),
];
