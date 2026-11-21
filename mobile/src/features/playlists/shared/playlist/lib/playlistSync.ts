import type {
	PlaylistUpdatedEvent,
	PlaylistWithTracks,
} from '@/features/playlists/shared/playlist/playlistTypes';
import type { TrackInPlaylist } from '@/shared/tracks/types/trackTypes';

function compareRank(a: TrackInPlaylist, b: TrackInPlaylist): number {
	if (a.rank < b.rank) return -1;
	if (a.rank > b.rank) return 1;
	return 0;
}

export function sortByRank(tracks: TrackInPlaylist[]): TrackInPlaylist[] {
	return tracks.toSorted(compareRank);
}

export function applyPlaylistEvent(
	playlist: PlaylistWithTracks,
	event: PlaylistUpdatedEvent
): PlaylistWithTracks | 'ignore' | 'reload' {
	if (event.tracksVersion <= playlist.tracksVersion) return 'ignore';
	if (event.tracksVersion > playlist.tracksVersion + 1 || event.rebalanced) return 'reload';

	let tracks: TrackInPlaylist[];
	switch (event.event) {
		case 'track_added':
			tracks = [...playlist.tracks.filter(t => t.id !== event.track.id), event.track];
			break;
		case 'track_removed':
			tracks = playlist.tracks.filter(t => t.id !== event.trackId);
			break;
		case 'track_moved':
			tracks = playlist.tracks.map(t => (t.id === event.trackId ? { ...t, rank: event.rank } : t));
			break;
	}
	return { ...playlist, tracks: sortByRank(tracks), tracksVersion: event.tracksVersion };
}
