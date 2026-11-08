import type { OwnerQueue, QueueItem } from '@/shared/types/playback';

interface UpNext {
	current: QueueItem | null;
	items: QueueItem[];
	total: number;
}

export function upNext(queue: OwnerQueue, count: number): UpNext {
	const index =
		queue.currentItemId === null
			? -1
			: queue.items.findIndex(item => item.id === queue.currentItemId);
	const after = queue.items.slice(index + 1);
	return {
		current: index === -1 ? null : queue.items[index],
		items: after.slice(0, count),
		total: after.length,
	};
}
