import type { z } from 'zod';
import type {
	soundcloudSearchResultSchema,
	soundcloudStreamResultSchema,
	soundcloudTrackSchema,
	streamProtocolSchema,
} from '@/features/soundcloud/soundcloud.validators.js';

export type SoundCloudTrack = z.infer<typeof soundcloudTrackSchema>;

export type SoundCloudSearchResult = z.infer<typeof soundcloudSearchResultSchema>;

export type StreamUrlResult = z.infer<typeof soundcloudStreamResultSchema>;

export type StreamProtocol = z.infer<typeof streamProtocolSchema>;
