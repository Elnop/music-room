import { useActiveOwnerId } from '@/features/playback/shared/player/hooks/useActiveOwnerId';
import { useQueueState } from '@/features/playback/shared/player/hooks/useQueueState';
import { selectQueue } from '@/features/playback/shared/player/lib/queueSelectors';
import type { OwnerQueue } from '@/features/playback/shared/player/types/queueTypes';

export function useActiveQueue(): OwnerQueue {
	const ownerId = useActiveOwnerId();
	return useQueueState((state) => selectQueue(state, ownerId));
}
