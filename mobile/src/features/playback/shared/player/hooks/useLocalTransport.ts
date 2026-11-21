import { useCallback } from 'react';
import { usePlayer } from '@/features/playback/shared/player/hooks/usePlayer';
import { useQueueSteps } from '@/features/playback/shared/player/hooks/useQueueSteps';
import { previousAction } from '@/features/playback/shared/player/lib/previousAction';
import { queueStore } from '@/features/playback/shared/player/stores/queueStore';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

type LocalTransport = Pick<NowPlaying, 'next' | 'previous' | 'hasNext' | 'hasPrevious'>;

function playNextInQueue(): void {
	void queueStore.getState().next();
}

export function useLocalTransport(positionMs: number): LocalTransport {
	const { player, seekTo } = usePlayer();
	const steps = useQueueSteps();

	const previous = useCallback(() => {
		if (!player) return;
		if (previousAction(positionMs / 1000, steps.hasPrevious) === 'restart') {
			seekTo(0);
		} else {
			void queueStore.getState().previous();
		}
	}, [player, seekTo, positionMs, steps.hasPrevious]);

	return { ...steps, previous, next: playNextInQueue };
}
