export interface SoundCloudTrack {
	id: number;
	title: string;
	description: string | null;
	duration: number; // milliseconds
	genre: string | null;
	artwork_url: string | null;
	permalink_url: string;
	user: {
		id: number;
		username: string;
		avatar_url: string | null;
		permalink_url: string;
	};
	stream_url?: string;
	streamable?: boolean;
	playable: boolean;
	/** SoundCloud's access policy, e.g. 'ALLOW', or 'SNIP' for a 30-second preview. */
	policy?: string;
	media?: {
		transcodings?: Array<{
			/** True when this stream is only the 30-second preview. */
			snipped?: boolean;
		}>;
	};
}

export interface SoundCloudSearchResult {
	collection: SoundCloudTrack[];
	total_results?: number;
	next_href?: string | null;
}

/** `data` of GET /api/soundcloud/stream: a stream URL and when it expires (ISO 8601) */
export interface StreamUrlResponse {
	streamUrl: string;
	expiresAt: string;
}
