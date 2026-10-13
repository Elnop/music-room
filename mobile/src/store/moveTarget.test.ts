import { afterRankForDrop } from '@/store/moveTarget';
import type { TrackInPlaylist } from '@/types/track.types';

const tracks = ['a', 'h', 'p', 't'].map((rank, i) => ({ id: `${i}`, rank }) as TrackInPlaylist);

describe('afterRankForDrop', () => {
	it('drags down by dropping after the target row', () => {
		expect(afterRankForDrop(tracks, 1, 3)).toBe('t');
		expect(afterRankForDrop(tracks, 0, 1)).toBe('h');
	});

	it('drags up to the top', () => {
		expect(afterRankForDrop(tracks, 2, 0)).toBeNull();
	});

	it('drags up mid list by dropping after the row above the target', () => {
		expect(afterRankForDrop(tracks, 3, 1)).toBe('a');
	});

	it('sends nothing when the track is dropped where it was', () => {
		expect(afterRankForDrop(tracks, 2, 2)).toBeUndefined();
	});

	it('ignores indexes outside the list', () => {
		expect(afterRankForDrop(tracks, 4, 0)).toBeUndefined();
		expect(afterRankForDrop(tracks, 0, 4)).toBeUndefined();
		expect(afterRankForDrop(tracks, -1, 1)).toBeUndefined();
		expect(afterRankForDrop([], 0, 1)).toBeUndefined();
	});
});
