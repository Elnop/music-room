import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';

const { takeUpstreamSlot } = vi.hoisted(() => ({ takeUpstreamSlot: vi.fn() }));

vi.mock('@/shared/security/upstream-slot.js', () => ({ takeUpstreamSlot }));

const { geocodeAddress } = await import('@/features/events/services/geocode.service.js');

const ADDRESS = '96 boulevard Bessières, 75017 Paris';
const MATCH = { lat: '48.8966', lon: '2.3185', display_name: '96, Boulevard Bessières, Paris' };

const fetchMock = vi.fn();

function answer(body: unknown, status = 200) {
	fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

describe('geocodeAddress', () => {
	beforeEach(() => {
		takeUpstreamSlot.mockReset().mockResolvedValue(undefined);
		fetchMock.mockReset();
		vi.stubGlobal('fetch', fetchMock);
		vi.spyOn(logger, 'warn').mockImplementation(() => logger);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('returns the first match as numbers', async () => {
		answer([MATCH]);

		await expect(geocodeAddress(ADDRESS)).resolves.toEqual({
			latitude: 48.8966,
			longitude: 2.3185,
			displayName: MATCH.display_name,
		});
	});

	it('asks Nominatim for one result, with an identifying User-Agent, after taking its slot', async () => {
		answer([MATCH]);
		await geocodeAddress(ADDRESS);

		expect(takeUpstreamSlot).toHaveBeenCalledWith('nominatim', {
			intervalMs: 1000,
			maxWaitMs: 3000,
		});
		const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
		expect(url.origin + url.pathname).toBe('https://nominatim.openstreetmap.org/search');
		expect(Object.fromEntries(url.searchParams)).toEqual({
			format: 'jsonv2',
			limit: '1',
			q: ADDRESS,
		});
		expect((init.headers as Record<string, string>)['User-Agent']).toMatch(/^Zumik\//);
	});

	it('returns null when nothing matches', async () => {
		answer([]);
		await expect(geocodeAddress('nowhere at all')).resolves.toBeNull();
	});

	it('does not call Nominatim when no slot is granted', async () => {
		const busy = new AppError(429, 'busy', 'RATE_LIMIT_EXCEEDED');
		takeUpstreamSlot.mockRejectedValue(busy);

		await expect(geocodeAddress(ADDRESS)).rejects.toBe(busy);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it.each([
		['an error status', () => answer({ error: 'blocked' }, 403)],
		['a network failure', () => fetchMock.mockRejectedValue(new TypeError('fetch failed'))],
		['an unexpected shape', () => answer({ lat: 1 })],
	])('answers 502 GEOCODER_UNAVAILABLE on %s', async (_case, arrange) => {
		arrange();
		await expect(geocodeAddress(ADDRESS)).rejects.toMatchObject({
			statusCode: 502,
			code: 'GEOCODER_UNAVAILABLE',
		});
	});
});
