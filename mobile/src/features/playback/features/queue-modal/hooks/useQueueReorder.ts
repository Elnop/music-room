import { useCallback, useState } from 'react';
import { useQueueState } from '@/features/playback/shared/player/hooks/useQueueState';
import { afterItemIdForDrop } from '@/shared/tracks/lib/moveTarget';
import type { QueueItem } from '@/features/playback/shared/player/types/queueTypes';

export function useQueueReorder(upcoming: QueueItem[]) {
	const moveItem = useQueueState(state => state.moveItem);
	const [isMoving, setIsMoving] = useState(false);

	const onReorder = useCallback(
		async (from: number, to: number) => {
			const afterItemId = afterItemIdForDrop(upcoming, from, to);
			if (afterItemId === undefined) return;
			setIsMoving(true);
			try {
				await moveItem(upcoming[from].id, afterItemId);
			} finally {
				setIsMoving(false);
			}
		},
		[upcoming, moveItem]
	);

	return { isMoving, onReorder };
}
