import type { QueueItem } from '@/features/playback/shared/player/types/queueTypes';
import type { QueueSplit } from '@/features/playback/features/queue-modal/queueModalTypes';

export function splitQueue(items: QueueItem[], currentItemId: string | null): QueueSplit {
	const index = currentItemId === null ? -1 : items.findIndex(item => item.id === currentItemId);
	return {
		current: index === -1 ? null : items[index],
		upcoming: items.slice(index + 1),
	};
}
