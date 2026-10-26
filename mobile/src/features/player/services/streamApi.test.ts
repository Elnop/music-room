import { apiRequest } from '@/shared/services/api';
import { fetchStreamUrl } from './streamApi';

jest.mock('@/shared/services/api', () => ({ apiRequest: jest.fn() }));

const mockApiRequest = apiRequest as jest.Mock;
const EXPIRES_AT = '2026-01-01T00:30:00.000Z';
const signal = new AbortController().signal;

describe('fetchStreamUrl', () => {
	it.each(['hls', 'progressive'] as const)('keeps the %s protocol of the answer', async protocol => {
		mockApiRequest.mockResolvedValueOnce({ streamUrl: 'u', protocol, expiresAt: EXPIRES_AT });

		expect(await fetchStreamUrl('https://soundcloud.com/a/b', signal)).toEqual({
			streamUrl: 'u',
			protocol,
			expiresAt: Date.parse(EXPIRES_AT),
		});
	});

	it('reads an answer with no protocol, from an older server, as HLS', async () => {
		mockApiRequest.mockResolvedValueOnce({ streamUrl: 'u', expiresAt: EXPIRES_AT });

		expect((await fetchStreamUrl('https://soundcloud.com/a/b', signal)).protocol).toBe('hls');
	});
});
