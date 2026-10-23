import type { PlaylistUpdatedEvent, PlaylistWithTracks } from '@/features/playlists/types';
import type { TrackInPlaylist } from '@/types/track.types';

// Applies the server's track events in version order (doc/features/playlist-concurrency.md,
// "Broadcast and convergence"). Ranks compare byte by byte, like the server.

export function sortByRank(tracks: TrackInPlaylist[]): TrackInPlaylist[] {
	return [...tracks].sort((a, b) => (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0));
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
