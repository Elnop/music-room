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
