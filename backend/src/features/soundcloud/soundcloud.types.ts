import type { z } from 'zod';
import type {
	soundcloudSearchResultSchema,
	soundcloudStreamResultSchema,
	soundcloudTrackSchema,
} from '@/features/soundcloud/soundcloud.validators.js';

export type SoundCloudTrack = z.infer<typeof soundcloudTrackSchema>;

/** Playable tracks only. */
export type SoundCloudSearchResult = z.infer<typeof soundcloudSearchResultSchema>;

/** The expiry is ISO 8601. */
export type StreamUrlResult = z.infer<typeof soundcloudStreamResultSchema>;
