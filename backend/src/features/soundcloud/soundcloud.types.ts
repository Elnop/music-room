import type { z } from 'zod';
import type {
	soundcloudSearchResultSchema,
	soundcloudStreamResultSchema,
	soundcloudTrackSchema,
} from '@/features/soundcloud/soundcloud.validators.js';

/** The part of the soundcloud.ts client the feature calls. */
export interface SoundCloudClient {
	tracks: {
		search: (query: { q: string; limit?: number; offset?: number }) => Promise<unknown>;
		get: (urlOrId: string) => Promise<unknown>;
		getStreamUrl: (track: unknown) => Promise<string>;
	};
	util?: {
		streamLink: (trackUrl: string, protocol: 'hls' | 'progressive') => Promise<string>;
	};
}

export type SoundCloudTrack = z.infer<typeof soundcloudTrackSchema>;

/** Playable tracks only. */
export type SoundCloudSearchResult = z.infer<typeof soundcloudSearchResultSchema>;

/** The expiry is ISO 8601. */
export type StreamUrlResult = z.infer<typeof soundcloudStreamResultSchema>;
