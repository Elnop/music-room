import { useMemo } from 'react';
import { useActiveQueue } from '@/features/playback/shared/player/hooks/useActiveQueue';
import { splitQueue } from '@/features/playback/features/queue-modal/lib/splitQueue';
import type { QueueSplit } from '@/features/playback/features/queue-modal/queueModalTypes';

export function useQueueSplit(): QueueSplit {
	const { items, currentItemId } = useActiveQueue();
	return useMemo(() => splitQueue(items, currentItemId), [items, currentItemId]);
}
