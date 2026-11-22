import { useEffect } from 'react';
import { useIsLocalTarget } from '@/features/playback/hooks/useIsLocalTarget';
import { useNextQueueItem } from '@/features/playback/hooks/useNextQueueItem';
import { usePrefetchRequest } from '@/features/playback/hooks/usePrefetchRequest';
import { usePrefetchWindow } from '@/features/playback/hooks/usePrefetchWindow';
import { dropStalePrefetch } from '@/features/playback/lib/nextTrackPrefetch';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import type { AudioPlayer } from '@/features/playback/shared/player/types/playerTypes';

export function useNextTrackPrefetch(player: AudioPlayer): void {
	const isPlaying = usePlayerState((state) => state.playbackState === 'playing');
	const isLocal = useIsLocalTarget();
	const next = useNextQueueItem();
	const inWindow = usePrefetchWindow(player);

	useEffect(() => {
		dropStalePrefetch(isLocal, next.key, next.currentId);
	}, [isLocal, next.key, next.currentId]);

	usePrefetchRequest(next, isLocal && isPlaying && inWindow && !next.stepping);
}
