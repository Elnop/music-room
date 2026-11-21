import { socketCacheRule } from '@/shared/backend/lib/socketCache';
import type {
	Playlist,
	PlaylistDeletedEvent,
	PlaylistDetailsEvent,
	PlaylistUpdatedEvent,
	PlaylistWithTracks,
	TracksAvailabilityEvent,
} from '@/features/playlists/shared/playlist/playlistTypes';
import { applyPlaylistEvent } from '@/features/playlists/shared/playlist/lib/playlistSync';
import { playlistEventKeys } from '@/features/playlists/features/editor/features/detail/lib/playlistEventKeys';

function detailsPatch(details: PlaylistDetailsEvent) {
	return {
		name: details.name,
		description: details.description,
		visibility: details.visibility,
		editMode: details.editMode,
		coverUrl: details.coverUrl,
	};
}

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

export const PLAYLIST_SOCKET_RULES = [
	socketCacheRule<PlaylistUpdatedEvent, PlaylistWithTracks>({
		event: 'playlist:updated',
		queryKey: playlistEventKeys.detail,
		update: (playlist, event) => {
			const next = applyPlaylistEvent(playlist, event);
			if (next === 'reload') return undefined;
			return next === 'ignore' ? playlist : next;
		},
	}),
	socketCacheRule<PlaylistDetailsEvent, PlaylistWithTracks>({
		event: 'playlist:details',
		queryKey: playlistEventKeys.detail,
		update: (playlist, details) => ({ ...playlist, ...detailsPatch(details) }),
	}),
	socketCacheRule<PlaylistDetailsEvent, Playlist[]>({
		event: 'playlist:details',
		queryKey: playlistEventKeys.list,
		update: (list, details) =>
			list.map(p => (p.id === details.playlistId ? { ...p, ...detailsPatch(details) } : p)),
	}),
	socketCacheRule<TracksAvailabilityEvent, PlaylistWithTracks>({
		event: 'playlist:tracks-availability',
		queryKey: playlistEventKeys.detail,
		update: (playlist, event) => applyTracksAvailability(playlist, event),
	}),
	socketCacheRule<PlaylistDeletedEvent, Playlist[]>({
		event: 'playlist:deleted',
		queryKey: playlistEventKeys.list,
		update: (list, event) => list.filter(p => p.id !== event.playlistId),
	}),
];
