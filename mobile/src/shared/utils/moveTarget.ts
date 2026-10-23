import type { TrackInPlaylist } from '@/types/track.types';
import type { QueueItem } from '@/types/queue.types';

// Index of the row a drop from `from` onto `to` lands after: null for the top,
// undefined when nothing moves or an index is outside the list.
function afterIndexForDrop(length: number, from: number, to: number): number | null | undefined {
	if (from === to) return undefined;
	if (from < 0 || from >= length || to < 0 || to >= length) return undefined;
	if (to === 0) return null;
	// Moving up lands after the row above the target; moving down, after the target row.
	return to < from ? to - 1 : to;
}

// afterRank for dropping the track at `from` onto index `to`: the rank of the
// track it will sit after, null for the top, undefined when nothing moves.
export function afterRankForDrop(
	tracks: TrackInPlaylist[],
	from: number,
	to: number
): string | null | undefined {
	const index = afterIndexForDrop(tracks.length, from, to);
	return index == null ? index : tracks[index].rank;
}

// null: right after the current item; undefined: nothing moves.
export function afterItemIdForDrop(
	upcoming: QueueItem[],
	from: number,
	to: number
): string | null | undefined {
	const index = afterIndexForDrop(upcoming.length, from, to);
	return index == null ? index : upcoming[index].id;
}
