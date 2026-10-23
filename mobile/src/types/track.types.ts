export interface Track {
	id: string;
	title: string;
	artist: string;
	album?: string;
	albumArt?: string; // Omitted by the API when the track has no artwork
	durationMs: number;
	trackUri: string; // SoundCloud permalink URL
	previewUrl?: string;
}

// Mirrors backend TrackInPlaylistResponse; ordering by rank: doc/features/playlist-concurrency.md
export interface TrackInPlaylist extends Track {
	createdAt: string;
	updatedAt: string;
	/** Sort key: compare with < on strings (byte order, same as the server's COLLATE "C"). */
	rank: string;
	addedBy: string | null;
	addedAt: string;
}
