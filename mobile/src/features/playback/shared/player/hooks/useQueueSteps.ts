import { useActiveQueue } from '@/features/playback/shared/player/hooks/useActiveQueue';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import {
	selectHasNext,
	selectHasPrevious,
} from '@/features/playback/shared/player/lib/queueNavigation';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

type QueueSteps = Pick<NowPlaying, 'hasNext' | 'hasPrevious'>;

export function useQueueSteps(): QueueSteps {
	const queueItemId = usePlayerState(state => state.queueItemId);
	const queue = useActiveQueue();
	return {
		hasPrevious: selectHasPrevious(queue) && queueItemId !== null,
		hasNext: selectHasNext(queue),
	};
}
