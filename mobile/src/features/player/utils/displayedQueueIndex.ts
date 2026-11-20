import type { QueueItem } from '@/shared/playback/lib/playback';
import { hashStringToNumber } from '@/shared/tracks/lib/trackToSoundCloud';

const queueTrackKey = (item: QueueItem) => hashStringToNumber(item.track.trackUri);

export function displayedQueueIndex(
	items: QueueItem[],
	currentItemId: string | null,
	trackId: number | null
): number {
	if (trackId === null) return -1;
	const current = items.findIndex(item => item.id === currentItemId);
	const nearest = items.reduce<number>((best, item, index) => {
		if (queueTrackKey(item) !== trackId) return best;
		return best < 0 || Math.abs(index - current) < Math.abs(best - current) ? index : best;
	}, -1);
	return nearest >= 0 ? nearest : current;
}
