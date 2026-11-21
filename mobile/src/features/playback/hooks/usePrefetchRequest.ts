import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { prefetchStream } from '@/features/playback/lib/nextTrackPrefetch';
import type { NextQueueItem } from '@/features/playback/playbackEngineTypes';

export function usePrefetchRequest(
	next: NextQueueItem,
	enabled: boolean,
	requestedKeyRef: RefObject<string | null>
): void {
	const nextKeyRef = useRef(next.key);
	const { key, id, permalink } = next;

	useEffect(() => {
		nextKeyRef.current = key;
	}, [key]);

	useEffect(() => {
		if (!enabled || key === null || id === null || permalink === null) return;
		if (requestedKeyRef.current === key) return;
		requestedKeyRef.current = key;
		prefetchStream({ queueItemId: id, permalink }, () => nextKeyRef.current === key);
	}, [enabled, key, id, permalink, requestedKeyRef]);
}
