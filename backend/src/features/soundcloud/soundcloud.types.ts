/**
 * Response and domain types of the soundcloud feature. Request inputs are
 * inferred from the Zod schemas in soundcloud.validators.ts.
 */

import type { z } from 'zod';
import type {
	soundcloudSearchResultSchema,
	soundcloudStreamResultSchema,
	soundcloudTrackSchema,
} from '@/features/soundcloud/soundcloud.validators.js';

/** The soundcloud.ts client: the part of it the feature calls. */
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

/** A track as SoundCloud's API returns it. */
export type SoundCloudTrack = z.infer<typeof soundcloudTrackSchema>;

/** One page of search results, playable tracks only. */
export type SoundCloudSearchResult = z.infer<typeof soundcloudSearchResultSchema>;

/** A stream URL and the moment it expires (ISO 8601). */
export type StreamUrlResult = z.infer<typeof soundcloudStreamResultSchema>;
