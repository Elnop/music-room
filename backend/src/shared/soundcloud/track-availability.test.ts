import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as availability from '@/shared/soundcloud/track-availability.js';

const m = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/shared/soundcloud/soundcloud-client.js', () => ({
	soundcloud: { tracks: { get: m.get } },
}));
vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const URI = 'https://soundcloud.com/artist/song';

beforeEach(() => {
	vi.clearAllMocks();
});

const transcoded = (...protocols: string[]) => ({
	media: { transcodings: protocols.map(protocol => ({ format: { protocol } })) },
});

describe('isPlayable', () => {
	it.each([
		['an HLS stream', { policy: 'MONETIZE', ...transcoded('hls') }, true],
		['a progressive stream', transcoded('progressive'), true],
		['a 30-second preview', { policy: 'SNIP', ...transcoded('hls', 'progressive') }, true],
		['encrypted streams only (DRM)', transcoded('cbc-encrypted-hls', 'ctr-encrypted-hls'), false],
		['blocked in the region', { policy: 'BLOCK', ...transcoded('hls') }, false],
		['no transcoding', { media: { transcodings: [] } }, false],
		['no media', {}, false],
	])('%s', (_label, track, expected) => {
		expect(availability.isPlayable(track)).toBe(expected);
	});
});

describe('checkTrackAvailability', () => {
	it('answers available for a playable track', async () => {
		m.get.mockResolvedValue({ policy: 'ALLOW', ...transcoded('hls') });
		await expect(availability.checkTrackAvailability(URI)).resolves.toBe('available');
		expect(m.get).toHaveBeenCalledWith(URI);
	});

	it('answers unavailable for a blocked track', async () => {
		m.get.mockResolvedValue({ policy: 'BLOCK', ...transcoded('hls') });
		await expect(availability.checkTrackAvailability(URI)).resolves.toBe('unavailable');
	});

	it('answers unavailable for a deleted or private track (404)', async () => {
		m.get.mockRejectedValue(new Error('Status code 404'));
		await expect(availability.checkTrackAvailability(URI)).resolves.toBe('unavailable');
	});

	it.each([new Error('Status code 429'), new Error('fetch failed')])(
		'answers unknown when SoundCloud fails (%s)',
		async error => {
			m.get.mockRejectedValue(error);
			await expect(availability.checkTrackAvailability(URI)).resolves.toBe('unknown');
		}
	);
});
