import { FETCH_TIMEOUT_MS } from '@/features/playback/shared/player/configs/playerConfig';
import { isLocalTarget } from '@/features/playback/lib/isLocalTarget';
import { fetchStreamUrl } from '@/features/playback/lib/fetchStreamUrl';
import { streamPrefetch } from '@/features/playback/lib/streamPrefetch';

type PrefetchTarget = {
	queueItemId: string;
	permalink: string;
};

export function dropStalePrefetch(
	isLocal: boolean,
	nextKey: string | null,
	currentId: string | null
): void {
	const held = streamPrefetch.peek();
	if (!held) return;
	const stillWanted =
		nextKey === `${held.queueItemId} ${held.permalink}` || held.queueItemId === currentId;
	if (!isLocal || !stillWanted) streamPrefetch.clear();
}

export function prefetchStream(target: PrefetchTarget, stillWanted: () => boolean): void {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	fetchStreamUrl(target.permalink, controller.signal)
		.then(stream => {
			if (!stillWanted() || !isLocalTarget()) return;
			streamPrefetch.set({ ...stream, ...target });
		})
		.catch(() => undefined)
		.finally(() => clearTimeout(timeoutId));
}
