import { FETCH_TIMEOUT_MS } from '@/features/playback/shared/player/configs/playerConfig';
import { fetchStreamUrl } from '@/features/playback/shared/player/lib/fetchStreamUrl';
import { streamFailureMessage } from '@/features/playback/shared/player/lib/streamFailureMessage';
import { streamPrefetch } from '@/features/playback/shared/player/lib/streamPrefetch';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import type { StreamFetchResult } from '@/features/playback/shared/player/types/playerTypes';

function applyStream(stream: StreamFetchResult): void {
	playerStore.getState().setStreamUrl(stream.streamUrl, stream.expiresAt, stream.protocol);
}

function takePrefetched(track: SoundCloudTrack): boolean {
	const prefetched = streamPrefetch.take(playerStore.getState().queueItemId, track.permalink_url);
	if (prefetched) applyStream(prefetched);
	return prefetched !== null;
}

async function fetchStream(track: SoundCloudTrack, isCurrent: () => boolean): Promise<void> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	try {
		const stream = await fetchStreamUrl(track.permalink_url, controller.signal);
		clearTimeout(timeoutId);
		if (isCurrent()) applyStream(stream);
	} catch (err) {
		clearTimeout(timeoutId);
		if (!isCurrent()) return;
		const message = streamFailureMessage(err, controller.signal.aborted);
		playerStore.getState().setTrackUnavailableError(message);
	}
}

export async function loadStream(track: SoundCloudTrack, isCurrent: () => boolean): Promise<void> {
	if (takePrefetched(track)) return;
	await fetchStream(track, isCurrent);
}
