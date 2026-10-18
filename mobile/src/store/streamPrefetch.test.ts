import { STREAM_RENEW_MARGIN_MS, isStreamStale, streamPrefetch } from '@/store/streamPrefetch';

const NOW = 1_000_000_000;
const MINUTE_MS = 60 * 1000;

const entry = (expiresAt: number | null = NOW + 30 * MINUTE_MS) => ({
	queueItemId: 'b',
	permalink: 'https://soundcloud.com/artist/b',
	streamUrl: 'ub',
	expiresAt,
});

beforeEach(() => streamPrefetch.clear());

describe('isStreamStale', () => {
	it('is stale within the renewal margin only', () => {
		expect(isStreamStale(null, NOW)).toBe(false);
		expect(isStreamStale(NOW + STREAM_RENEW_MARGIN_MS + 1, NOW)).toBe(false);
		expect(isStreamStale(NOW + STREAM_RENEW_MARGIN_MS - 1, NOW)).toBe(true);
	});
});

describe('streamPrefetch', () => {
	it('returns a matching fresh entry once, then nothing', () => {
		streamPrefetch.set(entry());

		expect(streamPrefetch.take('b', 'https://soundcloud.com/artist/b', NOW)).toEqual(entry());
		expect(streamPrefetch.peek()).toBeNull();
		expect(streamPrefetch.take('b', 'https://soundcloud.com/artist/b', NOW)).toBeNull();
	});

	it('keeps an entry for another item or track', () => {
		streamPrefetch.set(entry());

		expect(streamPrefetch.take('c', 'https://soundcloud.com/artist/b', NOW)).toBeNull();
		expect(streamPrefetch.take('b', 'https://soundcloud.com/artist/c', NOW)).toBeNull();
		expect(streamPrefetch.take(null, 'https://soundcloud.com/artist/b', NOW)).toBeNull();
		expect(streamPrefetch.peek()).toEqual(entry());
	});

	it('drops a matching entry about to expire', () => {
		streamPrefetch.set(entry(NOW + MINUTE_MS));

		expect(streamPrefetch.take('b', 'https://soundcloud.com/artist/b', NOW)).toBeNull();
		expect(streamPrefetch.peek()).toBeNull();
	});

	it('uses an entry with an unknown expiry', () => {
		streamPrefetch.set(entry(null));

		expect(streamPrefetch.take('b', 'https://soundcloud.com/artist/b', NOW)?.streamUrl).toBe('ub');
	});
});
