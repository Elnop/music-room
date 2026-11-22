import { useCallback } from 'react';
import { useQueueState } from '@/features/playback/shared/player/hooks/useQueueState';
import type { QueueRowActions } from '@/features/playback/features/queue-modal/queueModalTypes';

export function useQueueRowActions(
	onShowActions: QueueRowActions['onShowActions'],
): QueueRowActions {
	const playItem = useQueueState((state) => state.playItem);
	const onRemove = useQueueState((state) => state.removeItem);
	const onPlay = useCallback(
		(itemId: string) => {
			void playItem(itemId);
		},
		[playItem],
	);
	return { onPlay, onRemove, onShowActions };
}
