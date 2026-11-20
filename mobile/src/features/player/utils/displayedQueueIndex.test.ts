import type { QueueItem } from '@/shared/playback/playback';
import { hashStringToNumber } from '@/shared/utils/trackToSoundCloud';
import { displayedQueueIndex } from './displayedQueueIndex';

const item = (id: string, uri: string): QueueItem => ({
	id,
	rank: id,
	track: { trackUri: uri, title: uri, artist: 'a', album: null, albumArt: null, durationMs: 1000 },
	sourcePlaylistId: null,
	blockId: null,
	blockDetached: false,
});

const RIPPED = 'https://soundcloud.com/a/ripped-pants';
const VICTORY = 'https://soundcloud.com/a/sweet-victory';
const items = [
	item('i0', RIPPED),
	item('i1', 'https://soundcloud.com/a/other'),
	item('i2', RIPPED),
	item('i3', VICTORY),
];

describe('displayedQueueIndex', () => {
	it('shows the current item when it holds the playing track', () => {
		expect(displayedQueueIndex(items, 'i3', hashStringToNumber(VICTORY))).toBe(3);
	});

	it('keeps the duplicate next to the current item while the track catches up', () => {
		expect(displayedQueueIndex(items, 'i3', hashStringToNumber(RIPPED))).toBe(2);
	});

	it('falls back to the current item when the track is not in the queue', () => {
		expect(displayedQueueIndex(items, 'i1', 42)).toBe(1);
	});

	it('shows nothing without a track', () => {
		expect(displayedQueueIndex(items, 'i1', null)).toBe(-1);
	});
});
