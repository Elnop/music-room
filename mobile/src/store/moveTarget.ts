import type { TrackInPlaylist } from '@/types/track.types';

// afterRank for moving the track at `index` one row up or down: the rank of the
// track it will sit after, null for the top, undefined when it cannot move.
export function afterRankFor(
	tracks: TrackInPlaylist[],
	index: number,
	direction: 'up' | 'down'
): string | null | undefined {
	if (index < 0 || index >= tracks.length) return undefined;
	if (direction === 'up') {
		if (index === 0) return undefined;
		return index === 1 ? null : tracks[index - 2].rank;
	}
	if (index === tracks.length - 1) return undefined;
	return tracks[index + 1].rank;
}
