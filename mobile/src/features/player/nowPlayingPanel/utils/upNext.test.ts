import type { OwnerQueue, QueueItem } from '@/shared/types/playback';
import { upNext } from './upNext';

const item = (id: string): QueueItem => ({
	id,
	rank: id,
	track: {
		trackUri: `https://soundcloud.com/a/${id}`,
		title: id,
		artist: 'Artist',
		album: null,
		albumArt: null,
		durationMs: 1000,
	},
	sourcePlaylistId: null,
	blockId: null,
	blockDetached: false,
});

const queue = (currentItemId: string | null, ids: string[]): OwnerQueue => ({
	currentItemId,
	items: ids.map(item),
	version: 1,
});

describe('upNext', () => {
	it('takes the first items after the current one and counts the rest', () => {
		const result = upNext(queue('b', ['a', 'b', 'c', 'd', 'e']), 2);
		expect(result.current?.id).toBe('b');
		expect(result.items.map(next => next.id)).toEqual(['c', 'd']);
		expect(result.total).toBe(3);
	});

	it('has nothing after the last item', () => {
		const result = upNext(queue('b', ['a', 'b']), 5);
		expect(result.items).toEqual([]);
		expect(result.total).toBe(0);
	});

	it('shows the whole queue when nothing is current', () => {
		const result = upNext(queue(null, ['a', 'b']), 5);
		expect(result.current).toBeNull();
		expect(result.items.map(next => next.id)).toEqual(['a', 'b']);
	});
});
