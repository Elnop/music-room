export interface Track {
	id: string;
	title: string;
	artist: string;
	album?: string;
	albumArt?: string;
	durationMs: number;
	trackUri: string;
	previewUrl?: string;
}

export interface TrackInPlaylist extends Track {
	createdAt: string;
	updatedAt: string;
	rank: string;
	addedBy: string | null;
	addedAt: string;
	unavailable: boolean;
}
