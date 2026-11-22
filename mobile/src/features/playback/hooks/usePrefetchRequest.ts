import { useEffect, useRef } from 'react';
import { prefetchStream } from '@/features/playback/lib/nextTrackPrefetch';
import type { NextQueueItem } from '@/features/playback/types/playbackEngineTypes';

export function usePrefetchRequest(next: NextQueueItem, enabled: boolean): void {
	const nextKeyRef = useRef(next.key);
	const requestedRef = useRef<string | null>(null);
	const { key, id, permalink } = next;

	useEffect(() => {
		nextKeyRef.current = key;
	}, [key]);

	useEffect(() => {
		if (!enabled || key === null || id === null || permalink === null) return;
		const request = `${next.playingItemId} ${key}`;
		if (requestedRef.current === request) return;
		requestedRef.current = request;
		prefetchStream({ queueItemId: id, permalink }, () => nextKeyRef.current === key);
	}, [enabled, key, id, permalink, next.playingItemId]);
}
