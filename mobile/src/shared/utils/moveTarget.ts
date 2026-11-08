import type { TrackInPlaylist } from '@/types/track.types';
import type { QueueItem } from '@/types/queue.types';

function afterIndexForDrop(length: number, from: number, to: number): number | null | undefined {
	if (from === to) return undefined;
	if (from < 0 || from >= length || to < 0 || to >= length) return undefined;
	if (to === 0) return null;
	return to < from ? to - 1 : to;
}

export function afterRankForDrop(
	tracks: TrackInPlaylist[],
	from: number,
	to: number
): string | null | undefined {
	const index = afterIndexForDrop(tracks.length, from, to);
	return index == null ? index : tracks[index].rank;
}

export function afterItemIdForDrop(
	upcoming: QueueItem[],
	from: number,
	to: number
): string | null | undefined {
	const index = afterIndexForDrop(upcoming.length, from, to);
	return index == null ? index : upcoming[index].id;
}
