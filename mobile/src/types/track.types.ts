// Track Types (Mock-friendly structure)
export interface Track {
	id: string;
	title: string;
	artist: string;
	album?: string; // Optional - SoundCloud and other services may not have albums
	albumArt?: string; // Omitted by the API when the track has no artwork
	durationMs: number; // milliseconds
	trackUri: string; // Universal track identifier (SoundCloud permalink, etc.)
	previewUrl?: string;
}

// Track in a playlist, ordered by rank (doc/features/playlist-concurrency.md)
// Mirrors backend TrackInPlaylistResponse (extends TrackResponse).
export interface TrackInPlaylist extends Track {
	createdAt: string;
	updatedAt: string;
	/** Sort key: compare with < on strings (byte order, same as the server's COLLATE "C"). */
	rank: string;
	addedBy: string | null;
	addedAt: string;
}
