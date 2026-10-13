import { afterItemIdForDrop, afterRankForDrop } from '@/store/moveTarget';
import type { TrackInPlaylist } from '@/types/track.types';
import type { QueueItem } from '@/types/queue.types';

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

const upcoming = ['u1', 'u2', 'u3', 'u4'].map(id => ({ id }) as QueueItem);

describe('afterItemIdForDrop', () => {
	it('drags down by dropping after the target item', () => {
		expect(afterItemIdForDrop(upcoming, 0, 2)).toBe('u3');
		expect(afterItemIdForDrop(upcoming, 1, 3)).toBe('u4');
	});

	it('drags to the top, right after the current item', () => {
		expect(afterItemIdForDrop(upcoming, 3, 0)).toBeNull();
	});

	it('drags up mid list by dropping after the item above the target', () => {
		expect(afterItemIdForDrop(upcoming, 3, 1)).toBe('u1');
	});

	it('sends nothing when the item is dropped where it was', () => {
		expect(afterItemIdForDrop(upcoming, 1, 1)).toBeUndefined();
	});

	it('ignores indexes outside the list', () => {
		expect(afterItemIdForDrop(upcoming, 4, 0)).toBeUndefined();
		expect(afterItemIdForDrop(upcoming, 0, -1)).toBeUndefined();
		expect(afterItemIdForDrop([], 0, 0)).toBeUndefined();
	});
});
