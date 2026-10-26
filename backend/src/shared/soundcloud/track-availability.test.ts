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

describe('isPlayable', () => {
	it.each([
		['streamable', { policy: 'ALLOW', streamable: true }, true],
		['with transcodings only', { media: { transcodings: [{}] } }, true],
		['a 30-second preview', { policy: 'SNIP', streamable: true }, true],
		['blocked in the region', { policy: 'BLOCK', streamable: true }, false],
		[
			'neither streamable nor transcoded',
			{ streamable: false, media: { transcodings: [] } },
			false,
		],
	])('%s', (_label, track, expected) => {
		expect(availability.isPlayable(track)).toBe(expected);
	});
});

describe('checkTrackAvailability', () => {
	it('answers available for a playable track', async () => {
		m.get.mockResolvedValue({ policy: 'ALLOW', streamable: true });
		await expect(availability.checkTrackAvailability(URI)).resolves.toBe('available');
		expect(m.get).toHaveBeenCalledWith(URI);
	});

	it('answers unavailable for a blocked track', async () => {
		m.get.mockResolvedValue({ policy: 'BLOCK', streamable: true });
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
