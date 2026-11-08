import { apiRequest } from '@/shared/services/api';
import type { StreamUrlResponse } from '@/types/soundcloud.types';
import type { StreamFetchResult } from '@/features/player/types';

export async function fetchStreamUrl(
	permalink: string,
	signal: AbortSignal
): Promise<StreamFetchResult> {
	const streamEndpoint = `/api/soundcloud/stream?url=${encodeURIComponent(permalink)}`;
	const data = await apiRequest<Partial<StreamUrlResponse>>(streamEndpoint, { signal });
	if (!data.streamUrl) throw new Error('Stream not available');
	const expiresAt = data.expiresAt ? Date.parse(data.expiresAt) : NaN;
	return {
		streamUrl: data.streamUrl,
		protocol: data.protocol === 'progressive' ? 'progressive' : 'hls',
		expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
	};
}
