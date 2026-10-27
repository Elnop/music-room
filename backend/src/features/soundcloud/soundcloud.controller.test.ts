import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStreamUrl, getTrack, search } from '@/features/soundcloud/soundcloud.controller.js';
import { mockResponse } from '@/test/mock-response.js';

const { searchTracks, findTrack, streamUrl } = vi.hoisted(() => ({
	searchTracks: vi.fn(),
	findTrack: vi.fn(),
	streamUrl: vi.fn(),
}));

vi.mock('@/features/soundcloud/services/soundcloud-search.service.js', () => ({
	searchTracks,
	getTrack: findTrack,
}));
vi.mock('@/features/soundcloud/services/soundcloud-stream.service.js', () => ({
	getStreamUrl: streamUrl,
}));

const TRACK_URL = 'https://soundcloud.com/artist/track';
const STREAM = {
	streamUrl: 'https://cf-hls-media.sndcdn.com/x.m3u8',
	protocol: 'hls',
	expiresAt: '2026-01-01T00:30:00.000Z',
};

function request(parts: { query?: object; params?: object } = {}): Request {
	return { query: {}, params: {}, headers: {}, ...parts } as unknown as Request;
}

async function call(handler: typeof search, req: Request) {
	const res = mockResponse();
	await handler(req, res as unknown as Response);
	return res;
}

beforeEach(() => {
	searchTracks.mockReset();
	findTrack.mockReset();
	streamUrl.mockReset().mockResolvedValue(STREAM);
});

describe('soundcloud.controller', () => {
	it('search parses the query with its defaults and answers the results', async () => {
		searchTracks.mockResolvedValue({ collection: [] });

		const res = await call(search, request({ query: { q: 'lofi' } }));

		expect(searchTracks).toHaveBeenCalledWith({ q: 'lofi', limit: 20, offset: 0 });
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({ success: true, data: { collection: [] } });
	});

	it('search refuses an empty query before calling SoundCloud', async () => {
		await expect(call(search, request({ query: { q: '' } }))).rejects.toMatchObject({
			name: 'ZodError',
		});
		expect(searchTracks).not.toHaveBeenCalled();
	});

	it('getTrack answers the track of a numeric id', async () => {
		findTrack.mockResolvedValue({ id: 1 });

		const res = await call(getTrack, request({ params: { urlOrId: '123' } }));

		expect(findTrack).toHaveBeenCalledWith('123');
		expect(res.body).toMatchObject({ success: true, data: { id: 1 } });
	});

	it.each([
		['query', { query: { url: encodeURIComponent(TRACK_URL) } }],
		['legacy path', { params: { trackUrl: TRACK_URL } }],
	])('getStreamUrl decodes the %s url and answers the stream URL', async (_label, parts) => {
		const res = await call(getStreamUrl, request(parts));

		expect(streamUrl).toHaveBeenCalledWith(TRACK_URL);
		expect(res.body).toMatchObject({ success: true, data: STREAM });
	});

	it('getStreamUrl throws 400 MISSING_TRACK_URL without a url', async () => {
		await expect(call(getStreamUrl, request({ query: { url: '' } }))).rejects.toMatchObject({
			statusCode: 400,
			code: 'MISSING_TRACK_URL',
		});
		expect(streamUrl).not.toHaveBeenCalled();
	});

	it('getStreamUrl refuses a url outside SoundCloud', async () => {
		await expect(
			call(getStreamUrl, request({ query: { url: 'https://evil.example/x' } }))
		).rejects.toMatchObject({ name: 'ZodError' });
		expect(streamUrl).not.toHaveBeenCalled();
	});

	it('getStreamUrl lets a service failure through to errorHandler', async () => {
		const failure = new Error('down');
		streamUrl.mockRejectedValue(failure);

		await expect(call(getStreamUrl, request({ query: { url: TRACK_URL } }))).rejects.toBe(failure);
	});
});
