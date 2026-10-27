import type { OwnerQueue, QueueItem } from '@/shared/types/playback';

interface UpNext {
	current: QueueItem | null;
	/** The first items after the current one. */
	items: QueueItem[];
	/** Every item after the current one, shown or not. */
	total: number;
}

/** Without a current item the whole queue is still to come. */
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
