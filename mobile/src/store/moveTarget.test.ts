import { afterRankFor } from '@/store/moveTarget';
import type { TrackInPlaylist } from '@/types/track.types';

const tracks = ['a', 'h', 'p', 't'].map((rank, i) => ({ id: `${i}`, rank }) as TrackInPlaylist);

describe('afterRankFor', () => {
	it('moves up by dropping after the track two rows above', () => {
		expect(afterRankFor(tracks, 2, 'up')).toBe('a');
	});

	it('moves the second track to the top', () => {
		expect(afterRankFor(tracks, 1, 'up')).toBeNull();
	});

	it('moves down by dropping after the next track', () => {
		expect(afterRankFor(tracks, 1, 'down')).toBe('p');
	});

	it('moves the second to last track to the bottom', () => {
		expect(afterRankFor(tracks, 2, 'down')).toBe('t');
	});

	it('cannot move past the edges or outside the list', () => {
		expect(afterRankFor(tracks, 0, 'up')).toBeUndefined();
		expect(afterRankFor(tracks, 3, 'down')).toBeUndefined();
		expect(afterRankFor(tracks, 4, 'up')).toBeUndefined();
		expect(afterRankFor([], 0, 'down')).toBeUndefined();
	});
});
