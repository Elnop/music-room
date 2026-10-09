// Track Types (Mock-friendly structure)
export interface Track {
	id: string;
	title: string;
	artist: string;
	album?: string; // Optional - SoundCloud and other services may not have albums
	albumArt: string;
	durationMs: number; // milliseconds
	trackUri: string; // Universal track identifier (SoundCloud permalink, etc.)
	previewUrl?: string;
}

// Track with position metadata (from playlist_tracks table)
export interface TrackWithPosition extends Track {
	position: number;
	addedBy: string | null;
	addedAt: string;
}

// Track in a playlist, ordered by rank (doc/PLAYLIST_CONCURRENCY.md)
// Mirrors backend TrackInPlaylistResponse (extends TrackResponse).
export interface TrackInPlaylist extends Omit<Track, 'albumArt'> {
	albumArt?: string;
	createdAt: string;
	updatedAt: string;
	/** Sort key: compare with < on strings (byte order, same as the server's COLLATE "C"). */
	rank: string;
	addedBy: string | null;
	addedAt: string;
}
