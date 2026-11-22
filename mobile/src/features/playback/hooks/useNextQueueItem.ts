import { useActiveQueue } from '@/features/playback/shared/player/hooks/useActiveQueue';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { nextItem } from '@/features/playback/shared/player/lib/queueNavigation';
import { trackToSoundCloud } from '@/features/playback/shared/player/lib/trackToSoundCloud';
import type { NextQueueItem } from '@/features/playback/types/playbackEngineTypes';

export function useNextQueueItem(): NextQueueItem {
	const queue = useActiveQueue();
	const playingItemId = usePlayerState(state => state.queueItemId);
	const next = nextItem(queue);
	const permalink = next ? trackToSoundCloud(next).permalink_url : null;

	return {
		currentId: queue.currentItemId,
		playingItemId,
		id: next?.id ?? null,
		permalink,
		key: next && permalink !== null ? `${next.id} ${permalink}` : null,
		stepping: playingItemId !== null && playingItemId !== queue.currentItemId,
	};
}
