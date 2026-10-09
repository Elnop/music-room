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

// Track of the old `track_added` socket payload: the server sends
// `{ ...TrackInPlaylist, position: 0 }` until #90 (5.5) switches to the versioned delta.
export interface TrackWithPosition extends TrackInPlaylist {
	position: number;
}

// Track in a playlist, ordered by rank (doc/PLAYLIST_CONCURRENCY.md)
// Mirrors backend TrackInPlaylistResponse (extends TrackResponse).
export interface TrackInPlaylist extends Track {
	createdAt: string;
	updatedAt: string;
	/** Sort key: compare with < on strings (byte order, same as the server's COLLATE "C"). */
	rank: string;
	addedBy: string | null;
	addedAt: string;
}
