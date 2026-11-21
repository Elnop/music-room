import { apiRequest } from '@/shared/backend/lib/api';
import type { StreamUrlResponse } from '@/shared/tracks/types/soundcloudTypes';
import type { StreamFetchResult } from '@/features/playback/shared/player/lib/types';

export async function fetchStreamUrl(
	permalink: string,
	signal: AbortSignal
): Promise<StreamFetchResult> {
	const streamEndpoint = `/api/soundcloud/stream?url=${encodeURIComponent(permalink)}`;
	const data = await apiRequest<Partial<StreamUrlResponse>>(streamEndpoint, { signal });
	if (!data.streamUrl) throw new Error('Stream not available');
	const expiresAt = data.expiresAt ? Date.parse(data.expiresAt) : Number.NaN;
	return {
		streamUrl: data.streamUrl,
		protocol: data.protocol === 'progressive' ? 'progressive' : 'hls',
		expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
	};
}
