import type { TrackInPlaylist } from '@/types/track.types';

// afterRank for dropping the track at `from` onto index `to`: the rank of the
// track it will sit after, null for the top, undefined when nothing moves.
export function afterRankForDrop(
	tracks: TrackInPlaylist[],
	from: number,
	to: number
): string | null | undefined {
	if (from === to) return undefined;
	if (from < 0 || from >= tracks.length || to < 0 || to >= tracks.length) return undefined;
	if (to === 0) return null;
	// Moving up lands after the row above the target; moving down, after the target row.
	return to < from ? tracks[to - 1].rank : tracks[to].rank;
}
